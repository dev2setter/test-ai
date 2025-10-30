"use strict";
// ========================================
// JAVASCRIPT LLM API INTERFACE
// ========================================
// Direct JavaScript interface for communicating with your LLM and database
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.LLMDatabaseAPI = void 0;
exports.exampleUsage = exampleUsage;
const create_db_1 = require("./create-db");
const crud_repo_1 = require("./crud.repo");
const search_repo_1 = require("./search.repo");
const offline_chat_simple_1 = require("./offline-chat-simple");
// ========================================
// LLM API CLASS
// ========================================
class LLMDatabaseAPI {
    constructor() {
        this.currentMode = 'offline';
        // Initialize database and repositories
        const dbInstance = (0, create_db_1.connectDB)();
        this.crudRepo = new crud_repo_1.CrudRepository(dbInstance);
        this.searchRepo = new search_repo_1.SearchRepository(dbInstance);
    }
    // Initialize online chat (requires OpenAI API key)
    async initializeOnlineChat(apiKey) {
        try {
            this.onlineChatService = new DatabaseChatService(apiKey, this.searchRepo, this.crudRepo);
            this.currentMode = 'online';
            console.log('✅ Online chat initialized');
            return true;
        }
        catch (error) {
            console.error('❌ Failed to initialize online chat:', error);
            return false;
        }
    }
    // Initialize offline chat (requires Ollama)
    async initializeOfflineChat() {
        try {
            this.offlineChatService = new offline_chat_simple_1.OfflineChatService(this.searchRepo, this.crudRepo);
            // Check if Ollama is available
            const available = await this.offlineChatService.isAvailable();
            if (!available) {
                console.error('❌ Ollama is not ready');
                console.log('💡 Run: ollama serve');
                console.log('� Install models: ollama pull llama3.2:3b && ollama pull nomic-embed-text');
                return false;
            }
            this.currentMode = 'offline';
            console.log('✅ Offline chat initialized');
            return true;
        }
        catch (error) {
            console.error('❌ Failed to initialize offline chat:', error);
            return false;
        }
    }
    // Main chat method - automatically uses available service
    async chat(message) {
        try {
            let result;
            if (this.currentMode === 'online' && this.onlineChatService) {
                result = await this.onlineChatService.chat(message);
            }
            else if (this.currentMode === 'offline' && this.offlineChatService) {
                result = await this.offlineChatService.chat(message);
            }
            else {
                return {
                    success: false,
                    error: 'No chat service initialized. Call initializeOnlineChat() or initializeOfflineChat() first.'
                };
            }
            return {
                success: true,
                response: result.message,
                sources: result.sources,
                confidence: result.confidence,
                model: result.model || this.currentMode,
                responseTime: result.responseTime
            };
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error occurred'
            };
        }
    }
    // Search database directly (without LLM)
    async searchDatabase(query, limit = 5) {
        try {
            // Text search
            const textResults = this.searchRepo.searchByText(query, limit);
            return {
                success: true,
                results: textResults,
                count: textResults.length
            };
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Search failed'
            };
        }
    }
    // Add new document to database
    async addDocument(title, content) {
        try {
            // For now, use random embedding (you'll want to replace this with real embeddings)
            const { generateRandomEmbedding } = await Promise.resolve().then(() => __importStar(require('./dummy-data-loader')));
            const embedding = generateRandomEmbedding(384);
            const docId = this.crudRepo.insertDocument(title, content, embedding);
            return {
                success: true,
                documentId: docId
            };
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to add document'
            };
        }
    }
    // Get all documents
    async getAllDocuments() {
        try {
            const documents = this.crudRepo.getAllDocuments();
            return {
                success: true,
                documents,
                count: documents.length
            };
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to get documents'
            };
        }
    }
    // Get database statistics
    async getStats() {
        try {
            const stats = this.crudRepo.getStats();
            return {
                success: true,
                stats
            };
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to get stats'
            };
        }
    }
    // Switch between online and offline modes
    switchMode(mode) {
        this.currentMode = mode;
        console.log(`🔄 Switched to ${mode} mode`);
    }
    // Get current mode
    getCurrentMode() {
        return this.currentMode;
    }
    // Close database connection
    close() {
        this.crudRepo.close();
        console.log('🔒 Database connection closed');
    }
}
exports.LLMDatabaseAPI = LLMDatabaseAPI;
// ========================================
// SIMPLE USAGE EXAMPLES
// ========================================
async function exampleUsage() {
    console.log('🚀 LLM Database API Usage Examples\n');
    // Create API instance
    const api = new LLMDatabaseAPI();
    try {
        // Example 1: Initialize offline chat
        console.log('1. Initializing offline chat...');
        const offlineReady = await api.initializeOfflineChat();
        if (offlineReady) {
            // Example 2: Chat with LLM
            console.log('2. Chatting with offline LLM...');
            const chatResult = await api.chat('What is machine learning?');
            if (chatResult.success) {
                console.log('✅ Chat Response:', chatResult.response);
                console.log('📚 Sources:', chatResult.sources);
                console.log('🎯 Confidence:', chatResult.confidence);
            }
            else {
                console.log('❌ Chat Error:', chatResult.error);
            }
        }
        // Example 3: Search database directly
        console.log('3. Searching database...');
        const searchResult = await api.searchDatabase('machine learning');
        if (searchResult.success) {
            console.log(`✅ Found ${searchResult.count} documents`);
            searchResult.results?.forEach((doc, i) => {
                console.log(`   ${i + 1}. ${doc.title}`);
            });
        }
        // Example 4: Get database statistics
        console.log('4. Getting database stats...');
        const statsResult = await api.getStats();
        if (statsResult.success) {
            console.log('✅ Database Stats:', statsResult.stats);
        }
        // Example 5: Add new document
        console.log('5. Adding new document...');
        const addResult = await api.addDocument('API Test Document', 'This document was added via the JavaScript API interface.');
        if (addResult.success) {
            console.log('✅ Document added with ID:', addResult.documentId);
        }
    }
    catch (error) {
        console.error('❌ Example failed:', error);
    }
    finally {
        // Always close the connection
        api.close();
    }
}
// ========================================
// EXPORT FOR DIRECT USAGE
// ========================================
// For direct import and usage in other JavaScript files
exports.default = LLMDatabaseAPI;
// Run examples if this is the main module
if (require.main === module) {
    exampleUsage().catch(console.error);
}
//# sourceMappingURL=llm-api.js.map