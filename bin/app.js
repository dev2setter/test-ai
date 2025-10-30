"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const create_db_1 = require("./create-db");
const crud_repo_1 = require("./crud.repo");
// Example usage - call createDB when you need it
async function main() {
    console.log('📝 Starting application...\n');
    try {
        // Call connectDB to connect to the persistent database
        const dbInstance = (0, create_db_1.connectDB)(); // Always uses database.db
        const db = new crud_repo_1.CrudRepository(dbInstance, 'nomic-embed-text');
        console.log('\n🎯 Database is ready! You can now:');
        console.log('   - Insert documents');
        console.log('   - Search for similar documents');
        console.log('   - Perform vector operations');
        // Example: Insert a document (embedding generated automatically)
        const docId = await db.insertDocument('Sample Document', 'This is a test document');
        console.log(`✅ Inserted document with ID: ${docId}`);
        // Get all documents
        const docs = db.getAllDocuments();
        console.log(`\n📚 Documents in database: ${docs.length}`);
        // Database connection managed by the dbInstance
        console.log('✅ Application completed successfully');
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