import { connectDB } from './create-db';
import { DatabaseRepository } from './database.repo';

// Example usage - call createDB when you need it
async function main(): Promise<void> {
  console.log('📝 Starting application...\n');
  
  try {
    // Call connectDB to connect to the persistent database
    const dbInstance = connectDB(); // Always uses database.db
    const db = new DatabaseRepository(dbInstance);
    
    console.log('\n🎯 Database is ready! You can now:');
    console.log('   - Insert documents');
    console.log('   - Search for similar documents');
    console.log('   - Perform vector operations');
    
    // Example: Insert a document
    const sampleEmbedding = [0.1, 0.2, 0.3, 0.4]; // Small example
    const docId = db.insertDocument(
      'Sample Document',
      'This is a test document',
      sampleEmbedding
    );
    
    console.log(`✅ Inserted document with ID: ${docId}`);
    
    // Get all documents
    const docs = db.getAllDocuments();
    console.log(`\n📚 Documents in database: ${docs.length}`);
    
    // Close when done
    db.close();
    
  } catch (error) {
    console.error('❌ Application failed:', error);
  }
}

// Call the main function
if (require.main === module) {
  main().catch(console.error);
}