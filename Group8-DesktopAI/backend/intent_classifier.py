# backend/intent_classifier.py

import torch
import numpy as np
# --- STEP 2.1: Import the shared classes and functions ---
from model_utils import bag_of_words, tokenize, NeuralNet

# --- Main Prediction Logic ---

device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
FILE = "intent_data.pth"
data = torch.load(FILE)

# Extract saved data
input_size = data["input_size"]
hidden_size = data["hidden_size"]
output_size = data["output_size"]
all_words = data["all_words"]
tags = data["tags"]
model_state = data["model_state"]

# Load the trained model
model = NeuralNet(input_size, hidden_size, output_size).to(device)
model.load_state_dict(model_state)
model.eval() # Set model to evaluation mode

def predict_intent(sentence):
    """
    Takes a sentence from the user, processes it, and predicts the intent tag.
    """
    tokenized_sentence = tokenize(sentence)
    X = bag_of_words(tokenized_sentence, all_words)
    X = X.reshape(1, X.shape[0])
    X = torch.from_numpy(X).to(device)

    output = model(X)
    _, predicted = torch.max(output, dim=1)
    tag = tags[predicted.item()]

    # Use softmax to get probabilities
    probs = torch.softmax(output, dim=1)
    prob = probs[0][predicted.item()]

    # If confidence is high enough, return the tag, otherwise, classify as 'Conversation'
    if prob.item() > 0.75:
        return tag
    else:
        # This is a fallback. If the model is not confident,
        # we can assume it's a general conversation topic.
        return "Conversation"