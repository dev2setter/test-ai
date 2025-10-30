"use strict";
// ========================================
// SIMPLE WEB CHAT INTERFACE
// ========================================
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.startServer = startServer;
const express_1 = __importDefault(require("express"));
const chat_interface_1 = require("./chat-interface");
const create_db_1 = require("./create-db");
const crud_repo_1 = require("./crud.repo");
const search_repo_1 = require("./search.repo");
const app = (0, express_1.default)();
app.use(express_1.default.json());
app.use(express_1.default.static('public'));
let chatService;
// Initialize chat service
async function initializeChatService() {
    const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
    if (!OPENAI_API_KEY) {
        throw new Error('OPENAI_API_KEY environment variable is required');
    }
    const dbInstance = (0, create_db_1.connectDB)();
    const crudRepo = new crud_repo_1.CrudRepository(dbInstance);
    const searchRepo = new search_repo_1.SearchRepository(dbInstance);
    const stats = crudRepo.getStats();
    if (stats.documents === 0) {
        throw new Error('Database is empty. Please add documents first.');
    }
    chatService = new chat_interface_1.DatabaseChatService(OPENAI_API_KEY, searchRepo, crudRepo);
    console.log(`✅ Chat service initialized with ${stats.documents} documents`);
}
// API Routes
app.post('/api/chat', async (req, res) => {
    try {
        const { message } = req.body;
        if (!message) {
            return res.status(400).json({ error: 'Message is required' });
        }
        const response = await chatService.chat(message);
        return res.json(response);
    }
    catch (error) {
        console.error('Chat error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});
app.get('/api/stats', async (req, res) => {
    try {
        const stats = await chatService.getStats();
        return res.json(stats);
    }
    catch (error) {
        return res.status(500).json({ error: 'Failed to get stats' });
    }
});
app.get('/api/history', (req, res) => {
    try {
        const history = chatService.getHistory();
        return res.json(history);
    }
    catch (error) {
        return res.status(500).json({ error: 'Failed to get history' });
    }
});
app.delete('/api/history', (req, res) => {
    try {
        chatService.clearHistory();
        return res.json({ success: true });
    }
    catch (error) {
        return res.status(500).json({ error: 'Failed to clear history' });
    }
});
// Serve HTML
app.get('/', (req, res) => {
    res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Database Chat Assistant</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            height: 100vh;
            display: flex;
            justify-content: center;
            align-items: center;
        }
        .chat-container {
            width: 90%;
            max-width: 800px;
            height: 80vh;
            background: white;
            border-radius: 15px;
            box-shadow: 0 20px 40px rgba(0,0,0,0.1);
            display: flex;
            flex-direction: column;
            overflow: hidden;
        }
        .chat-header {
            background: #4a90e2;
            color: white;
            padding: 20px;
            text-align: center;
            font-size: 1.2em;
            font-weight: 600;
        }
        .chat-messages {
            flex: 1;
            overflow-y: auto;
            padding: 20px;
            display: flex;
            flex-direction: column;
            gap: 15px;
        }
        .message {
            max-width: 80%;
            padding: 12px 18px;
            border-radius: 18px;
            animation: fadeIn 0.3s ease-in;
        }
        .user-message {
            background: #4a90e2;
            color: white;
            align-self: flex-end;
            border-bottom-right-radius: 5px;
        }
        .assistant-message {
            background: #f1f3f5;
            color: #333;
            align-self: flex-start;
            border-bottom-left-radius: 5px;
        }
        .sources {
            font-size: 0.8em;
            margin-top: 8px;
            opacity: 0.7;
        }
        .chat-input {
            padding: 20px;
            border-top: 1px solid #eee;
            display: flex;
            gap: 10px;
        }
        .chat-input input {
            flex: 1;
            padding: 12px 18px;
            border: 2px solid #ddd;
            border-radius: 25px;
            outline: none;
            font-size: 1em;
        }
        .chat-input input:focus {
            border-color: #4a90e2;
        }
        .chat-input button {
            padding: 12px 24px;
            background: #4a90e2;
            color: white;
            border: none;
            border-radius: 25px;
            cursor: pointer;
            font-weight: 600;
            transition: background 0.2s;
        }
        .chat-input button:hover {
            background: #357abd;
        }
        .chat-input button:disabled {
            background: #ccc;
            cursor: not-allowed;
        }
        .loading {
            display: none;
            align-self: flex-start;
            padding: 12px 18px;
            background: #f1f3f5;
            border-radius: 18px;
            border-bottom-left-radius: 5px;
        }
        .typing-indicator {
            display: flex;
            gap: 4px;
        }
        .typing-indicator span {
            width: 8px;
            height: 8px;
            border-radius: 50%;
            background: #4a90e2;
            animation: typing 1.4s infinite;
        }
        .typing-indicator span:nth-child(2) { animation-delay: 0.2s; }
        .typing-indicator span:nth-child(3) { animation-delay: 0.4s; }
        @keyframes typing {
            0%, 60%, 100% { transform: translateY(0); }
            30% { transform: translateY(-10px); }
        }
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
        }
        .stats {
            position: absolute;
            top: 20px;
            right: 20px;
            background: rgba(255,255,255,0.9);
            padding: 10px;
            border-radius: 8px;
            font-size: 0.8em;
        }
    </style>
</head>
<body>
    <div class="stats" id="stats">Loading...</div>
    
    <div class="chat-container">
        <div class="chat-header">
            🤖 Database Chat Assistant
        </div>
        
        <div class="chat-messages" id="messages">
            <div class="message assistant-message">
                👋 Hello! I can help you search and ask questions about your database documents. What would you like to know?
            </div>
        </div>
        
        <div class="loading" id="loading">
            <div class="typing-indicator">
                <span></span>
                <span></span>
                <span></span>
            </div>
        </div>
        
        <div class="chat-input">
            <input type="text" id="messageInput" placeholder="Ask me anything about your documents..." maxlength="500">
            <button id="sendButton" onclick="sendMessage()">Send</button>
        </div>
    </div>

    <script>
        const messagesContainer = document.getElementById('messages');
        const messageInput = document.getElementById('messageInput');
        const sendButton = document.getElementById('sendButton');
        const loading = document.getElementById('loading');
        const stats = document.getElementById('stats');

        // Load stats
        async function loadStats() {
            try {
                const response = await fetch('/api/stats');
                const data = await response.json();
                stats.textContent = \`📊 \${data.documents} docs, \${data.embeddings} embeddings\`;
            } catch (error) {
                stats.textContent = '❌ Error loading stats';
            }
        }

        function addMessage(content, isUser = false, sources = []) {
            const message = document.createElement('div');
            message.className = \`message \${isUser ? 'user-message' : 'assistant-message'}\`;
            
            let html = content;
            if (sources && sources.length > 0) {
                html += \`<div class="sources">📚 Sources: \${sources.slice(0, 3).join(', ')}</div>\`;
            }
            
            message.innerHTML = html;
            messagesContainer.appendChild(message);
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }

        function showLoading(show) {
            loading.style.display = show ? 'block' : 'none';
            sendButton.disabled = show;
            if (show) {
                messagesContainer.appendChild(loading);
                messagesContainer.scrollTop = messagesContainer.scrollHeight;
            }
        }

        async function sendMessage() {
            const message = messageInput.value.trim();
            if (!message) return;

            addMessage(message, true);
            messageInput.value = '';
            showLoading(true);

            try {
                const response = await fetch('/api/chat', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ message })
                });

                const data = await response.json();
                
                if (response.ok) {
                    addMessage(data.message, false, data.sources);
                } else {
                    addMessage(\`❌ Error: \${data.error}\`, false);
                }
            } catch (error) {
                addMessage('❌ Network error. Please try again.', false);
            } finally {
                showLoading(false);
            }
        }

        messageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
            }
        });

        // Load initial stats
        loadStats();
    </script>
</body>
</html>
  `);
});
// Start server
async function startServer() {
    try {
        await initializeChatService();
        const PORT = process.env.PORT || 3000;
        app.listen(PORT, () => {
            console.log(`🌐 Web chat interface running at: http://localhost:${PORT}`);
            console.log('💡 Set OPENAI_API_KEY environment variable to enable chat');
        });
    }
    catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
}
// Run if this is the main module
if (require.main === module) {
    startServer().catch(console.error);
}
//# sourceMappingURL=web-chat.js.map