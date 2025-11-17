// --- Get references to DOM elements ---
const form = document.getElementById('input-form');
const input = document.getElementById('query-input');
const conversationDisplay = document.getElementById('conversation-display');
const historyList = document.querySelector('.history');
const newChatBtn = document.querySelector('.new-chat-btn');
const sidebar = document.querySelector('.sidebar');
const sidebarToggle = document.getElementById('sidebar-toggle');
const onlineToggle = document.getElementById('online-switch');

// --- Global State ---
let currentChatId = null;
let isOnline = false;

// --- Event Listeners ---

// Load history when the app starts
window.addEventListener('DOMContentLoaded', loadHistory);

// Handle form submission
form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const userQuery = input.value.trim();
    if (!userQuery) return;

    addMessage(userQuery, 'user');
    input.value = '';

    const placeholderId = addMessage('...', 'assistant', true);
    const assistantMessageElement = document.getElementById(placeholderId);
    
    // Check if the placeholder element was found
    if (!assistantMessageElement) {
        console.error("Could not find placeholder element to stream into.");
        return;
    }

    try {
        const response = await fetch('http://127.0.0.1:8000/process-query', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: userQuery, chat_id: currentChatId, is_online: isOnline })
        });

        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
        
        const contentType = response.headers.get('content-type');

        if (contentType && contentType.includes('text/plain')) {
            // Handle STREAMING response for conversations
            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                const chunk = decoder.decode(value);
                assistantMessageElement.textContent += chunk;
                conversationDisplay.scrollTop = conversationDisplay.scrollHeight;
            }
        } else {
            // Handle JSON response for actuators
            const data = await response.json();
            assistantMessageElement.textContent = data.response_text;
            currentChatId = data.chat_id;
        }

    } catch (error) {
        console.error('Error processing query:', error);
        assistantMessageElement.textContent = 'Sorry, an error occurred. Please check the console.';
    } finally {
        await loadHistory();
    }
});

// Handle clicks on history items
historyList.addEventListener('click', (e) => {
    if (e.target && e.target.classList.contains('history-item')) {
        const chatId = e.target.dataset.chatId;
        loadChat(chatId);
    }
});

// Handle "New Chat" button click
newChatBtn.addEventListener('click', () => {
    currentChatId = null;
    conversationDisplay.innerHTML = `
        <div class="welcome-screen">
            <h1>VeerAI</h1>
            <p>Your Intelligent Desktop Assistant</p>
        </div>`;
});

// Handle Sidebar Toggle button click
sidebarToggle.addEventListener('click', () => {
    sidebar.classList.toggle('closed');
});

// Handle Online Features toggle
onlineToggle.addEventListener('change', () => {
    isOnline = onlineToggle.checked;
    console.log(`Online features are now ${isOnline ? 'ENABLED' : 'DISABLED'}`);
});

// --- Helper Functions ---

function addMessage(text, sender, isPlaceholder = false) {
    const welcomeScreen = document.querySelector('.welcome-screen');
    if (welcomeScreen) welcomeScreen.remove();

    const messageId = `msg-${Date.now()}`;
    let messageNode;

    if (sender === 'assistant') {
        const wrapper = document.createElement('div');
        wrapper.classList.add('assistant-message-wrapper');

        const messageElement = document.createElement('div');
        messageElement.classList.add('message', 'assistant-message');
        messageElement.textContent = text; // This line sets the placeholder text like "..."
        
        if (isPlaceholder) {
            messageElement.id = messageId;
        }
        
        const copyBtn = document.createElement('button');
        copyBtn.classList.add('copy-btn');
        copyBtn.textContent = 'Copy';
        copyBtn.onclick = () => {
            navigator.clipboard.writeText(messageElement.textContent);
            copyBtn.textContent = 'Copied!';
            setTimeout(() => { copyBtn.textContent = 'Copy'; }, 2000);
        };
        
        wrapper.appendChild(messageElement);
        wrapper.appendChild(copyBtn);
        messageNode = wrapper;
    } else { // For 'user'
        const messageElement = document.createElement('div');
        messageElement.classList.add('message', 'user-message');
        messageElement.textContent = text;
        messageNode = messageElement;
    }

    conversationDisplay.appendChild(messageNode);
    conversationDisplay.scrollTop = conversationDisplay.scrollHeight;
    
    return messageId;
}

async function loadHistory() {
    try {
        const response = await fetch('http://127.0.0.1:8000/history');
        const historyData = await response.json();
        
        historyList.innerHTML = '';
        historyData.forEach(chat => {
            const chatElement = document.createElement('div');
            chatElement.classList.add('history-item');
            chatElement.textContent = chat.title.substring(0, 30) + (chat.title.length > 30 ? '...' : '');
            chatElement.dataset.chatId = chat.chat_id;
            historyList.appendChild(chatElement);
        });
    } catch (error) {
        console.error('Failed to load history:', error);
    }
}

async function loadChat(chatId) {
    try {
        const response = await fetch(`http://127.0.0.1:8000/chat/${chatId}`);
        const messages = await response.json();
        
        conversationDisplay.innerHTML = '';
        messages.forEach(msg => {
            addMessage(msg.user_query, 'user');
            addMessage(msg.assistant_response, 'assistant');
        });
        currentChatId = chatId;
    } catch (error) {
        console.error(`Failed to load chat ${chatId}:`, error);
    }
}