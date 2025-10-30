"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RealLLMIntegration = void 0;
exports.showInstallationInstructions = showInstallationInstructions;
exports.demonstrateRealLLMIntegration = demonstrateRealLLMIntegration;
const create_db_1 = require("./create-db");
const database_repo_1 = require("./database.repo");
const dummy_data_loader_1 = require("./dummy-data-loader");
const llm_query_1 = require("./llm-query");
// ========================================
// REAL LLM INTEGRATION CLASS
// ========================================
class RealLLMIntegration extends llm_query_1.LLMQueryInterface {
    constructor(repo, apiKey = null) {
        super(repo);
        this.apiKey = apiKey;
    }
    // OpenAI Integration Example
    async callOpenAI(prompt, userQuery) {
        if (!this.apiKey) {
            console.log('⚠️  No API key provided, using mock response');
            return this.getMockSQLResponse(userQuery);
        }
        try {
            // This is how you would integrate with OpenAI
            const messages = [
                { role: 'system', content: prompt },
                { role: 'user', content: userQuery }
            ];
            console.log('📡 Calling OpenAI API...');
            // Uncomment and modify this when you have the openai package installed
            /*
            const openai = new OpenAI({ apiKey: this.apiKey });
            const response = await openai.chat.completions.create({
              model: 'gpt-4',
              messages: messages,
              max_tokens: 200,
              temperature: 0.1
            });
            
            return response.choices[0].message.content.trim();
            */
            // Mock response for demo
            return this.getMockSQLResponse(userQuery);
        }
        catch (error) {
            console.error('❌ OpenAI API error:', error);
            return this.getMockSQLResponse(userQuery);
        }
    }
    // Mock SQL response for demo purposes
    getMockSQLResponse(userQuery) {
        const mockResponses = {
            'show me all documents about machine learning': "SELECT id, title, content FROM documents WHERE title LIKE '%machine learning%' OR content LIKE '%machine learning%'",
            'how many documents do we have': "SELECT COUNT(*) as total_documents FROM documents",
            'show recent documents': "SELECT id, title, created_at FROM documents ORDER BY created_at DESC LIMIT 10",
            'find documents with embeddings': "SELECT d.id, d.title, d.created_at FROM documents d JOIN embeddings e ON d.id = e.document_id",
            'delete old documents': "DELETE FROM documents WHERE created_at < date('now', '-30 days')",
            'update document title': "UPDATE documents SET title = ? WHERE id = ?",
        };
        for (const [key, sql] of Object.entries(mockResponses)) {
            if (userQuery.toLowerCase().includes(key.toLowerCase().substring(0, 10))) {
                return sql;
            }
        }
        return "SELECT id, title, created_at FROM documents ORDER BY created_at DESC LIMIT 5";
    }
    // Enhanced natural language processing
    async processNaturalLanguageQuery(userQuery) {
        console.log(`🤖 Processing with LLM: "${userQuery}"`);
        const systemPrompt = this.generateSystemPrompt();
        const sql = await this.callOpenAI(systemPrompt, userQuery);
        console.log(`✅ LLM generated SQL: ${sql}`);
        return sql;
    }
    // Get embeddings from OpenAI
    async getOpenAIEmbedding(text) {
        if (!this.apiKey) {
            console.log('⚠️  No API key, using random embedding for demo');
            return (0, dummy_data_loader_1.generateRandomEmbedding)(1536); // OpenAI embedding size
        }
        try {
            console.log(`📡 Getting embedding for: "${text.substring(0, 50)}..."`);
            // Uncomment when you have the openai package installed
            /*
            const openai = new OpenAI({ apiKey: this.apiKey });
            const response = await openai.embeddings.create({
              model: 'text-embedding-3-small',
              input: text
            });
            
            return response.data[0].embedding;
            */
            // Mock embedding for demo
            return (0, dummy_data_loader_1.generateRandomEmbedding)(1536);
        }
        catch (error) {
            console.error('❌ OpenAI embedding error:', error);
            return (0, dummy_data_loader_1.generateRandomEmbedding)(1536);
        }
    }
    // Enhanced semantic search with real embeddings
    async enhancedSemanticSearch(query) {
        console.log(`\n🧠 Enhanced Semantic Search: "${query}"`);
        // Get real embedding for the query
        const queryEmbedding = await this.getOpenAIEmbedding(query);
        // Search using the real embedding
        const results = this.db.searchSimilar(queryEmbedding, 5);
        console.log('🎯 Enhanced semantic search results:');
        results.forEach((result, index) => {
            console.log(`${index + 1}. "${result.title}"`);
            console.log(`   Similarity: ${result.similarity.toFixed(4)}`);
            console.log(`   Content: ${result.content.substring(0, 100)}...`);
        });
        return results;
    }
    // Smart document insertion with automatic embedding
    async smartInsertDocument(title, content) {
        console.log(`\n📝 Smart inserting: "${title}"`);
        // Generate embedding for the content
        const embedding = await this.getOpenAIEmbedding(content);
        // Insert document with embedding
        const docId = this.db.insertDocument(title, content, embedding);
        console.log(`✅ Document inserted with AI-generated embedding`);
        return docId;
    }
}
exports.RealLLMIntegration = RealLLMIntegration;
// Installation instructions
function showInstallationInstructions() {
    console.log(`
🔧 TO USE REAL LLM APIS:

1. Install OpenAI package:
   npm install openai

2. Set your API key:
   const llm = new RealLLMIntegration(db, 'your-openai-api-key');

3. Uncomment the API calls in the methods above

4. Example usage:
   
   // Natural language to SQL
   await llm.queryWithNaturalLanguage('show me documents about AI');
   
   // Semantic search with real embeddings
   await llm.enhancedSemanticSearch('artificial intelligence');
   
   // Smart document insertion
   await llm.smartInsertDocument('AI Paper', 'Content about AI...');

📋 SUPPORTED LLM INTEGRATIONS:
- OpenAI GPT-4 (for text-to-SQL)
- OpenAI Embeddings (for semantic search)
- Claude API (similar integration pattern)
- Local LLMs via Ollama
- Hugging Face Inference API

💡 QUERY EXAMPLES:
- "Show me all documents about machine learning"
- "How many documents were created this month?"
- "Find documents similar to 'neural networks'"
- "Delete documents older than 30 days"
- "Update the title of document with ID 5"
`);
}
// Demo with mock LLM
async function demonstrateRealLLMIntegration() {
    console.log('🚀 Real LLM Integration Demo (Mock Mode)\n');
    // Use persistent database
    const dbInstance = (0, create_db_1.connectDB)();
    const db = new database_repo_1.DatabaseRepository(dbInstance);
    const llmInterface = new RealLLMIntegration(db); // No API key = mock mode
    try {
        // Smart document insertion
        await llmInterface.smartInsertDocument('Neural Networks in Computer Vision', 'Deep learning approaches to image recognition using convolutional neural networks and transfer learning techniques.');
        await llmInterface.smartInsertDocument('Database Optimization Strategies', 'Performance tuning for relational databases including indexing, query optimization, and caching strategies.');
        // Test enhanced queries
        const testQueries = [
            'show me all documents about machine learning',
            'how many documents do we have',
            'find documents with embeddings'
        ];
        for (const query of testQueries) {
            await llmInterface.queryWithNaturalLanguage(query);
        }
        // Enhanced semantic search
        await llmInterface.enhancedSemanticSearch('computer vision and deep learning');
        showInstallationInstructions();
    }
    finally {
        db.close();
        console.log('🔒 LLM demo completed (database.db remains persistent)');
    }
}
// Run demo if executed directly
if (require.main === module) {
    demonstrateRealLLMIntegration().catch(error => {
        console.error('❌ Demo failed:', error);
        process.exit(1);
    });
}
//# sourceMappingURL=llm-integration.js.map