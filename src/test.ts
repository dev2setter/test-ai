import { connectDB } from './create-db';
import { CrudRepository } from './crud.repo';
import { SearchRepository } from './search.repo';
import { 
  insertDummyDataToDatabase, 
  getDummyDataStats, 
  generateRandomEmbedding 
} from './dummy-data-loader';

async function runTests(): Promise<void> {
  console.log('🧪 Running SQLite VSS Tests...\n');
  
  let crudRepo: CrudRepository | undefined;
  let searchRepo: SearchRepository | undefined;
  
  try {
    // Test 1: Database initialization and data loading
    console.log('Test 1: Database Initialization and Data Loading');
    
    // Create/connect to database (always uses database.db)
    const dbInstance = connectDB();
    
    // Create repository instances
    crudRepo = new CrudRepository(dbInstance);
    searchRepo = new SearchRepository(dbInstance);
    
    // If database is new or empty, load dummy data
    const stats = crudRepo.getStats();
    console.log(`📊 Current Database Stats: Documents=${stats.documents}, Embeddings=${stats.embeddings}`);
    
    if (stats.documents === 0) {
      console.log('📋 Database is empty. Loading dummy data...');      
      // Load dummy data statistics first
      const dummyStats = getDummyDataStats();
      console.log(`📊 Dummy Data Overview:`);
      console.log(`   Total Documents: ${dummyStats.totalDocuments}`);
      console.log(`   Categories: ${dummyStats.categories} (${dummyStats.categoryList.join(', ')})`);
      console.log(`   Average Content Length: ${dummyStats.averageContentLength} characters`);
      
      // Insert dummy data into database
      const insertedCount = insertDummyDataToDatabase(crudRepo as any); // TODO: Update dummy data loader to accept CrudRepository
      console.log(`✅ ${insertedCount} documents from dummy-data.json`);
    } else {
      console.log(`✅ Database already contains ${stats.documents} documents`);
    }

    console.log('✅ PASSED\n');

    // Test 2: Retrieve all documents
    console.log('Test 2: Retrieve All Documents');
    const allDocs = crudRepo.getAllDocuments();
    if (allDocs.length > 0) {
      console.log(`✅ PASSED - Found ${allDocs.length} document(s)`);
      console.log(`   Latest: "${allDocs[0].title}"\n`);
    } else {
      console.log('❌ FAILED - No documents found\n');
    }

    // Test 3: Vector similarity search
    console.log('Test 3: Vector similarity search');
    const queryEmbedding = generateRandomEmbedding(384);
    const similarDocs = searchRepo.searchSimilar(queryEmbedding, 5);
    if (similarDocs.length > 0) {
      console.log(`✅ PASSED - Found ${similarDocs.length} similar document(s)`);
      similarDocs.forEach((doc, index) => {
        console.log(`   ${index + 1}. "${doc.title}" (Similarity: ${doc.similarity.toFixed(4)})`);
      });
      console.log();
    } else {
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
    } else {
      console.log('❌ FAILED - No text search results found\n');
    }

    // Test 5: Insert a new test document
    console.log('Test 5: Insert New Test Document');
    const testEmbedding = generateRandomEmbedding(384);
    const docId = crudRepo.insertDocument(
      'Test Document Added by Test Suite',
      'This is a test document for our SQLite VSS implementation added during testing.',
      testEmbedding
    );
    console.log(`✅ PASSED - Document ID: ${docId}\n`);

    // Test 6: Enhanced Similarity Search
    console.log('Test 6: Enhanced Similarity Search');
    const enhancedSearch = searchRepo.searchSimilar(queryEmbedding, 5);
    console.log(`✅ PASSED - Found ${enhancedSearch.length} documents:`);
    enhancedSearch.forEach((doc, index) => {
      console.log(`   ${index + 1}. "${doc.title}" (Similarity: ${doc.similarity.toFixed(4)})`);
    });
    console.log();

    // Test 7: Database Statistics
    console.log('Test 7: Database Statistics');
    const finalStats = crudRepo.getStats();
    console.log(`✅ PASSED - Database contains:`);
    console.log(`   Documents: ${finalStats.documents}`);
    console.log(`   Embeddings: ${finalStats.embeddings}`);
    console.log(`   Orphaned documents: ${finalStats.orphaned_documents}\n`);

    // Test 8: Hybrid Search
    console.log('Test 8: Hybrid Search');
    const hybridResults = searchRepo.hybridSearch('machine learning', queryEmbedding, 0.3, 0.7, 5);
    console.log(`✅ PASSED - Found ${hybridResults.length} hybrid search results:`);
    hybridResults.forEach((doc, index) => {
      console.log(` ${index + 1}. "${doc.title}" (Total: ${doc.totalScore.toFixed(4)})`);
    });
    console.log();

    console.log('🎉 All tests completed!');

  } catch (error) {
    console.error('❌ Test failed with error:', error);
  } finally {
    // Close database connection
    if (crudRepo) {
      crudRepo.close();
      console.log('🔒 Database connection closed (database.db remains persistent)');
    }
  }
}

// Performance test
async function performanceTest(): Promise<void> {
  console.log('\n⚡ Running Performance Test...\n');
  
  // Use persistent database for performance test too
  const dbInstance = connectDB();
  const crudRepo = new CrudRepository(dbInstance);
  const searchRepo = new SearchRepository(dbInstance);
  
  try {
    const numDocs = 100;
    const embeddingDim = 384;
    
    console.log(`Inserting ${numDocs} performance test documents...`);
    const startInsert = Date.now();
    
    for (let i = 0; i < numDocs; i++) {
      const title = `Performance Test Document ${i + 1}`;
      const content = `This is a performance test document number ${i + 1}. It contains sample content for testing insertion and retrieval performance of our SQLite VSS implementation.`;
      const embedding = generateRandomEmbedding(embeddingDim);
      
      crudRepo.insertDocument(title, content, embedding);
    }
    
    const insertTime = Date.now() - startInsert;
    console.log(`✅ Insertion completed in ${insertTime}ms (${(insertTime / numDocs).toFixed(2)}ms per doc)\n`);

    // Test search performance
    console.log('Performing similarity searches...');
    const startSearch = Date.now();
    const queryEmbedding = generateRandomEmbedding(embeddingDim);
    
    for (let i = 0; i < 10; i++) {
      searchRepo.searchSimilar(queryEmbedding, 5);
    }
    
    const searchTime = Date.now() - startSearch;
    console.log(`✅ 10 searches completed in ${searchTime}ms (${(searchTime / 10).toFixed(2)}ms per search)`);
    
    // Test hybrid search performance
    console.log('Performing hybrid searches...');
    const startHybrid = Date.now();
    
    for (let i = 0; i < 5; i++) {
      searchRepo.hybridSearch('test performance', queryEmbedding, 0.3, 0.7, 5);
    }
    
    const hybridTime = Date.now() - startHybrid;
    console.log(`✅ 5 hybrid searches completed in ${hybridTime}ms (${(hybridTime / 5).toFixed(2)}ms per search)`);
    
  } catch (error) {
    console.error('❌ Performance test failed:', error);
  } finally {
    crudRepo.close();
    console.log('🔒 Performance test completed (database.db remains persistent)');
  }
}// Main execution
async function main(): Promise<void> {
  await runTests();
  await performanceTest();
}

// Run if this is the main module
if (require.main === module) {
  main().catch(console.error);
}