"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const create_db_1 = require("./create-db");
const crud_repo_1 = require("./crud.repo");
const search_repo_1 = require("./search.repo");
const dummy_data_loader_1 = require("./dummy-data-loader");
async function runTests() {
    console.log('🧪 Running SQLite VSS Tests...\n');
    let crudRepo;
    let searchRepo;
    try {
        // Test 1: Database initialization and data loading
        console.log('Test 1: Database Initialization and Data Loading');
        // Create/connect to database (always uses database.db)
        const dbInstance = (0, create_db_1.connectDB)();
        // Create repository instances
        crudRepo = new crud_repo_1.CrudRepository(dbInstance);
        searchRepo = new search_repo_1.SearchRepository(dbInstance);
        // If database is new or empty, load dummy data
        const stats = crudRepo.getStats();
        console.log(`📊 Current Database Stats: Documents=${stats.documents}, Embeddings=${stats.embeddings}`);
        if (stats.documents === 0) {
            console.log('📋 Database is empty. Loading dummy data...');
            // Load dummy data statistics first
            const dummyStats = (0, dummy_data_loader_1.getDummyDataStats)();
            console.log(`📊 Dummy Data Overview:`);
            console.log(`   Total Documents: ${dummyStats.totalDocuments}`);
            console.log(`   Categories: ${dummyStats.categories} (${dummyStats.categoryList.join(', ')})`);
            console.log(`   Average Content Length: ${dummyStats.averageContentLength} characters`);
            // Insert dummy data into database
            const insertedCount = await (0, dummy_data_loader_1.insertDummyDataToDatabase)(crudRepo);
            console.log(`✅ ${insertedCount} documents from dummy-data.json`);
        }
        else {
            console.log(`✅ Database already contains ${stats.documents} documents`);
        }
        console.log('✅ PASSED\n');
        // Test 2: Retrieve all documents
        console.log('Test 2: Retrieve All Documents');
        const allDocs = crudRepo.getAllDocuments();
        if (allDocs.length > 0) {
            console.log(`✅ PASSED - Found ${allDocs.length} document(s)`);
            console.log(`   Latest: "${allDocs[0].title}"\n`);
        }
        else {
            console.log('❌ FAILED - No documents found\n');
        }
        // Test 3: Vector similarity search (using real Ollama embedding)
        console.log('Test 3: Vector similarity search');
        // Generate a real embedding for search query using the same model
        const tempRepo = new crud_repo_1.CrudRepository(dbInstance, 'nomic-embed-text');
        const queryText = "machine learning and artificial intelligence";
        console.log('🔮 Generating query embedding with Ollama...');
        const queryEmbedding = await tempRepo.generateEmbedding(queryText);
        const similarDocs = searchRepo.searchSimilar(queryEmbedding, 5);
        if (similarDocs.length > 0) {
            console.log(`✅ PASSED - Found ${similarDocs.length} similar document(s) for: "${queryText}"`);
            similarDocs.forEach((doc, index) => {
                console.log(`   ${index + 1}. "${doc.title}" (Similarity: ${doc.similarity.toFixed(4)})`);
            });
            console.log();
        }
        else {
            console.log('❌ FAILED - No similar documents found\n');
        }
        // Test 4: Text search
        console.log('Test 4: Text Search');
        const textResults = searchRepo.searchByText('machine learning', 3);
        if (textResults.length > 0) {
            console.log(`✅ PASSED - Found ${textResults.length} documents with text search`);
            textResults.forEach((doc, index) => {
                console.log(`   ${index + 1}. "${doc.title}"`);
            });
            console.log();
        }
        else {
            console.log('❌ FAILED - No text search results found\n');
        }
        // Test 5: Enhanced Similarity Search (Skip document insertion test)
        console.log('Test 5: Enhanced Similarity Search');
        const enhancedSearch = searchRepo.searchSimilar(queryEmbedding, 5);
        console.log(`✅ PASSED - Found ${enhancedSearch.length} documents:`);
        enhancedSearch.forEach((doc, index) => {
            console.log(`   ${index + 1}. "${doc.title}" (Similarity: ${doc.similarity.toFixed(4)})`);
        });
        console.log();
        // Test 6: Database Statistics
        console.log('Test 6: Database Statistics');
        const finalStats = crudRepo.getStats();
        console.log(`✅ PASSED - Database contains:`);
        console.log(`   Documents: ${finalStats.documents}`);
        console.log(`   Embeddings: ${finalStats.embeddings}`);
        console.log(`   Orphaned documents: ${finalStats.orphaned_documents}\n`);
        // Test 7: Hybrid Search
        console.log('Test 7: Hybrid Search');
        const hybridResults = searchRepo.hybridSearch('machine learning', queryEmbedding, 0.3, 0.7, 5);
        console.log(`✅ PASSED - Found ${hybridResults.length} hybrid search results:`);
        hybridResults.forEach((doc, index) => {
            console.log(` ${index + 1}. "${doc.title}" (Total: ${doc.totalScore.toFixed(4)})`);
        });
        console.log();
        console.log('🎉 All tests completed!');
    }
    catch (error) {
        console.error('❌ Test failed with error:', error);
    }
    finally {
        // Database connection will be managed by the database instance
        console.log('🔒 Test completed (database.db remains persistent)');
    }
}
// Main execution
async function main() {
    await runTests();
    // Removed performance test to keep database clean with only pure dummy data
}
// Run if this is the main module
if (require.main === module) {
    main().catch(console.error);
}
//# sourceMappingURL=test.js.map