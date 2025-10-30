"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CrudRepository = void 0;
const ollama_1 = require("ollama");
// ========================================
// CRUD REPOSITORY CLASS
// ========================================
class CrudRepository {
    constructor(dbInstance, embeddingModel = 'nomic-embed-text', ollamaInstance) {
        this.vssAvailable = false;
        if (!dbInstance) {
            throw new Error('Database instance is required');
        }
        this.db = dbInstance;
        this.ollama = ollamaInstance || new ollama_1.Ollama(); // Use provided instance or create new one
        this.embeddingModel = embeddingModel;
        // Check if VSS extension is available
        try {
            this.db.exec('SELECT vec_version()');
            this.vssAvailable = true;
            console.log('🚀 sqlite-vec extension detected - using native vector operations');
        }
        catch (error) {
            this.vssAvailable = false;
            console.log('📦 Using JSON embedding storage (sqlite-vec extension not available)');
        }
    }
    // Generate embedding using Ollama
    async generateEmbedding(text) {
        try {
            console.log(`🔮 Generating embedding for text using model: ${this.embeddingModel}`);
            const response = await this.ollama.embeddings({
                model: this.embeddingModel,
                prompt: text.trim().substring(0, 4000)
            });
            console.log(`✅ Embedding generated successfully (${response.embedding.length} dimensions)`);
            return response.embedding;
        }
        catch (error) {
            console.error('❌ Error generating embedding with Ollama:', error);
            throw new Error(`Failed to generate embedding: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    // Insert a document with its vector embedding (generated using Ollama)
    async insertDocument(title, content, category, tags) {
        try {
            // Generate embedding using Ollama - include all metadata for richer embeddings
            const categoryText = category ? `\nCategory: ${category}` : '';
            const tagsText = tags && tags.length > 0 ? `\nTags: ${tags.join(', ')}` : '';
            const combinedText = `${title}\n\n${content}${categoryText}${tagsText}`;
            const embedding = await this.generateEmbedding(combinedText);
            const tagsString = tags ? tags.join(', ') : null;
            if (this.vssAvailable) {
                // Use VSS extension: store embedding as BLOB in documents table
                const insertDoc = this.db.prepare(`
          INSERT INTO documents (title, content, category, tags, embedding) 
          VALUES (?, ?, ?, ?, ?)
        `);
                const embeddingBuffer = new Float32Array(embedding);
                const docResult = insertDoc.run(title, content, category || null, tagsString, Buffer.from(embeddingBuffer.buffer));
                const docId = docResult.lastInsertRowid;
                console.log(`🚀 VSS: Vector stored as BLOB (${embedding.length} dimensions)`);
                console.log(`✅ Document inserted with ID: ${docId} using VSS storage`);
                return docId;
            }
            else {
                // Fallback to JSON storage in documents table
                const insertDoc = this.db.prepare(`
          INSERT INTO documents (title, content, category, tags, embedding) 
          VALUES (?, ?, ?, ?, ?)
        `);
                const embeddingString = JSON.stringify(embedding);
                const docResult = insertDoc.run(title, content, category || null, tagsString, embeddingString);
                const docId = docResult.lastInsertRowid;
                console.log(`📦 JSON: Vector stored as JSON string (${embedding.length} dimensions)`);
                console.log(`✅ Document inserted with ID: ${docId} using JSON storage`);
                return docId;
            }
        }
        catch (error) {
            console.error('❌ Error inserting document:', error);
            throw error;
        }
    }
    // Get all documents
    getAllDocuments() {
        try {
            const stmt = this.db.prepare('SELECT id, title, content, category, tags, created_at FROM documents ORDER BY created_at DESC');
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
          id, 
          title, 
          content, 
          category,
          tags,
          embedding,
          created_at
        FROM documents 
        WHERE id = ?
      `);
            const doc = stmt.get(id);
            if (!doc)
                return null;
            const result = {
                id: doc.id,
                title: doc.title,
                content: doc.content,
                category: doc.category,
                tags: doc.tags,
                created_at: doc.created_at
            };
            if (doc.embedding) {
                if (this.vssAvailable && Buffer.isBuffer(doc.embedding)) {
                    // Convert BLOB back to number array
                    const float32Array = new Float32Array(doc.embedding.buffer, doc.embedding.byteOffset, doc.embedding.byteLength / 4);
                    result.embedding = Array.from(float32Array);
                }
                else if (typeof doc.embedding === 'string') {
                    // Parse JSON string
                    result.embedding = JSON.parse(doc.embedding);
                }
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
            const stmt = this.db.prepare('SELECT embedding FROM documents WHERE id = ?');
            const result = stmt.get(documentId);
            if (result && result.embedding) {
                if (this.vssAvailable && Buffer.isBuffer(result.embedding)) {
                    // Convert BLOB back to number array
                    const float32Array = new Float32Array(result.embedding.buffer, result.embedding.byteOffset, result.embedding.byteLength / 4);
                    return Array.from(float32Array);
                }
                else if (typeof result.embedding === 'string') {
                    // Parse JSON string
                    return JSON.parse(result.embedding);
                }
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
        UPDATE documents 
        SET embedding = ? 
        WHERE id = ?
      `);
            let embeddingData;
            if (this.vssAvailable) {
                // Store as BLOB for VSS
                const embeddingBuffer = new Float32Array(newEmbedding);
                embeddingData = Buffer.from(embeddingBuffer.buffer);
            }
            else {
                // Store as JSON string
                embeddingData = JSON.stringify(newEmbedding);
            }
            const result = stmt.run(embeddingData, documentId);
            if (result.changes > 0) {
                console.log(`✅ Embedding updated for document ID: ${documentId}`);
            }
            else {
                console.log(`⚠️  No document found with ID: ${documentId}`);
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
            const embeddingCount = this.db.prepare('SELECT COUNT(*) as count FROM documents WHERE embedding IS NOT NULL').get();
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
                        columns: ['id', 'title', 'content', 'category', 'tags', 'embedding', 'created_at'],
                        description: 'Main documents table containing titles, content, metadata, and embeddings'
                    },
                    embeddings: {
                        columns: [],
                        description: 'Deprecated - embeddings now stored directly in documents table'
                    }
                },
                relationships: [],
                indexes: []
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