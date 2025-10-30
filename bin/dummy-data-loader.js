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
exports.loadDummyData = loadDummyData;
exports.generateRandomEmbedding = generateRandomEmbedding;
exports.generateDocumentsWithEmbeddings = generateDocumentsWithEmbeddings;
exports.getDummyDataStats = getDummyDataStats;
exports.insertDummyDataToDatabase = insertDummyDataToDatabase;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
// ========================================
// DUMMY DATA LOADING UTILITIES
// ========================================
// Load dummy data from JSON file
function loadDummyData() {
    try {
        const dataPath = path.join(__dirname, '..', 'dummy-data.json');
        const jsonData = fs.readFileSync(dataPath, 'utf8');
        return JSON.parse(jsonData);
    }
    catch (error) {
        console.error('❌ Error loading dummy data:', error);
        throw error;
    }
}
// Generate random vector embedding for testing
function generateRandomEmbedding(dimensions = 384) {
    return Array.from({ length: dimensions }, () => Math.random() * 2 - 1);
}
// Generate embeddings for all documents
function generateDocumentsWithEmbeddings(embeddingSize = 384) {
    const documents = loadDummyData();
    return documents.map((doc, index) => ({
        ...doc,
        id: index + 1,
        embedding: generateRandomEmbedding(embeddingSize),
        created_at: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString() // Random date within last 30 days
    }));
}
// Get basic statistics about the dummy data
function getDummyDataStats() {
    const documents = loadDummyData();
    // Get all unique categories
    const categories = [...new Set(documents.map(doc => doc.category))];
    // Get all unique tags
    const allTags = documents.flatMap(doc => doc.tags);
    const uniqueTags = [...new Set(allTags)];
    // Calculate average content length
    const averageContentLength = Math.round(documents.reduce((sum, doc) => sum + doc.content.length, 0) / documents.length);
    // Count documents by category
    const categoryCounts = categories.reduce((acc, category) => {
        acc[category] = documents.filter(doc => doc.category === category).length;
        return acc;
    }, {});
    return {
        totalDocuments: documents.length,
        categories: categories.length,
        totalTags: uniqueTags.length,
        averageContentLength,
        categoryCounts,
        categoryList: categories,
        tagList: uniqueTags
    };
}
// Insert all dummy data into the database
async function insertDummyDataToDatabase(dbRepo) {
    try {
        console.log('📥 Loading dummy data into database...');
        // Load raw dummy data (no need for random embeddings)
        const documents = loadDummyData();
        let insertedCount = 0;
        for (const doc of documents) {
            try {
                // CrudRepository automatically generates Ollama embeddings
                // Pass category and tags as separate parameters so they're stored in dedicated columns
                const docId = await dbRepo.insertDocument(doc.title, doc.content, doc.category, doc.tags);
                insertedCount++;
                if (insertedCount % 5 === 0) {
                    console.log(`   Inserted ${insertedCount}/${documents.length} documents...`);
                }
            }
            catch (error) {
                console.error(`❌ Error inserting document "${doc.title}":`, error.message);
            }
        }
        console.log(`✅ Successfully inserted ${insertedCount} documents with Ollama embeddings`);
        // Display stats
        const stats = dbRepo.getStats();
        console.log('📊 Database Statistics:');
        console.log(`   Total Documents: ${stats.documents}`);
        console.log(`   Total Embeddings: ${stats.embeddings}`);
        console.log(`   Orphaned Documents: ${stats.orphaned_documents}`);
        return insertedCount;
    }
    catch (error) {
        console.error('❌ Error inserting dummy data:', error);
        throw error;
    }
}
// ========================================
// MAIN EXECUTION (when run directly)
// ========================================
async function main() {
    if (require.main === module) {
        try {
            console.log('🚀 Starting dummy data loader...');
            // Import required dependencies
            const { connectDB } = await Promise.resolve().then(() => __importStar(require('./create-db')));
            const { CrudRepository } = await Promise.resolve().then(() => __importStar(require('./crud.repo')));
            // Connect to database
            const dbInstance = connectDB();
            const crudRepo = new CrudRepository(dbInstance);
            // Insert dummy data
            const insertedCount = await insertDummyDataToDatabase(crudRepo);
            console.log(`🎉 Dummy data loading completed! Inserted ${insertedCount} documents.`);
            // Close database connection
            dbInstance.close();
        }
        catch (error) {
            console.error('❌ Error in main execution:', error);
            process.exit(1);
        }
    }
}
// Execute main if this file is run directly
main().catch(console.error);
//# sourceMappingURL=dummy-data-loader.js.map