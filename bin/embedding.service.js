"use strict";
// ========================================
// REAL EMBEDDING GENERATION SERVICE
// ========================================
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmbeddingMigration = exports.EmbeddingConfigs = exports.RealWorldEmbeddingExample = exports.LocalEmbeddingService = exports.EmbeddingService = void 0;
// Example integration with OpenAI Embeddings API
class EmbeddingService {
    constructor(apiKey, model = 'text-embedding-3-small') {
        this.apiKey = apiKey;
        this.model = model;
    }
    // Generate real embeddings from text content
    async generateEmbedding(text) {
        try {
            // Clean and prepare text
            const cleanText = this.preprocessText(text);
            // Call OpenAI Embeddings API
            const response = await fetch('https://api.openai.com/v1/embeddings', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: this.model,
                    input: cleanText,
                    encoding_format: 'float'
                })
            });
            if (!response.ok) {
                throw new Error(`OpenAI API error: ${response.statusText}`);
            }
            const data = await response.json();
            return data.data[0].embedding;
        }
        catch (error) {
            console.error('❌ Error generating embedding:', error);
            throw error;
        }
    }
    // Generate embeddings for both title and content
    async generateDocumentEmbedding(title, content) {
        // Combine title and content with proper weighting
        const combinedText = `${title}\n\n${content}`;
        return this.generateEmbedding(combinedText);
    }
    // Batch embedding generation for efficiency
    async generateBatchEmbeddings(texts) {
        try {
            const response = await fetch('https://api.openai.com/v1/embeddings', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: this.model,
                    input: texts.map(text => this.preprocessText(text)),
                    encoding_format: 'float'
                })
            });
            if (!response.ok) {
                throw new Error(`OpenAI API error: ${response.statusText}`);
            }
            const data = await response.json();
            return data.data.map((item) => item.embedding);
        }
        catch (error) {
            console.error('❌ Error generating batch embeddings:', error);
            throw error;
        }
    }
    // Text preprocessing for better embeddings
    preprocessText(text) {
        return text
            .trim()
            .replace(/\s+/g, ' ') // Normalize whitespace
            .replace(/[^\w\s.,!?-]/g, '') // Remove special characters
            .substring(0, 8000); // Limit to model's context window
    }
}
exports.EmbeddingService = EmbeddingService;
// ========================================
// LOCAL EMBEDDING SERVICE (Offline)
// ========================================
class LocalEmbeddingService {
    constructor(modelPath = './models/sentence-transformer') {
        this.modelPath = modelPath;
    }
    // Using sentence-transformers or similar local model
    async generateEmbedding(text) {
        try {
            // This would use a local model like sentence-transformers
            // Example with Python subprocess (you'd need Python + sentence-transformers)
            const { spawn } = require('child_process');
            return new Promise((resolve, reject) => {
                const python = spawn('python', ['-c', `
import json
from sentence_transformers import SentenceTransformer
model = SentenceTransformer('${this.modelPath}')
text = '''${text.replace(/'/g, "\\'")}'''
embedding = model.encode([text])[0].tolist()
print(json.dumps(embedding))
        `]);
                let result = '';
                python.stdout.on('data', (data) => {
                    result += data.toString();
                });
                python.on('close', (code) => {
                    if (code === 0) {
                        try {
                            const embedding = JSON.parse(result.trim());
                            resolve(embedding);
                        }
                        catch (error) {
                            reject(new Error('Failed to parse embedding'));
                        }
                    }
                    else {
                        reject(new Error(`Python process failed with code ${code}`));
                    }
                });
            });
        }
        catch (error) {
            console.error('❌ Error generating local embedding:', error);
            throw error;
        }
    }
}
exports.LocalEmbeddingService = LocalEmbeddingService;
// ========================================
// REAL-WORLD USAGE EXAMPLES
// ========================================
class RealWorldEmbeddingExample {
    constructor(apiKey) {
        this.embeddingService = new EmbeddingService(apiKey);
    }
    // How you would ACTUALLY insert documents in a real app
    async insertDocumentWithRealEmbedding(crudRepo, // Your CrudRepository
    title, content) {
        try {
            console.log(`📝 Generating real embedding for: "${title}"`);
            // Generate REAL embedding from the actual content
            const embedding = await this.embeddingService.generateDocumentEmbedding(title, content);
            console.log(`✅ Generated ${embedding.length}-dimensional embedding`);
            // Insert with real embedding
            return crudRepo.insertDocument(title, content, embedding);
        }
        catch (error) {
            console.error('❌ Failed to insert document with real embedding:', error);
            throw error;
        }
    }
    // How you would ACTUALLY search in a real app
    async searchWithRealEmbedding(searchRepo, // Your SearchRepository
    query, limit = 5) {
        try {
            console.log(`🔍 Generating real embedding for query: "${query}"`);
            // Generate REAL embedding from the search query
            const queryEmbedding = await this.embeddingService.generateEmbedding(query);
            console.log(`✅ Generated query embedding`);
            // Search with real embedding
            return searchRepo.searchSimilar(queryEmbedding, limit);
        }
        catch (error) {
            console.error('❌ Failed to search with real embedding:', error);
            throw error;
        }
    }
    // Batch processing for better efficiency
    async processBatchDocuments(crudRepo, documents) {
        try {
            console.log(`📥 Processing ${documents.length} documents with real embeddings...`);
            // Generate embeddings for all documents at once (more efficient)
            const texts = documents.map(doc => `${doc.title}\n\n${doc.content}`);
            const embeddings = await this.embeddingService.generateBatchEmbeddings(texts);
            console.log(`✅ Generated ${embeddings.length} embeddings`);
            // Insert all documents
            const documentIds = [];
            for (let i = 0; i < documents.length; i++) {
                const docId = crudRepo.insertDocument(documents[i].title, documents[i].content, embeddings[i]);
                documentIds.push(docId);
            }
            return documentIds;
        }
        catch (error) {
            console.error('❌ Failed to process batch documents:', error);
            throw error;
        }
    }
}
exports.RealWorldEmbeddingExample = RealWorldEmbeddingExample;
// ========================================
// CONFIGURATION FOR DIFFERENT SERVICES
// ========================================
exports.EmbeddingConfigs = {
    // OpenAI Embeddings
    openai: {
        model: 'text-embedding-3-small', // 1536 dimensions, $0.02/1M tokens
        maxTokens: 8191,
        dimensions: 1536
    },
    openaiLarge: {
        model: 'text-embedding-3-large', // 3072 dimensions, $0.13/1M tokens
        maxTokens: 8191,
        dimensions: 3072
    },
    // Local models (free but require setup)
    local: {
        model: 'all-MiniLM-L6-v2', // 384 dimensions, fast
        dimensions: 384
    },
    localLarge: {
        model: 'all-mpnet-base-v2', // 768 dimensions, better quality
        dimensions: 768
    }
};
// ========================================
// MIGRATION FROM RANDOM TO REAL
// ========================================
class EmbeddingMigration {
    constructor(apiKey) {
        this.embeddingService = new EmbeddingService(apiKey);
    }
    // Migrate existing documents from random to real embeddings
    async migrateExistingDocuments(crudRepo) {
        try {
            console.log('🔄 Migrating existing documents to real embeddings...');
            const allDocs = crudRepo.getAllDocuments();
            console.log(`Found ${allDocs.length} documents to migrate`);
            let migratedCount = 0;
            for (const doc of allDocs) {
                try {
                    // Generate real embedding
                    const realEmbedding = await this.embeddingService.generateDocumentEmbedding(doc.title, doc.content);
                    // Update the embedding
                    const success = crudRepo.updateEmbedding(doc.id, realEmbedding);
                    if (success) {
                        migratedCount++;
                        console.log(`✅ Migrated document ${doc.id}: "${doc.title}"`);
                    }
                }
                catch (error) {
                    console.error(`❌ Failed to migrate document ${doc.id}:`, error);
                }
            }
            console.log(`🎉 Migration completed: ${migratedCount}/${allDocs.length} documents migrated`);
        }
        catch (error) {
            console.error('❌ Migration failed:', error);
            throw error;
        }
    }
}
exports.EmbeddingMigration = EmbeddingMigration;
// Usage example:
/*
// Real-world setup
const embeddingService = new EmbeddingService('your-openai-api-key');
const realWorldExample = new RealWorldEmbeddingExample('your-openai-api-key');

// Insert document with REAL embedding
await realWorldExample.insertDocumentWithRealEmbedding(
  crudRepo,
  'Machine Learning Fundamentals',
  'Machine learning is a subset of artificial intelligence...'
);

// Search with REAL embedding
const results = await realWorldExample.searchWithRealEmbedding(
  searchRepo,
  'artificial intelligence algorithms'
);
*/ 
//# sourceMappingURL=embedding.service.js.map