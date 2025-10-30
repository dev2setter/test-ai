"use strict";
// ========================================
// REAL-WORLD TEST EXAMPLE
// ========================================
// This shows how to properly test with REAL embeddings instead of random ones
Object.defineProperty(exports, "__esModule", { value: true });
exports.TEST_DOCUMENTS = void 0;
exports.runRealWorldTests = runRealWorldTests;
exports.runDemonstrationMode = runDemonstrationMode;
const create_db_1 = require("./create-db");
const crud_repo_1 = require("./crud.repo");
const search_repo_1 = require("./search.repo");
const embedding_service_1 = require("./embedding.service");
// Sample test documents with meaningful content
const TEST_DOCUMENTS = [
    {
        title: "Introduction to Machine Learning",
        content: "Machine learning is a subset of artificial intelligence that focuses on algorithms that can learn and make decisions from data without being explicitly programmed."
    },
    {
        title: "Deep Learning Neural Networks",
        content: "Deep learning uses artificial neural networks with multiple layers to model and understand complex patterns in data, enabling breakthroughs in image recognition and natural language processing."
    },
    {
        title: "Natural Language Processing Fundamentals",
        content: "Natural language processing combines computational linguistics with machine learning to help computers understand, interpret, and generate human language in a valuable way."
    },
    {
        title: "Computer Vision Applications",
        content: "Computer vision enables machines to interpret and understand visual information from the world, with applications in autonomous vehicles, medical imaging, and security systems."
    },
    {
        title: "Data Science and Analytics",
        content: "Data science combines statistics, programming, and domain expertise to extract insights from large datasets, helping organizations make data-driven decisions."
    }
];
exports.TEST_DOCUMENTS = TEST_DOCUMENTS;
async function runRealWorldTests() {
    console.log('🌟 Running REAL-WORLD Tests with Actual Embeddings...\n');
    // NOTE: You would get this from environment variables
    const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
    if (!OPENAI_API_KEY) {
        console.log('⚠️  OPENAI_API_KEY not found in environment variables');
        console.log('📝 To run real embedding tests:');
        console.log('   1. Get OpenAI API key from https://platform.openai.com/api-keys');
        console.log('   2. Set environment variable: set OPENAI_API_KEY=your-key-here');
        console.log('   3. Run tests again\n');
        console.log('🔄 Falling back to demonstration mode...\n');
        await runDemonstrationMode();
        return;
    }
    let crudRepo;
    let searchRepo;
    try {
        // Initialize database and repositories
        const dbInstance = (0, create_db_1.connectDB)();
        crudRepo = new crud_repo_1.CrudRepository(dbInstance);
        searchRepo = new search_repo_1.SearchRepository(dbInstance);
        // Initialize real embedding service
        const realWorldExample = new embedding_service_1.RealWorldEmbeddingExample(OPENAI_API_KEY);
        console.log('Test 1: Insert Documents with REAL Embeddings');
        console.log('='.repeat(50));
        // Clear existing test documents
        const existingDocs = crudRepo.getAllDocuments();
        const testDocIds = [];
        // Insert each test document with REAL embeddings
        for (const doc of TEST_DOCUMENTS) {
            console.log(`📝 Processing: "${doc.title}"`);
            try {
                const docId = await realWorldExample.insertDocumentWithRealEmbedding(crudRepo, doc.title, doc.content);
                testDocIds.push(docId);
                console.log(`✅ Inserted with ID: ${docId}\n`);
            }
            catch (error) {
                console.error(`❌ Failed to insert "${doc.title}":`, error);
            }
        }
        console.log(`✅ Successfully inserted ${testDocIds.length} documents with real embeddings\n`);
        console.log('Test 2: REAL Semantic Search');
        console.log('='.repeat(50));
        // Test meaningful search queries
        const searchQueries = [
            "artificial intelligence and machine learning",
            "neural networks and deep learning",
            "computer vision and image recognition",
            "text processing and language understanding",
            "data analysis and statistics"
        ];
        for (const query of searchQueries) {
            console.log(`🔍 Searching for: "${query}"`);
            try {
                const results = await realWorldExample.searchWithRealEmbedding(searchRepo, query, 3);
                console.log(`📊 Found ${results.length} relevant results:`);
                results.forEach((doc, index) => {
                    console.log(`   ${index + 1}. "${doc.title}" (Similarity: ${doc.similarity.toFixed(4)})`);
                });
                console.log();
            }
            catch (error) {
                console.error(`❌ Search failed for "${query}":`, error);
            }
        }
        console.log('Test 3: Batch Processing Efficiency');
        console.log('='.repeat(50));
        // Demonstrate batch processing
        const batchDocs = [
            {
                title: "Reinforcement Learning Basics",
                content: "Reinforcement learning is a machine learning paradigm where agents learn to make decisions by interacting with an environment and receiving rewards or penalties."
            },
            {
                title: "Quantum Computing Introduction",
                content: "Quantum computing leverages quantum mechanical phenomena to process information in fundamentally different ways than classical computers."
            }
        ];
        console.log(`📥 Batch processing ${batchDocs.length} documents...`);
        const startTime = Date.now();
        try {
            const batchIds = await realWorldExample.processBatchDocuments(crudRepo, batchDocs);
            const processingTime = Date.now() - startTime;
            console.log(`✅ Batch processing completed in ${processingTime}ms`);
            console.log(`📊 Average time per document: ${(processingTime / batchDocs.length).toFixed(2)}ms`);
            console.log(`🆔 Document IDs: ${batchIds.join(', ')}\n`);
        }
        catch (error) {
            console.error('❌ Batch processing failed:', error);
        }
        console.log('Test 4: Compare Real vs Random Embeddings');
        console.log('='.repeat(50));
        // Show the difference between real and random embeddings
        const sampleQuery = "machine learning algorithms";
        console.log(`🔍 Query: "${sampleQuery}"`);
        // Real embedding search
        console.log('📊 REAL embedding results:');
        try {
            const realResults = await realWorldExample.searchWithRealEmbedding(searchRepo, sampleQuery, 5);
            realResults.forEach((doc, index) => {
                console.log(`   ${index + 1}. "${doc.title}" (Similarity: ${doc.similarity.toFixed(4)})`);
            });
        }
        catch (error) {
            console.error('❌ Real embedding search failed:', error);
        }
        // For comparison, show how random embeddings would perform poorly
        console.log('\n🎲 Random embedding results (for comparison):');
        const randomEmbedding = Array.from({ length: 1536 }, () => Math.random() * 2 - 1);
        const randomResults = searchRepo.searchSimilar(randomEmbedding, 5);
        randomResults.forEach((doc, index) => {
            console.log(`   ${index + 1}. "${doc.title}" (Similarity: ${doc.similarity.toFixed(4)})`);
        });
        console.log('\n💡 Notice: Real embeddings show relevant content, random embeddings are meaningless!\n');
        console.log('🎉 All real-world tests completed successfully!');
    }
    catch (error) {
        console.error('❌ Real-world test failed:', error);
    }
    finally {
        if (crudRepo) {
            crudRepo.close();
            console.log('🔒 Database connection closed');
        }
    }
}
async function runDemonstrationMode() {
    console.log('🎭 Running in DEMONSTRATION mode (simulating real embeddings)...\n');
    const dbInstance = (0, create_db_1.connectDB)();
    const crudRepo = new crud_repo_1.CrudRepository(dbInstance);
    const searchRepo = new search_repo_1.SearchRepository(dbInstance);
    try {
        console.log('📚 What REAL embeddings would look like:');
        console.log('='.repeat(50));
        // Simulate what real embeddings would provide
        console.log('✅ Real embeddings capture semantic meaning:');
        console.log('   - "machine learning" and "AI" would be similar');
        console.log('   - "neural networks" and "deep learning" would cluster together');
        console.log('   - "computer vision" and "image recognition" would be related');
        console.log('   - Search results would be contextually relevant\n');
        console.log('❌ Random embeddings problems:');
        console.log('   - No relationship between content and vector');
        console.log('   - Similarity scores are meaningless');
        console.log('   - Search results are essentially random');
        console.log('   - No semantic understanding\n');
        console.log('🔧 To enable real embeddings:');
        console.log('   1. Get OpenAI API key');
        console.log('   2. Set OPENAI_API_KEY environment variable');
        console.log('   3. Use EmbeddingService.generateEmbedding()');
        console.log('   4. Replace generateRandomEmbedding() calls\n');
        console.log('💰 Cost considerations:');
        console.log('   - OpenAI text-embedding-3-small: $0.02 per 1M tokens');
        console.log('   - Average document (~500 words): ~$0.0001');
        console.log('   - 1000 documents: ~$0.10');
        console.log('   - Very affordable for most applications\n');
        console.log('🔄 Alternative: Local embedding models (free)');
        console.log('   - sentence-transformers library (Python)');
        console.log('   - all-MiniLM-L6-v2 model (~80MB)');
        console.log('   - No API costs, runs offline');
        console.log('   - Slightly lower quality than OpenAI\n');
    }
    finally {
        crudRepo.close();
    }
}
// Main execution
async function main() {
    await runRealWorldTests();
}
// Run if this is the main module
if (require.main === module) {
    main().catch(console.error);
}
//# sourceMappingURL=real-world-test.js.map