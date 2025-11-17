# backend/vector_memory.py

import chromadb
from langchain_huggingface import HuggingFaceEmbeddings

# Initialize a persistent ChromaDB client
# This will save the database to a 'chroma_db' folder in your backend directory
client = chromadb.PersistentClient(path="chroma_db")

# Use the same embedding model as our RAG for consistency
embeddings = HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")

# Get or create a "collection" (like a table in a SQL database)
# --- DELETED the block that clears memory on startup ---
# try:
#     client.delete_collection(name="conversation_history")
#     print("Cleared previous conversation memory.")
# except Exception:
#     pass  # Fails if the collection doesn't exist, which is fine
# --- END OF DELETED BLOCK ---

collection = client.get_or_create_collection(name="conversation_history")

# A counter for unique IDs
doc_id_counter = 0

def add_to_memory(user_query: str, assistant_response: str):
    """Adds a user query and assistant response to the vector memory."""
    global doc_id_counter
    
    # We'll store both sides of the conversation as separate documents
    documents_to_add = [f"User: {user_query}", f"Assistant: {assistant_response}"]
    ids_to_add = [f"doc_{doc_id_counter}", f"doc_{doc_id_counter + 1}"]
    
    collection.add(
        documents=documents_to_add,
        ids=ids_to_add
    )
    doc_id_counter += 2
    print(f"Added to conversation memory: {documents_to_add}")

def retrieve_from_memory(query: str, n_results: int = 2) -> str:
    """Retrieves the most relevant past conversation snippets for a given query."""
    results = collection.query(
        query_texts=[query],
        n_results=n_results
    )
    
    # Join the retrieved snippets into a single context string
    retrieved_docs = "\n".join(results['documents'][0])
    print(f"Retrieved context: {retrieved_docs}")
    return retrieved_docs
