"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CrudRepository = void 0;
// ========================================
// CRUD REPOSITORY CLASS
// ========================================
class CrudRepository {
    constructor(dbInstance) {
        if (!dbInstance) {
            throw new Error('Database instance is required');
        }
        this.db = dbInstance;
    }
    // Get the database instance
    getDatabase() {
        return this.db;
    }
    // Close database connection
    close() {
        if (this.db) {
            this.db.close();
            console.log('✅ Database connection closed');
        }
    }
    // Insert a document with its vector embedding
    insertDocument(title, content, embedding) {
        try {
            // Use transaction to ensure both inserts succeed or both fail
            const transaction = this.db.transaction(() => {
                // Insert document first
                const insertDoc = this.db.prepare(`
          INSERT INTO documents (title, content) 
          VALUES (?, ?)
        `);
                const docResult = insertDoc.run(title, content);
                const docId = docResult.lastInsertRowid;
                // Insert embedding with document ID reference
                const insertEmbedding = this.db.prepare(`
          INSERT INTO embeddings (document_id, embedding) 
          VALUES (?, ?)
        `);
                insertEmbedding.run(docId, JSON.stringify(embedding));
                return docId;
            });
            const docId = transaction();
            return docId;
        }
        catch (error) {
            console.error('❌ Error inserting document:', error);
            throw error;
        }
    }
    // Get all documents
    getAllDocuments() {
        try {
            const stmt = this.db.prepare('SELECT id, title, content, created_at FROM documents ORDER BY created_at DESC');
            return stmt.all();
        }
        catch (error) {
            console.error('❌ Error getting documents:', error);
            throw error;
        }
    }
    // Delete a document (and its embedding via CASCADE)
    deleteDocument(id) {
        try {
            // Enable foreign keys to ensure CASCADE works
            this.db.exec('PRAGMA foreign_keys = ON');
            const deleteDoc = this.db.prepare('DELETE FROM documents WHERE id = ?');
            const result = deleteDoc.run(id);
            if (result.changes > 0) {
                console.log(`✅ Document with ID ${id} deleted successfully (including embedding)`);
            }
            else {
                console.log(`⚠️  No document found with ID ${id}`);
            }
            return result.changes > 0;
        }
        catch (error) {
            console.error('❌ Error deleting document:', error);
            throw error;
        }
    }
    // Update document content
    updateDocument(id, title, content) {
        try {
            const updates = [];
            const params = [];
            if (title !== undefined) {
                updates.push('title = ?');
                params.push(title);
            }
            if (content !== undefined) {
                updates.push('content = ?');
                params.push(content);
            }
            if (updates.length === 0) {
                console.log('⚠️  No updates provided');
                return false;
            }
            updates.push('created_at = CURRENT_TIMESTAMP');
            params.push(id);
            const sql = `UPDATE documents SET ${updates.join(', ')} WHERE id = ?`;
            const stmt = this.db.prepare(sql);
            const result = stmt.run(...params);
            if (result.changes > 0) {
                console.log(`✅ Document with ID ${id} updated successfully`);
            }
            else {
                console.log(`⚠️  No document found with ID ${id}`);
            }
            return result.changes > 0;
        }
        catch (error) {
            console.error('❌ Error updating document:', error);
            throw error;
        }
    }
    // Get document by ID with embedding
    getDocumentById(id) {
        try {
            const stmt = this.db.prepare(`
        SELECT 
          d.id, 
          d.title, 
          d.content, 
          d.created_at, 
          e.embedding 
        FROM documents d 
        LEFT JOIN embeddings e ON d.id = e.document_id 
        WHERE d.id = ?
      `);
            const doc = stmt.get(id);
            if (!doc)
                return null;
            const result = {
                id: doc.id,
                title: doc.title,
                content: doc.content,
                created_at: doc.created_at
            };
            if (doc.embedding) {
                result.embedding = JSON.parse(doc.embedding);
            }
            return result;
        }
        catch (error) {
            console.error('❌ Error getting document by ID:', error);
            throw error;
        }
    }
    // Get embedding for a specific document
    getEmbeddingByDocumentId(documentId) {
        try {
            const stmt = this.db.prepare('SELECT embedding FROM embeddings WHERE document_id = ?');
            const result = stmt.get(documentId);
            if (result) {
                return JSON.parse(result.embedding);
            }
            return null;
        }
        catch (error) {
            console.error('❌ Error getting embedding:', error);
            throw error;
        }
    }
    // Update embedding for a document
    updateEmbedding(documentId, newEmbedding) {
        try {
            const stmt = this.db.prepare(`
        UPDATE embeddings 
        SET embedding = ?, created_at = CURRENT_TIMESTAMP 
        WHERE document_id = ?
      `);
            const result = stmt.run(JSON.stringify(newEmbedding), documentId);
            if (result.changes > 0) {
                console.log(`✅ Embedding updated for document ID: ${documentId}`);
            }
            else {
                console.log(`⚠️  No embedding found for document ID: ${documentId}`);
            }
            return result.changes > 0;
        }
        catch (error) {
            console.error('❌ Error updating embedding:', error);
            throw error;
        }
    }
    // Get database statistics
    getStats() {
        try {
            const docCount = this.db.prepare('SELECT COUNT(*) as count FROM documents').get();
            const embeddingCount = this.db.prepare('SELECT COUNT(*) as count FROM embeddings').get();
            return {
                documents: docCount.count,
                embeddings: embeddingCount.count,
                orphaned_documents: docCount.count - embeddingCount.count
            };
        }
        catch (error) {
            console.error('❌ Error getting stats:', error);
            throw error;
        }
    }
    // Get database schema for LLM context
    getDatabaseSchema() {
        try {
            return {
                tables: {
                    documents: {
                        columns: ['id', 'title', 'content', 'created_at'],
                        description: 'Main documents table containing titles and content'
                    },
                    embeddings: {
                        columns: ['id', 'document_id', 'embedding', 'created_at'],
                        description: 'Vector embeddings linked to documents via document_id'
                    }
                },
                relationships: [
                    'embeddings.document_id → documents.id (Foreign Key with CASCADE DELETE)'
                ],
                indexes: [
                    'idx_embeddings_document_id on embeddings(document_id)'
                ]
            };
        }
        catch (error) {
            console.error('❌ Error getting database schema:', error);
            throw error;
        }
    }
    // Execute raw SQL query (for LLM-generated queries)
    executeQuery(sql, params = []) {
        try {
            console.log(`🔍 Executing query: ${sql}`);
            if (params.length > 0) {
                console.log(`   Parameters: ${JSON.stringify(params)}`);
            }
            // Check if it's a SELECT query (read-only)
            const trimmedSql = sql.trim().toLowerCase();
            if (trimmedSql.startsWith('select')) {
                const stmt = this.db.prepare(sql);
                const results = stmt.all(...params);
                console.log(`✅ Query returned ${results.length} rows`);
                return results;
            }
            else if (trimmedSql.startsWith('insert') || trimmedSql.startsWith('update') || trimmedSql.startsWith('delete')) {
                const stmt = this.db.prepare(sql);
                const result = stmt.run(...params);
                console.log(`✅ Query affected ${result.changes} rows`);
                return result;
            }
            else {
                throw new Error('Only SELECT, INSERT, UPDATE, and DELETE queries are allowed');
            }
        }
        catch (error) {
            console.error('❌ Error executing query:', error);
            throw error;
        }
    }
    // Get documents created within a date range
    getDocumentsByDateRange(startDate, endDate, limit = 50) {
        try {
            const query = `
        SELECT d.id, d.title, d.content, d.created_at
        FROM documents d
        WHERE d.created_at BETWEEN ? AND ?
        ORDER BY d.created_at DESC
        LIMIT ?
      `;
            return this.executeQuery(query, [startDate, endDate, limit]);
        }
        catch (error) {
            console.error('❌ Error getting documents by date range:', error);
            throw error;
        }
    }
    // Get documents with most recent embeddings
    getRecentlyEmbedded(limit = 10) {
        try {
            const query = `
        SELECT d.id, d.title, d.content, d.created_at, e.created_at as embedding_created
        FROM documents d
        JOIN embeddings e ON d.id = e.document_id
        ORDER BY e.created_at DESC
        LIMIT ?
      `;
            return this.executeQuery(query, [limit]);
        }
        catch (error) {
            console.error('❌ Error getting recently embedded documents:', error);
            throw error;
        }
    }
}
exports.CrudRepository = CrudRepository;
//# sourceMappingURL=crud.repo.js.map