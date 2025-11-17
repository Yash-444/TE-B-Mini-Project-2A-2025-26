# backend/main.py

import uuid  # <-- 1. IMPORT UUID
import asyncio  # <-- NEW: For async streaming
from fastapi import FastAPI, Depends, WebSocket
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from langchain_ollama import ChatOllama
from intent_classifier import predict_intent
from sqlalchemy.orm import Session
from sqlalchemy import desc  # <-- Added for sorting
import database
import scheduler  # Ensures the scheduler starts when the app launches
from vector_memory import add_to_memory, retrieve_from_memory
from vosk import Model, KaldiRecognizer
import json

# --- STEP 1: Import all actuator functions directly ---
from actuators import (
    get_current_time,
    get_current_date,
    open_file_or_app,
    web_search,
    get_weather,
    create_file,
    check_internet_connection,
    set_reminder,
    summarize_file,
    answer_from_file
)

VOSK_MODEL_PATH = "vosk-model"
model = Model(VOSK_MODEL_PATH)
SAMPLE_RATE = 16000.0

# Create the database table on startup
database.create_db_and_tables()

# --- 2. UPDATE PYDANTIC MODELS ---
class QueryRequest(BaseModel):
    text: str
    chat_id: str | None = None  # Allow frontend to send an existing chat_id
    is_online: bool = False


class QueryResponse(BaseModel):
    response_text: str
    intent: str
    chat_id: str  # Always return the chat_id to the frontend


# --- Dependency for getting a DB session ---
def get_db():
    db = database.SessionLocal()
    try:
        yield db
    finally:
        db.close()


# --- LangChain LLM Setup ---
llm = ChatOllama(model="llama3:8b")

# --- FastAPI App ---
app = FastAPI()

# --- List of intents that require an internet connection ---
ONLINE_INTENTS = [
    "WebSearch", "WeatherUpdate", "NewsUpdate", "StockMarket", "Translate",
    "RestaurantSearch", "FlightStatus", "TrafficUpdate", "PublicTransport"
]

# --- STEP 2: Map intents to functions ---
INTENT_ACTION_MAP = {
    "GetTime": get_current_time,
    "GetDate": get_current_date,
    "OpenFile": open_file_or_app,
    "CreateFile": create_file, # <-- Add the new actuator
    "WebSearch": web_search,
    "NewsUpdate": web_search,
    "WeatherUpdate": get_weather,
    "SetReminder": set_reminder,
    "SummarizeFile": summarize_file,
    "QueryFile": answer_from_file,
}

# --- STEP 3: Intents that need user_query as input ---
INTENTS_REQUIRING_QUERY = {
    "OpenFile", "WebSearch", "NewsUpdate", "WeatherUpdate",
    "SetReminder", "SummarizeFile", "QueryFile", "CreateFile"
}

CONVERSATIONAL_INTENTS = {
    "Conversation", "Greetings", "GoodNight", "TellJoke", "DefineWord", "HealthTips"
}


@app.post("/predict-intent")
def get_intent(request: QueryRequest):
    intent = predict_intent(request.text)
    return {"intent": intent}

# --- 3. REPLACE process_query FUNCTION WITH THIS ---
@app.post("/process-query")
async def process_query(request: QueryRequest, db: Session = Depends(get_db)):
    user_query = request.text
    intent = predict_intent(user_query)
    chat_id = request.chat_id if request.chat_id else str(uuid.uuid4())

    # --- UPDATED INTERNET GUARD ---
    # Now it checks both the toggle AND the actual connection
    if intent in ONLINE_INTENTS:
        if not request.is_online:
            return QueryResponse(
                response_text="This feature requires online mode. Please enable the 'Online Features' toggle.",
                intent=intent,
                chat_id=chat_id
            )
        if not check_internet_connection():
            return QueryResponse(
                response_text="This feature requires an internet connection. Please connect and try again.",
                intent=intent,
                chat_id=chat_id
            )

    # --- ROUTE 1: If the intent is conversational, STREAM the response ---
    if intent in CONVERSATIONAL_INTENTS:
        context = retrieve_from_memory(user_query)
        return StreamingResponse(llm_stream_generator(user_query, chat_id, context, db), media_type="text/plain")

    # --- ROUTE 2: If the intent is an actuator, EXECUTE and return JSON ---
    else:
        response_message = ""
        action_function = INTENT_ACTION_MAP.get(intent)

        if action_function:
            # Check if the function needs the user_query
            if intent in INTENTS_REQUIRING_QUERY:
                response_message = action_function(user_query)
            else:
                response_message = action_function()
        else:
            response_message = f"Intent identified: {intent}. (Actuator not yet implemented)."

        # Save to DB
        db_conversation = database.Conversation(
            chat_id=chat_id,
            user_query=user_query,
            assistant_response=response_message,
            intent=intent
        )
        db.add(db_conversation)
        db.commit()

        return QueryResponse(response_text=response_message, intent=intent, chat_id=chat_id)


# --- NEW ASYNC STREAMING FUNCTION ---
async def llm_stream_generator(query: str, chat_id: str, context: str, db: Session):
    prompt = f"""<|begin_of_text|><|start_header_id|>system<|end_header_id|>
    You are VeerAI...
    {context}
    User's new query: {query}<|eot_id|><|start_header_id|>assistant<|end_header_id|>
    """

    full_response = ""
    for chunk in llm.stream(prompt):
        full_response += chunk.content
        yield chunk.content
        await asyncio.sleep(0.01)

    # Save the full exchange to DB and memory AFTER stream is complete
    db_conversation = database.Conversation(
        chat_id=chat_id, user_query=query, assistant_response=full_response, intent="Conversation"
    )
    db.add(db_conversation)
    db.commit()
    add_to_memory(query, full_response)


# --- STREAMING ENDPOINT ---
@app.post("/stream-query")
async def stream_query(request: QueryRequest):
    user_query = request.text
    context = retrieve_from_memory(user_query)
    return StreamingResponse(llm_stream_generator(user_query, context), media_type="text/plain")


# --- NEW ENDPOINT 1: Get list of all chat sessions ---
@app.get("/history")
def get_history(db: Session = Depends(get_db)):
    # This query now correctly orders by chat_id first, then by the timestamp,
    # which satisfies PostgreSQL's rule for using DISTINCT ON.
    # We order by timestamp ASC to get the FIRST message for the title.
    unique_chats = db.query(database.Conversation.chat_id, database.Conversation.user_query)\
                     .distinct(database.Conversation.chat_id)\
                     .order_by(database.Conversation.chat_id, database.Conversation.timestamp.asc())\
                     .all()

    # We will reverse the list in Python to show the most recent chats first in the UI
    history = [{"chat_id": chat[0], "title": chat[1]} for chat in reversed(unique_chats)]
    return history


# --- NEW ENDPOINT 2: Get all messages for a specific chat ---
@app.get("/chat/{chat_id}")
def get_chat_messages(chat_id: str, db: Session = Depends(get_db)):
    messages = (
        db.query(database.Conversation)
        .filter(database.Conversation.chat_id == chat_id)
        .order_by(database.Conversation.timestamp)
        .all()
    )
    return messages


# --- VOSK SPEECH-TO-TEXT WEBSOCKET ---
@app.websocket("/listen")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    recognizer = KaldiRecognizer(model, SAMPLE_RATE)

    try:
        while True:
            data = await websocket.receive_bytes()
            if recognizer.AcceptWaveform(data):
                result = json.loads(recognizer.Result())
                await websocket.send_text(result['text'])
    except Exception as e:
        print(f"WebSocket Error: {e}")
    finally:
        print("WebSocket connection closed")
