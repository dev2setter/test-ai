"use strict";
// ========================================
// OFFLINE EMBEDDING MIGRATION SERVICE
// ========================================
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
exports.OfflineEmbeddingMigration = void 0;
exports.runOfflineMigration = runOfflineMigration;
const crud_repo_1 = require("./crud.repo");
const offline_chat_1 = require("./offline-chat");
class OfflineEmbeddingMigration {
    constructor(ollamaUrl = 'http://localhost:11434') {
        this.embeddingService = new offline_chat_1.OfflineEmbeddingService(ollamaUrl);
    }
    // Check if Ollama and embedding model are ready
    async checkReadiness() {
        try {
            const available = await this.embeddingService.checkAvailability();
            if (!available) {
                return {
                    ready: false,
                    message: 'Ollama is not running or nomic-embed-text model is not installed. Please run: ollama pull nomic-embed-text'
                };
            }
            return { ready: true, message: 'Offline embedding service is ready' };
        }
        catch (error) {
            return {
                ready: false,
                message: `Error checking Ollama: ${error instanceof Error ? error.message : 'Unknown error'}`
            };
        }
    }
    // Migrate existing documents from random/online to offline embeddings
    async migrateExistingDocuments(crudRepo) {
        console.log('🔄 Starting offline embedding migration...');
        const readiness = await this.checkReadiness();
        if (!readiness.ready) {
            throw new Error(readiness.message);
        }
        const allDocs = crudRepo.getAllDocuments();
        console.log(`📊 Found ${allDocs.length} documents to migrate to offline embeddings`);
        let migratedCount = 0;
        const errors = [];
        for (let i = 0; i < allDocs.length; i++) {
            const doc = allDocs[i];
            try {
                console.log(`📝 Processing document ${i + 1}/${allDocs.length}: "${doc.title}"`);
                // Generate offline embedding from document content
                const offlineEmbedding = await this.embeddingService.generateDocumentEmbedding(doc.title, doc.content);
                // Update the embedding in database
                const success = crudRepo.updateEmbedding(doc.id, offlineEmbedding);
                if (success) {
                    migratedCount++;
                    console.log(`✅ Migrated document ${doc.id}: "${doc.title}"`);
                }
                else {
                    const error = `Failed to update embedding for document ${doc.id}`;
                    errors.push(error);
                    console.error(`❌ ${error}`);
                }
                // Small delay to prevent overwhelming Ollama
                if (i < allDocs.length - 1) {
                    await new Promise(resolve => setTimeout(resolve, 100));
                }
            }
            catch (error) {
                const errorMsg = `Failed to migrate document ${doc.id}: ${error instanceof Error ? error.message : 'Unknown error'}`;
                errors.push(errorMsg);
                console.error(`❌ ${errorMsg}`);
            }
        }
        console.log(`🎉 Migration completed: ${migratedCount}/${allDocs.length} documents migrated to offline embeddings`);
        if (errors.length > 0) {
            console.log(`⚠️ Encountered ${errors.length} errors during migration`);
        }
        return {
            success: migratedCount > 0,
            migratedCount,
            totalCount: allDocs.length,
            errors
        };
    }
    // Add new document with offline embedding
    async addDocumentWithOfflineEmbedding(crudRepo, title, content) {
        console.log(`📝 Adding new document with offline embedding: "${title}"`);
        const readiness = await this.checkReadiness();
        if (!readiness.ready) {
            throw new Error(readiness.message);
        }
        // Insert document (embedding generated internally)
        const docId = await crudRepo.insertDocument(title, content);
        console.log(`✅ Added document with offline embedding, ID: ${docId}`);
        return docId;
    }
    // Batch processing for better efficiency
    async batchMigrateDocuments(crudRepo, batchSize = 5) {
        console.log(`🔄 Starting batch migration (batch size: ${batchSize})...`);
        const readiness = await this.checkReadiness();
        if (!readiness.ready) {
            throw new Error(readiness.message);
        }
        const allDocs = crudRepo.getAllDocuments();
        const totalCount = allDocs.length;
        let migratedCount = 0;
        const errors = [];
        // Process in batches
        for (let i = 0; i < allDocs.length; i += batchSize) {
            const batch = allDocs.slice(i, i + batchSize);
            console.log(`📦 Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(allDocs.length / batchSize)} (${batch.length} documents)`);
            // Process batch sequentially to avoid overwhelming Ollama
            for (const doc of batch) {
                try {
                    const offlineEmbedding = await this.embeddingService.generateDocumentEmbedding(doc.title, doc.content);
                    const success = crudRepo.updateEmbedding(doc.id, offlineEmbedding);
                    if (success) {
                        migratedCount++;
                        console.log(`✅ Migrated: "${doc.title}"`);
                    }
                    else {
                        const error = `Failed to update embedding for: "${doc.title}"`;
                        errors.push(error);
                        console.error(`❌ ${error}`);
                    }
                }
                catch (error) {
                    const errorMsg = `Failed to migrate "${doc.title}": ${error instanceof Error ? error.message : 'Unknown error'}`;
                    errors.push(errorMsg);
                    console.error(`❌ ${errorMsg}`);
                }
            }
            // Rest between batches
            if (i + batchSize < allDocs.length) {
                console.log('⏳ Resting between batches...');
                await new Promise(resolve => setTimeout(resolve, 2000));
            }
        }
        console.log(`🎉 Batch migration completed: ${migratedCount}/${totalCount} documents migrated`);
        return {
            success: migratedCount > 0,
            migratedCount,
            totalCount,
            errors
        };
    }
}
exports.OfflineEmbeddingMigration = OfflineEmbeddingMigration;
// ========================================
// STANDALONE MIGRATION SCRIPT
// ========================================
async function runOfflineMigration() {
    const { connectDB } = await Promise.resolve().then(() => __importStar(require('./create-db')));
    try {
        console.log('🚀 Starting Offline Embedding Migration...\n');
        // Connect to database
        const dbInstance = connectDB();
        const crudRepo = new crud_repo_1.CrudRepository(dbInstance);
        // Check current state
        const stats = crudRepo.getStats();
        console.log(`📊 Current Database: ${stats.documents} documents, ${stats.embeddings} embeddings\n`);
        if (stats.documents === 0) {
            console.log('⚠️ Database is empty. Please add documents first.');
            console.log('Run: npm run test (to add dummy data)');
            return;
        }
        // Initialize migration service
        const migrationService = new OfflineEmbeddingMigration();
        // Check if Ollama is ready
        const readiness = await migrationService.checkReadiness();
        console.log(`🔍 Ollama Status: ${readiness.message}\n`);
        if (!readiness.ready) {
            console.log('❌ Setup required:');
            console.log('   1. Install Ollama: https://ollama.ai');
            console.log('   2. Start Ollama: ollama serve');
            console.log('   3. Install model: ollama pull nomic-embed-text');
            console.log('   4. Run this script again');
            return;
        }
        // Confirm migration
        console.log('📋 This will replace all existing embeddings with offline embeddings.');
        console.log('📋 Existing embeddings will be overwritten.\n');
        // For automated execution, skip confirmation
        // In real usage, you might want to add readline confirmation
        // Run migration
        console.log('🚀 Starting migration...\n');
        const result = await migrationService.batchMigrateDocuments(crudRepo, 3);
        // Report results
        console.log('\n📊 Migration Results:');
        console.log(`   Total Documents: ${result.totalCount}`);
        console.log(`   Successfully Migrated: ${result.migratedCount}`);
        console.log(`   Errors: ${result.errors.length}`);
        if (result.errors.length > 0) {
            console.log('\n❌ Migration Errors:');
            result.errors.forEach((error, i) => {
                console.log(`   ${i + 1}. ${error}`);
            });
        }
        if (result.success) {
            console.log('\n🎉 Migration completed successfully!');
            console.log('✅ Your database now uses offline embeddings');
            console.log('🚀 You can now run: npm run offline-chat');
        }
        else {
            console.log('\n❌ Migration failed. Please check the errors above.');
        }
    }
    catch (error) {
        console.error('\n❌ Migration failed with error:', error);
    }
}
// Run if this is the main module
if (require.main === module) {
    runOfflineMigration().catch(console.error);
}
//# sourceMappingURL=offline-migration.js.map