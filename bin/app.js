"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const create_db_1 = require("./create-db");
const database_repo_1 = require("./database.repo");
// Example usage - call createDB when you need it
async function main() {
    console.log('📝 Starting application...\n');
    try {
        // Call connectDB to connect to the persistent database
        const dbInstance = (0, create_db_1.connectDB)(); // Always uses database.db
        const db = new database_repo_1.DatabaseRepository(dbInstance);
        console.log('\n🎯 Database is ready! You can now:');
        console.log('   - Insert documents');
        console.log('   - Search for similar documents');
        console.log('   - Perform vector operations');
        // Example: Insert a document
        const sampleEmbedding = [0.1, 0.2, 0.3, 0.4]; // Small example
        const docId = db.insertDocument('Sample Document', 'This is a test document', sampleEmbedding);
        console.log(`✅ Inserted document with ID: ${docId}`);
        // Get all documents
        const docs = db.getAllDocuments();
        console.log(`\n📚 Documents in database: ${docs.length}`);
        // Close when done
        db.close();
    }
    catch (error) {
        console.error('❌ Application failed:', error);
    }
}
// Call the main function
if (require.main === module) {
    main().catch(console.error);
}
//# sourceMappingURL=app.js.map