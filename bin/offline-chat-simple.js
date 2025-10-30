"use strict";
// ========================================
// SIMPLIFIED OFFLINE LLM SERVICE
// ========================================
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
exports.OfflineChatService = void 0;
exports.startOfflineChat = startOfflineChat;
const ollama_1 = require("ollama");
const crud_repo_1 = require("./crud.repo");
const search_repo_1 = require("./search.repo");
// ========================================
// SIMPLE OFFLINE CHAT SERVICE
// ========================================
class OfflineChatService {
    constructor(searchRepo, crudRepo, chatModel = 'llama3.2:3b', embeddingModel = 'nomic-embed-text', ollamaInstance) {
        this.conversationHistory = [];
        this.context = [];
        this.ollama = ollamaInstance || new ollama_1.Ollama(); // Use provided instance or create new one
        this.chatModel = chatModel;
        this.embeddingModel = embeddingModel;
        this.searchRepo = searchRepo;
        this.crudRepo = crudRepo;
        // Initialize with system prompt
        this.conversationHistory.push({
            role: 'system',
            content: `You are a helpful AI assistant that searches and answers questions about documents in a local database. 

IMPORTANT INSTRUCTIONS:
- Use ONLY information from the provided documents
- Always cite which documents you reference
- If no relevant information is found, say so clearly
- Keep responses concise but helpful
- Be conversational and friendly

You are running completely offline with no internet access.`
        });
    }
    // Main chat method
    async chat(userMessage) {
        const startTime = Date.now();
        try {
            console.log(`💬 User: ${userMessage}`);
            // Add user message to history
            this.conversationHistory.push({
                role: 'user',
                content: userMessage,
                timestamp: new Date()
            });
            // Step 1: Generate embedding for search
            console.log('🔍 Searching database...');
            const queryEmbedding = await this.generateEmbedding(userMessage);
            // Step 2: Search for relevant documents (with vector compatibility check)
            let searchResults = [];
            try {
                searchResults = this.searchRepo.searchSimilar(queryEmbedding, 5);
            }
            catch (error) {
                console.log('⚠️ Vector dimension mismatch - using text search only');
                searchResults = [];
            }
            const textResults = this.searchRepo.searchByText(userMessage, 3);
            const allResults = this.combineResults(searchResults, textResults);
            console.log(`📊 Found ${allResults.length} relevant documents`);
            // Step 3: Generate LLM response
            const context = this.prepareContext(allResults);
            const llmResponse = await this.generateResponse(userMessage, context);
            // Step 4: Add response to history
            this.conversationHistory.push({
                role: 'assistant',
                content: llmResponse,
                timestamp: new Date(),
                searchResults: allResults
            });
            const responseTime = Date.now() - startTime;
            return {
                message: llmResponse,
                searchResults: allResults,
                sources: allResults.map(doc => doc.title),
                confidence: this.calculateConfidence(allResults),
                model: this.chatModel,
                responseTime
            };
        }
        catch (error) {
            console.error('❌ Chat error:', error);
            throw new Error(`Chat failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    // Generate embeddings
    async generateEmbedding(text) {
        const response = await this.ollama.embeddings({
            model: this.embeddingModel,
            prompt: text.trim().substring(0, 4000)
        });
        return response.embedding;
    }
    // Check if embeddings are compatible
    async checkEmbeddingCompatibility() {
        try {
            // Get a sample document with embedding
            const sampleDoc = this.crudRepo.getDocumentById(1);
            if (!sampleDoc || !sampleDoc.embedding) {
                return {
                    compatible: true,
                    dbDimension: 0,
                    modelDimension: 0,
                    needsMigration: false
                };
            }
            // Get current model's embedding dimension
            const testEmbedding = await this.generateEmbedding("test");
            const dbDimension = sampleDoc.embedding.length;
            const modelDimension = testEmbedding.length;
            return {
                compatible: dbDimension === modelDimension,
                dbDimension,
                modelDimension,
                needsMigration: dbDimension !== modelDimension && dbDimension > 0
            };
        }
        catch (error) {
            return {
                compatible: false,
                dbDimension: 0,
                modelDimension: 0,
                needsMigration: true
            };
        }
    }
    // Re-generate embeddings for all documents with current model
    async migrateEmbeddings() {
        try {
            console.log('🔄 Migrating embeddings to current model...');
            const documents = this.crudRepo.getAllDocuments();
            // Clear existing embeddings
            const dbInstance = this.crudRepo.db;
            dbInstance.prepare('DELETE FROM embeddings').run();
            for (let i = 0; i < documents.length; i++) {
                const doc = documents[i];
                console.log(`Processing ${i + 1}/${documents.length}: ${doc.title}`);
                // Generate new embedding
                const newEmbedding = await this.generateEmbedding(`${doc.title}\n\n${doc.content}`);
                // Insert new embedding
                dbInstance.prepare('INSERT INTO embeddings (document_id, embedding) VALUES (?, ?)').run(doc.id, JSON.stringify(newEmbedding));
            }
            console.log('✅ Embedding migration completed!');
            return true;
        }
        catch (error) {
            console.error('❌ Migration failed:', error);
            return false;
        }
    }
    // Generate LLM response
    async generateResponse(userMessage, context) {
        const systemPrompt = `Based on the following documents from the local database, answer the user's question.

AVAILABLE DOCUMENTS:
${context}

Instructions:
- Use ONLY information from the provided documents
- If documents don't contain relevant information, say so clearly
- Always mention which documents you're referencing
- Be helpful and conversational
- Keep responses concise but informative`;
        const fullPrompt = `${systemPrompt}

User Question: ${userMessage}

Answer:`;
        const response = await this.ollama.generate({
            model: this.chatModel,
            prompt: fullPrompt,
            context: this.context,
            stream: false,
            options: {
                temperature: 0.7,
                top_p: 0.9,
                top_k: 40
            }
        });
        // Update context for future messages
        if (response.context) {
            this.context = response.context;
        }
        return response.response || 'I apologize, but I was unable to generate a response.';
    }
    // Check if Ollama is available
    async isAvailable() {
        try {
            const models = await this.ollama.list();
            const hasChatModel = models.models?.some((model) => model.name.includes(this.chatModel.split(':')[0]));
            const hasEmbeddingModel = models.models?.some((model) => model.name.includes(this.embeddingModel) || model.name.includes('nomic-embed'));
            return hasChatModel && hasEmbeddingModel;
        }
        catch (error) {
            return false;
        }
    }
    // Install required models
    async installModels() {
        try {
            console.log('📥 Installing required models...');
            console.log(`Installing chat model: ${this.chatModel}`);
            await this.ollama.pull({ model: this.chatModel });
            console.log(`Installing embedding model: ${this.embeddingModel}`);
            await this.ollama.pull({ model: this.embeddingModel });
            console.log('✅ All models installed successfully!');
            return true;
        }
        catch (error) {
            console.error('❌ Failed to install models:', error);
            return false;
        }
    }
    // Get available models
    async getAvailableModels() {
        try {
            const models = await this.ollama.list();
            return models.models?.map((model) => model.name) || [];
        }
        catch (error) {
            return [];
        }
    }
    // Switch model
    switchModel(newModel) {
        this.chatModel = newModel;
        this.context = [];
        console.log(`🔄 Switched to model: ${newModel}`);
    }
    // Prepare context from search results
    prepareContext(results) {
        if (results.length === 0) {
            return 'No relevant documents found in the local database.';
        }
        return results.map((doc, index) => {
            return `Document ${index + 1}: "${doc.title}"
Content: ${doc.content.substring(0, 500)}${doc.content.length > 500 ? '...' : ''}
Relevance Score: ${doc.similarity?.toFixed(3) || 'N/A'}
---`;
        }).join('\n\n');
    }
    // Combine search results
    combineResults(vectorResults, textResults) {
        const seen = new Set();
        const combined = [];
        for (const result of vectorResults) {
            if (!seen.has(result.id)) {
                seen.add(result.id);
                combined.push({ ...result, searchType: 'vector' });
            }
        }
        for (const result of textResults) {
            if (!seen.has(result.id)) {
                seen.add(result.id);
                combined.push({ ...result, searchType: 'text' });
            }
        }
        return combined;
    }
    // Calculate confidence
    calculateConfidence(results) {
        if (results.length === 0)
            return 0;
        const avgSimilarity = results
            .filter(r => r.similarity)
            .reduce((sum, r) => sum + r.similarity, 0) / results.length;
        return Math.min(avgSimilarity * 100, 95);
    }
    // Get conversation history
    getHistory() {
        return this.conversationHistory.filter(msg => msg.role !== 'system');
    }
    // Clear conversation history
    clearHistory() {
        this.conversationHistory = this.conversationHistory.filter(msg => msg.role === 'system');
        this.context = [];
    }
    // Get database statistics
    async getStats() {
        return this.crudRepo.getStats();
    }
}
exports.OfflineChatService = OfflineChatService;
// ========================================
// SIMPLE STARTUP FUNCTION
// ========================================
async function startOfflineChat() {
    const { connectDB } = await Promise.resolve().then(() => __importStar(require('./create-db')));
    try {
        console.log('🚀 Starting offline chat...\n');
        // Initialize database and shared Ollama instance
        const dbInstance = connectDB();
        const sharedOllama = new ollama_1.Ollama(); // Single shared instance
        const crudRepo = new crud_repo_1.CrudRepository(dbInstance, 'nomic-embed-text', sharedOllama);
        const searchRepo = new search_repo_1.SearchRepository(dbInstance);
        // Check if database has documents
        const stats = crudRepo.getStats();
        if (stats.documents === 0) {
            console.log('⚠️ Database is empty. Please add documents first.');
            console.log('Run: npm run test');
            return;
        }
        console.log(`📊 Database: ${stats.documents} documents`);
        // Create chat service with shared Ollama instance
        const chatService = new OfflineChatService(searchRepo, crudRepo, 'llama3.2:3b', 'nomic-embed-text', sharedOllama);
        // Check if Ollama is available
        const available = await chatService.isAvailable();
        if (!available) {
            console.log('❌ Ollama not ready!');
            console.log('\n📋 Setup:');
            console.log('   1. Download: https://ollama.ai');
            console.log('   2. Start: ollama serve');
            console.log('   3. Install models: ollama pull llama3.2:3b && ollama pull nomic-embed-text');
            // Try to install models automatically
            console.log('\n🔄 Attempting to install models...');
            const installed = await chatService.installModels();
            if (!installed) {
                console.log('❌ Auto-install failed. Please install manually.');
                return;
            }
        }
        console.log('✅ Offline chat ready!');
        console.log('Available models:', await chatService.getAvailableModels());
        // Check embedding compatibility
        console.log('\n🔍 Checking embedding compatibility...');
        const compatibility = await chatService.checkEmbeddingCompatibility();
        if (compatibility.needsMigration) {
            console.log(`⚠️ Embedding dimension mismatch!`);
            console.log(`   Database: ${compatibility.dbDimension} dimensions`);
            console.log(`   Current model: ${compatibility.modelDimension} dimensions`);
            console.log('\n🔄 Migrating embeddings to current model...');
            const migrated = await chatService.migrateEmbeddings();
            if (!migrated) {
                console.log('❌ Migration failed. Please check the logs.');
                return;
            }
            console.log('✅ Embeddings migrated successfully!');
        }
        else {
            console.log('✅ Embeddings are compatible!');
        }
        // Start console interface
        const { ConsoleChatInterface } = await Promise.resolve().then(() => __importStar(require('./chat-interface')));
        const chatInterface = new ConsoleChatInterface(chatService);
        await chatInterface.start();
    }
    catch (error) {
        console.error('❌ Startup failed:', error);
        console.log('\n💡 Make sure Ollama is running: ollama serve');
    }
}
// Run if this is the main module
if (require.main === module) {
    startOfflineChat().catch(console.error);
}
//# sourceMappingURL=offline-chat-simple.js.map