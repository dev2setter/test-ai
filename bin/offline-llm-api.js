"use strict";
// ========================================
// OFFLINE LLM API INTERFACE
// ========================================
// Simple JavaScript interface for offline LLM and database communication
Object.defineProperty(exports, "__esModule", { value: true });
exports.OfflineLLMAPI = void 0;
exports.demonstrateOfflineLLMAPI = demonstrateOfflineLLMAPI;
const create_db_1 = require("./create-db");
const crud_repo_1 = require("./crud.repo");
const search_repo_1 = require("./search.repo");
const offline_chat_simple_1 = require("./offline-chat-simple");
// ========================================
// OFFLINE LLM API CLASS
// ========================================
class OfflineLLMAPI {
    constructor() {
        // Initialize database and repositories
        const dbInstance = (0, create_db_1.connectDB)();
        this.crudRepo = new crud_repo_1.CrudRepository(dbInstance);
        this.searchRepo = new search_repo_1.SearchRepository(dbInstance);
    }
    // Initialize offline chat (requires Ollama)
    async initialize() {
        try {
            this.chatService = new offline_chat_simple_1.OfflineChatService(this.searchRepo, this.crudRepo);
            // Check if Ollama is available
            const available = await this.chatService.isAvailable();
            if (!available) {
                console.error('❌ Ollama is not ready');
                console.log('💡 Run: ollama serve');
                console.log('💡 Install models: ollama pull llama3.2:3b && ollama pull nomic-embed-text');
                return false;
            }
            console.log('✅ Offline LLM API initialized');
            return true;
        }
        catch (error) {
            console.error('❌ Failed to initialize offline chat:', error);
            return false;
        }
    }
    // Main chat method
    async chat(message) {
        try {
            if (!this.chatService) {
                return {
                    success: false,
                    error: 'Chat service not initialized. Call initialize() first.'
                };
            }
            const result = await this.chatService.chat(message);
            return {
                success: true,
                response: result.message,
                sources: result.sources,
                confidence: result.confidence,
                model: result.model,
                responseTime: result.responseTime
            };
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }
    // Search database for similar documents
    async searchDatabase(query, limit = 5) {
        try {
            if (!this.chatService) {
                return {
                    success: false,
                    error: 'Chat service not initialized. Call initialize() first.'
                };
            }
            // Generate embedding for search
            const embedding = await this.chatService.generateEmbedding(query);
            const results = this.searchRepo.searchSimilar(embedding, limit);
            return {
                success: true,
                results
            };
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }
    // Add document to database
    async addDocument(title, content) {
        try {
            if (!this.chatService) {
                return {
                    success: false,
                    error: 'Chat service not initialized. Call initialize() first.'
                };
            }
            // Generate embedding for the document (now handled internally by insertDocument)
            const documentId = await this.crudRepo.insertDocument(title, content);
            return {
                success: true,
                documentId
            };
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
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
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }
    // Get conversation history
    getHistory() {
        if (!this.chatService) {
            return [];
        }
        return this.chatService.getHistory();
    }
    // Clear conversation history
    clearHistory() {
        if (!this.chatService) {
            return false;
        }
        this.chatService.clearHistory();
        return true;
    }
    // Check if service is ready
    isReady() {
        return !!this.chatService;
    }
}
exports.OfflineLLMAPI = OfflineLLMAPI;
// ========================================
// USAGE EXAMPLE
// ========================================
async function demonstrateOfflineLLMAPI() {
    console.log('🚀 Offline LLM API Demo\n');
    const api = new OfflineLLMAPI();
    try {
        // Initialize the API
        console.log('🔧 Initializing offline LLM API...');
        const initialized = await api.initialize();
        if (!initialized) {
            console.log('❌ Failed to initialize. Please make sure Ollama is running.');
            return;
        }
        // Get database stats
        const statsResult = await api.getStats();
        if (statsResult.success) {
            console.log('📊 Database stats:', statsResult.stats);
        }
        // Example chat
        console.log('\n💬 Chat example:');
        const chatResult = await api.chat('What documents do you have about machine learning?');
        if (chatResult.success) {
            console.log('🤖 Response:', chatResult.response);
            console.log('📚 Sources:', chatResult.sources);
            console.log('🎯 Confidence:', chatResult.confidence);
            console.log('⚡ Response time:', chatResult.responseTime + 'ms');
        }
        else {
            console.log('❌ Chat error:', chatResult.error);
        }
        // Example search
        console.log('\n🔍 Search example:');
        const searchResult = await api.searchDatabase('artificial intelligence', 3);
        if (searchResult.success) {
            console.log('📄 Found', searchResult.results?.length, 'documents');
            searchResult.results?.forEach((doc, i) => {
                console.log(`   ${i + 1}. ${doc.title} (similarity: ${doc.similarity?.toFixed(3)})`);
            });
        }
        else {
            console.log('❌ Search error:', searchResult.error);
        }
        // Example add document
        console.log('\n📝 Adding document example:');
        const addResult = await api.addDocument('API Documentation', 'This is documentation for the Offline LLM API, showing how to use it for chat and search.');
        if (addResult.success) {
            console.log('✅ Document added with ID:', addResult.documentId);
        }
        else {
            console.log('❌ Add document error:', addResult.error);
        }
    }
    catch (error) {
        console.error('❌ Demo failed:', error);
    }
}
// Run demo if executed directly
if (require.main === module) {
    demonstrateOfflineLLMAPI().catch(console.error);
}
//# sourceMappingURL=offline-llm-api.js.map