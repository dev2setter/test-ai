"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// TypeScript script to get all categories from database
const create_db_1 = require("./src/create-db");
const crud_repo_1 = require("./src/crud.repo");
const embeddings_service_1 = require("./src/embeddings.service");
async function getCategories() {
    console.log('🔍 Getting all categories from database...\n');
    try {
        // Initialize database and repositories
        const dbInstance = (0, create_db_1.connectDB)();
        const embeddingsService = new embeddings_service_1.EmbeddingsService('nomic-embed-text');
        const crudRepo = new crud_repo_1.CrudRepository(dbInstance, embeddingsService);
        // Get all categories
        console.log('📂 Available Categories:');
        const categories = crudRepo.getAllCategories();
        if (categories.length > 0) {
            categories.forEach((category, i) => {
                console.log(`   ${i + 1}. ${category}`);
            });
            console.log(`\n📊 Total: ${categories.length} categories`);
        }
        else {
            console.log('   No categories found in database');
        }
        // Get all tags
        console.log('\n🏷️  Available Tags:');
        const tags = crudRepo.getAllTags();
        if (tags.length > 0) {
            console.log(`   ${tags.join(', ')}`);
            console.log(`\n📊 Total: ${tags.length} unique tags`);
        }
        else {
            console.log('   No tags found in database');
        }
        // Get documents count per category
        console.log('\n📊 Documents per Category:');
        for (const category of categories) {
            const docs = crudRepo.getDocumentsByCategory(category);
            console.log(`   ${category}: ${docs.length} documents`);
        }
    }
    catch (error) {
        console.error('❌ Failed to get categories:', error);
    }
}
getCategories().catch(console.error);
//# sourceMappingURL=get-categories.js.map