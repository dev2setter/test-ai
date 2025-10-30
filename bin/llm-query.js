"use strict";
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
exports.LLMQueryInterface = void 0;
exports.demonstrateLLMQueries = demonstrateLLMQueries;
const database_repo_1 = require("./database.repo");
const dummy_data_loader_1 = require("./dummy-data-loader");
// ========================================
// LLM QUERY INTERFACE CLASS
// ========================================
class LLMQueryInterface {
    constructor(db) {
        this.db = db;
    }
    // Generate system prompt for LLM to understand the database
    generateSystemPrompt() {
        const context = this.db.prepareLLMContext();
        return `You are a SQL query assistant for a SQLite database with vector similarity search capabilities.

DATABASE SCHEMA:
${JSON.stringify(context.database_info.tables, null, 2)}

RELATIONSHIPS:
${context.database_info.relationships.join('\n')}

CURRENT STATISTICS:
- Documents: ${context.database_info.statistics.documents}
- Embeddings: ${context.database_info.statistics.embeddings}
- Orphaned documents: ${context.database_info.statistics.orphaned_documents}

SAMPLE DATA:
${JSON.stringify(context.sample_data.recent_documents, null, 2)}

QUERY RULES:
1. Only generate SELECT, INSERT, UPDATE, or DELETE queries
2. Use proper SQLite syntax
3. Always use parameterized queries with ? placeholders when needed
4. Return only the SQL query, no explanations unless asked
5. For text searches, use LIKE with % wildcards
6. Join tables when you need both document content and embedding info

EXAMPLE QUERIES:
${context.query_examples.join('\n')}

Respond with SQL queries that answer the user's natural language questions.`;
    }
    // Process natural language query (you would integrate with your LLM here)
    async processNaturalLanguageQuery(userQuery) {
        console.log(`🤖 Processing query: "${userQuery}"`);
        // This is where you would call your LLM (OpenAI, Claude, etc.)
        // For demo purposes, I'll show some example mappings
        const queryMappings = {
            'show all documents': 'SELECT id, title, content, created_at FROM documents ORDER BY created_at DESC',
            'count documents': 'SELECT COUNT(*) as total_documents FROM documents',
            'recent documents': 'SELECT id, title, created_at FROM documents ORDER BY created_at DESC LIMIT 10',
            'documents with embeddings': `
        SELECT d.id, d.title, d.created_at
        FROM documents d 
        JOIN embeddings e ON d.id = e.document_id 
        ORDER BY d.created_at DESC
      `,
            'find machine learning': `
        SELECT id, title, content 
        FROM documents 
        WHERE title LIKE '%machine learning%' OR content LIKE '%machine learning%'
      `,
            'documents this month': `
        SELECT id, title, created_at 
        FROM documents 
        WHERE created_at >= date('now', 'start of month')
      `,
        };
        const normalizedQuery = userQuery.toLowerCase();
        // Find best matching query
        for (const [key, sql] of Object.entries(queryMappings)) {
            if (normalizedQuery.includes(key.toLowerCase())) {
                console.log(`✅ Mapped to SQL: ${sql}`);
                return sql;
            }
        }
        // If no mapping found, return a generic query
        console.log('⚠️  No direct mapping found, returning generic query');
        return 'SELECT id, title, created_at FROM documents ORDER BY created_at DESC LIMIT 10';
    }
    // Execute natural language query
    async queryWithNaturalLanguage(userQuery) {
        try {
            console.log('\n🔍 Natural Language Query Interface');
            console.log(`User Query: "${userQuery}"`);
            // Process the query to get SQL
            const sql = await this.processNaturalLanguageQuery(userQuery);
            // Execute the SQL
            const results = this.db.executeQuery(sql);
            console.log('\n📊 Query Results:');
            if (Array.isArray(results)) {
                console.log(`Found ${results.length} results:`);
                results.forEach((row, index) => {
                    console.log(`${index + 1}. ${JSON.stringify(row, null, 2)}`);
                });
            }
            else {
                console.log(`Operation result: ${JSON.stringify(results, null, 2)}`);
            }
            return results;
        }
        catch (error) {
            console.error('❌ Error processing natural language query:', error);
            throw error;
        }
    }
    // Semantic search with natural language
    async semanticSearch(query, useEmbeddingAPI = false) {
        console.log(`\n🧠 Semantic Search: "${query}"`);
        if (useEmbeddingAPI) {
            // Here you would call an embedding API (OpenAI, etc.)
            console.log('📡 Would call embedding API here...');
            console.log('   For now, using random embedding for demo');
        }
        // Generate or get query embedding
        const queryEmbedding = (0, dummy_data_loader_1.generateRandomEmbedding)(384);
        // Use existing vector similarity search
        const results = this.db.searchSimilar(queryEmbedding, 5);
        console.log('🎯 Semantic search results:');
        results.forEach((result, index) => {
            console.log(`${index + 1}. "${result.title}"`);
            console.log(`   Similarity: ${result.similarity.toFixed(4)}`);
            console.log(`   Content preview: ${result.content.substring(0, 100)}...`);
        });
        return results;
    }
    // Hybrid search: combine text search and semantic search
    async hybridSearch(query, textWeight = 0.3, semanticWeight = 0.7) {
        console.log(`\n🔄 Hybrid Search: "${query}"`);
        console.log(`   Text weight: ${textWeight}, Semantic weight: ${semanticWeight}`);
        // Text search
        const textResults = this.db.searchByText(query, 10);
        console.log(`📝 Text search found ${textResults.length} results`);
        // Semantic search
        const queryEmbedding = (0, dummy_data_loader_1.generateRandomEmbedding)(384);
        const semanticResults = this.db.searchSimilar(queryEmbedding, 10);
        console.log(`🧠 Semantic search found ${semanticResults.length} results`);
        // Combine results (simple approach - you could implement more sophisticated ranking)
        const combinedResults = new Map();
        // Add text results
        textResults.forEach(doc => {
            combinedResults.set(doc.id, {
                ...doc,
                textScore: textWeight,
                semanticScore: 0,
                totalScore: textWeight
            });
        });
        // Add semantic results
        semanticResults.forEach(doc => {
            const existing = combinedResults.get(doc.id);
            if (existing) {
                existing.semanticScore = doc.similarity * semanticWeight;
                existing.totalScore = existing.textScore + existing.semanticScore;
                existing.similarity = doc.similarity;
            }
            else {
                combinedResults.set(doc.id, {
                    ...doc,
                    textScore: 0,
                    semanticScore: doc.similarity * semanticWeight,
                    totalScore: doc.similarity * semanticWeight
                });
            }
        });
        // Sort by total score
        const finalResults = Array.from(combinedResults.values())
            .sort((a, b) => b.totalScore - a.totalScore)
            .slice(0, 5);
        console.log('🎯 Hybrid search results:');
        finalResults.forEach((result, index) => {
            console.log(`${index + 1}. "${result.title}"`);
            console.log(`   Total Score: ${result.totalScore.toFixed(4)} (Text: ${result.textScore.toFixed(4)}, Semantic: ${result.semanticScore.toFixed(4)})`);
        });
        return finalResults;
    }
}
exports.LLMQueryInterface = LLMQueryInterface;
// Demo function
async function demonstrateLLMQueries() {
    console.log('🚀 LLM Query Interface Demo\n');
    // Use persistent database - need to import here to avoid circular dependency
    const { connectDB } = await Promise.resolve().then(() => __importStar(require('./create-db')));
    const dbInstance = connectDB();
    const db = new database_repo_1.DatabaseRepository(dbInstance);
    const llmInterface = new LLMQueryInterface(db);
    try {
        // Add some sample documents
        console.log('📝 Adding sample documents...');
        db.insertDocument('Machine Learning Fundamentals', 'Introduction to machine learning algorithms, supervised learning, unsupervised learning, and neural networks.', (0, dummy_data_loader_1.generateRandomEmbedding)(384));
        db.insertDocument('Database Design Principles', 'Relational database design, normalization, indexing, and query optimization techniques.', (0, dummy_data_loader_1.generateRandomEmbedding)(384));
        db.insertDocument('Python Programming Guide', 'Comprehensive guide to Python programming including data structures, functions, and object-oriented programming.', (0, dummy_data_loader_1.generateRandomEmbedding)(384));
        // Show system prompt
        console.log('\n📋 System Prompt for LLM:');
        console.log(llmInterface.generateSystemPrompt());
        // Test natural language queries
        const testQueries = [
            'show all documents',
            'count documents',
            'find machine learning',
            'recent documents'
        ];
        for (const query of testQueries) {
            await llmInterface.queryWithNaturalLanguage(query);
        }
        // Test semantic search
        await llmInterface.semanticSearch('artificial intelligence and algorithms');
        // Test hybrid search
        await llmInterface.hybridSearch('machine learning');
    }
    finally {
        db.close();
        console.log('🔒 LLM query demo completed (database.db remains persistent)');
    }
}
// Run demo if executed directly
if (require.main === module) {
    demonstrateLLMQueries().catch(error => {
        console.error('❌ Demo failed:', error);
        process.exit(1);
    });
}
//# sourceMappingURL=llm-query.js.map