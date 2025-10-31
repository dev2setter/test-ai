import { connectDB } from './create-db';
import { CrudRepository } from './crud.repo';
import { EmbeddingsService } from './embeddings.service';

// Example usage - call createDB when you need it
async function main(): Promise<void> {
  console.log('📝 Starting application...\n');
  
  try {
    // Call connectDB to connect to the persistent database
    const dbInstance = connectDB(); // Always uses database.db
    
    // Create embeddings service
    const embeddingsService = new EmbeddingsService('nomic-embed-text');
    
    // Create CRUD repository with embeddings service
    const db = new CrudRepository(dbInstance, embeddingsService);
    
    console.log('\n🎯 Database is ready! You can now:');
    console.log('   - Insert documents');
    console.log('   - Search for similar documents');
    console.log('   - Perform vector operations');
    
    // Example: Insert a document (embedding generated automatically)
    const docId = await db.insertDocument(
      'Sample Document',
      'This is a test document'
    );
    
    console.log(`✅ Inserted document with ID: ${docId}`);
    
    // Get all documents
    const docs = db.getAllDocuments();
    console.log(`\n📚 Documents in database: ${docs.length}`);
    
    // Database connection managed by the dbInstance
    console.log('✅ Application completed successfully');
    
  } catch (error) {
    console.error('❌ Application failed:', error);
  }
}

// Call the main function
if (require.main === module) {
  main().catch(console.error);
}