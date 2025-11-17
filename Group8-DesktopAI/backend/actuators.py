# backend/actuators.py

# --- Standard Library Imports ---
import datetime
import os
import platform
import re
import socket
import subprocess
import webbrowser
import winreg
from datetime import timedelta

# --- Third-party Library Imports ---
import requests
from dotenv import load_dotenv
from langchain.chains import RetrievalQA, load_summarize_chain
from langchain_community.document_loaders import (Docx2txtLoader, PyMuPDFLoader,
                                                  PyPDFLoader, TextLoader)
from langchain_huggingface import HuggingFaceEmbeddings
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_community.vectorstores import Chroma
from langchain_ollama import ChatOllama

# --- Local Application Imports ---
from scheduler import scheduler, trigger_reminder

load_dotenv()
WEATHER_API_KEY = os.getenv("WEATHER_API_KEY")

# --- Constants and Initializations ---
llm_summarizer = ChatOllama(model="llama3:8b")


# --- Helper Functions ---
def check_internet_connection():
    try:
        socket.create_connection(("8.8.8.8", 53), timeout=3)
        return True
    except OSError:
        pass
    return False


def _build_windows_app_index():
    app_index = {}
    uninstall_keys = [
        r"SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall",
        r"SOFTWARE\WOW6432Node\Microsoft\Windows\CurrentVersion\Uninstall"
    ]
    for key_path in uninstall_keys:
        try:
            with winreg.OpenKey(winreg.HKEY_LOCAL_MACHINE, key_path) as key:
                for i in range(winreg.QueryInfoKey(key)[0]):
                    try:
                        subkey_name = winreg.EnumKey(key, i)
                        with winreg.OpenKey(key, subkey_name) as subkey:
                            display_name = winreg.QueryValueEx(subkey, "DisplayName")[0]
                            if display_name and len(display_name) > 1:
                                simple_exe_name = display_name.split()[0].lower() + ".exe"
                                app_index[display_name.lower()] = simple_exe_name
                    except FileNotFoundError:
                        continue
        except Exception as e:
            print(f"Error scanning registry key {key_path}: {e}")
    app_index["calculator"] = "calc.exe"
    app_index["notepad"] = "notepad.exe"
    app_index["visual studio code"] = "code.exe"
    return app_index


def find_file_in_common_dirs(filename_to_find: str):
    home_dir = os.environ.get("USERPROFILE", os.path.expanduser("~"))
    search_dirs = [os.path.join(home_dir, d) for d in ["Desktop", "Documents", "Downloads"]]
    for directory in search_dirs:
        for root, _, files in os.walk(directory):
            for file_on_disk in files:
                if filename_to_find.lower() == file_on_disk.lower():
                    return os.path.join(root, file_on_disk)
    return None


# --- Actuator Functions ---

def get_current_time():
    return f"The current time is {datetime.datetime.now().strftime('%I:%M %p')}."


def get_current_date():
    return f"Today's date is {datetime.datetime.now().strftime('%A, %B %d, %Y')}."


def open_file_or_app(query: str):
    # Regex to find patterns like "open [target] in [app]"
    in_app_match = re.search(r"(?:open|launch|run)\s+(.+?)\s+(?:in|with|using)\s+(.+)", query, re.IGNORECASE)

    if in_app_match:
        target_name = in_app_match.group(1).strip()
        app_name = in_app_match.group(2).strip()

        # Find the full path of the file
        target_path = find_file_in_common_dirs(target_name)
        if not target_path:
            return f"Sorry, I couldn't find the file '{target_name}'."

        # Find the executable for the app
        app_executable = APP_INDEX.get(app_name.lower())
        if not app_executable:
            return f"Sorry, I don't know how to open the application '{app_name}'."
        
        try:
            # Use subprocess to open the file with the specified app
            subprocess.run([app_executable, target_path], check=True)
            return f"Opening '{target_name}' in {app_name}."
        except Exception as e:
            print(f"Error opening '{target_name}' with '{app_name}': {e}")
            return f"Sorry, I failed to open '{target_name}' in {app_name}."

    else:
        # Fallback to the original, simpler logic if the "in [app]" pattern isn't found
        keywords = ["open", "launch", "start", "run"]
        target_str = " ".join([word for word in query.split() if word.lower() not in keywords]).strip()
        if not target_str:
            return "I'm sorry, I didn't understand what you want to open."
        
        executable = APP_INDEX.get(target_str.lower())
        if not executable:
            found_path = find_file_in_common_dirs(target_str)
            executable = found_path if found_path else target_str
        
        if not executable or not os.path.exists(executable):
             return f"Sorry, I couldn't find a file or application named '{target_str}' to open."

        try:
            if platform.system() == "Windows":
                os.startfile(executable)
            else: # For macOS and Linux
                subprocess.run(['open', executable] if platform.system() == 'Darwin' else ['xdg-open', executable])
            return f"Opening {target_str}."
        except Exception as e:
            print(f"Error opening '{executable}': {e}")
            return f"Sorry, I couldn't find or open '{target_str}'. Please check the name."


# --- New File Creation Actuator ---
def create_file(query: str):
    match = re.search(r"(?:named|called|file)\s+([\w\-. ]+\.\w+)", query, re.IGNORECASE)
    if not match:
        return "I can create a file for you, but I need a name. What would you like to name the file?"

    filename = match.group(1).strip()
    file_path = os.path.join(get_user_documents_path(), filename)

    try:
        if os.path.exists(file_path):
            return f"The file `{filename}` already exists in your Documents folder."

        with open(file_path, "w", encoding="utf-8") as f:
            f.write("")
        return f"File `{filename}` has been created in your Documents folder."
    except Exception as e:
        print(f"Error creating file: {e}")
        return "Sorry, I couldn't create the file due to a system error."

def get_user_documents_path():
    """Returns the path to the user's Documents folder."""
    if platform.system() == "Windows":
        return os.path.join(os.environ['USERPROFILE'], 'Documents')
    else: # For macOS and Linux
        return os.path.join(os.environ['HOME'], 'Documents')

def web_search(query: str):
    keywords = ["search", "google", "find", "look up", "for"]
    search_term = ' '.join([word for word in query.split() if word.lower() not in keywords])
    if not search_term:
        return "I'm sorry, I didn't understand what you want to search for."
    url = f"https://www.google.com/search?q={search_term}"
    webbrowser.open(url)
    return f"Here are the search results for '{search_term}'."

def set_reminder(query: str):
    now = datetime.datetime.now()
    delta = timedelta()
    hours_match = re.search(r'(\d+)\s+hour(s)?', query, re.IGNORECASE)
    minutes_match = re.search(r'(\d+)\s+minute(s)?', query, re.IGNORECASE)
    seconds_match = re.search(r'(\d+)\s+second(s)?', query, re.IGNORECASE)
    if hours_match:
        delta += timedelta(hours=int(hours_match.group(1)))
    if minutes_match:
        delta += timedelta(minutes=int(minutes_match.group(1)))
    if seconds_match:
        delta += timedelta(seconds=int(seconds_match.group(1)))
    if delta.total_seconds() == 0:
        return "I couldn't understand the time. Please use a format like 'in 15 minutes'."
    message = ""
    try:
        message_match = re.search(r'remind me to\s+(.*?)\s+(in|at)', query, re.IGNORECASE)
        if message_match:
            message = message_match.group(1)
        else:
            message_parts = query.split()
            if 'to' in message_parts:
                message = " ".join(message_parts[message_parts.index('to') + 1:])
                message = re.sub(r'\s*(in|at)\s+.*', '', message, flags=re.IGNORECASE).strip()
    except Exception:
        pass
    if not message:
        return "I couldn't figure out the reminder message."
    run_date = now + delta
    scheduler.add_job(trigger_reminder, 'date', run_date=run_date, args=[message])
    return f"Okay, I will remind you to '{message}' at {run_date.strftime('%I:%M %p')}."

def get_weather(query: str):
    city = query.split("in ")[-1].split("for ")[-1]
    if city.lower() == query.lower(): city = "Mumbai" 
    api_url = f"http://api.weatherapi.com/v1/current.json?key={WEATHER_API_KEY}&q={city}&aqi=no"
    try:
        response = requests.get(api_url)
        response.raise_for_status()
        data = response.json()
        location, temp_c, condition = data['location']['name'], data['current']['temp_c'], data['current']['condition']['text']
        return f"The current weather in {location} is {temp_c}°C and the condition is {condition}."
    except Exception: return f"Sorry, I couldn't find the weather for a city named '{city}'."

def summarize_file(query: str):
    filename = ""
    for word in query.split():
        if '.' in word: filename = word.strip(".,?!")
    if not filename: return "I'm sorry, I couldn't identify a filename in your request."
    file_path = find_file_in_common_dirs(filename)
    if not file_path: return f"Sorry, I couldn't find '{filename}'."
    try:
        loader = PyMuPDFLoader(file_path) if file_path.endswith('.pdf') else Docx2txtLoader(file_path) if file_path.endswith('.docx') else TextLoader(file_path)
        docs = loader.load()
        if not docs: return f"'{filename}' appears to be empty."
        chain = load_summarize_chain(llm_summarizer, chain_type="map_reduce")
        summary = chain.invoke(docs)
        return f"Here is a summary of '{filename}':\n\n{summary['output_text']}"
    except Exception as e:
        print(f"Error during summarization: {e}")
        return f"I encountered an error summarizing '{filename}'."
    
def answer_from_file(query: str):
    """Performs RAG with a much more robust parsing strategy."""
    filename_match = re.search(r'([\w\s.-]+\.(?:pdf|docx|txt))', query, re.IGNORECASE)
    if not filename_match:
        return "I couldn't identify a filename in your question. Please include the full filename, like 'Resume.pdf'."

    filename = filename_match.group(1).strip()
    question = re.sub(filename_match.group(0), '', query, flags=re.IGNORECASE)
    question = re.sub(r'\b(in|from|about|ask|what is|what are|what does|tell me)\b', '', question, flags=re.IGNORECASE)
    question = question.strip(' ,.?!')

    if not question or len(question.split()) < 2:
        return f"You mentioned '{filename}', but I don't see a clear question. What would you like to know?"

    file_path = find_file_in_common_dirs(filename)
    if not file_path:
        return f"Sorry, I couldn't find the file '{filename}'."

    try:
        print(f"Loading document for Q&A: {file_path}")
        loader = PyMuPDFLoader(file_path) if file_path.endswith('.pdf') else Docx2txtLoader(file_path) if file_path.endswith('.docx') else TextLoader(file_path)
        documents = loader.load()
        text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200)
        texts = text_splitter.split_documents(documents)
        embeddings = HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")
        vectorstore = Chroma.from_documents(texts, embeddings)
        qa_chain = RetrievalQA.from_chain_type(
            llm=llm_summarizer,
            chain_type="stuff",
            retriever=vectorstore.as_retriever()
        )
        print(f"Answering question: '{question}'")
        result = qa_chain.invoke({"query": question}) 
        return result['result']
    except Exception as e:
        print(f"An error occurred during the RAG process: {e}")
        return "Sorry, I encountered an error while trying to answer your question from the file."

# (The rest of your existing actuators remain unchanged — web_search, get_weather, summarize_file, answer_from_file, etc.)


# --- Global App Index Initialization ---
APP_INDEX = {}
if platform.system() == "Windows":
    print("Building Windows app index from registry...")
    APP_INDEX = _build_windows_app_index()
    print(f"App index built. Found {len(APP_INDEX)} applications.")
