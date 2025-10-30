"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DatabaseRepository = void 0;
// ========================================
// DATABASE REPOSITORY CLASS
// ========================================
class DatabaseRepository {
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
    // Calculate cosine similarity between two vectors
    cosineSimilarity(vecA, vecB) {
        if (vecA.length !== vecB.length) {
            throw new Error('Vectors must have the same length');
        }
        let dotProduct = 0;
        let normA = 0;
        let normB = 0;
        for (let i = 0; i < vecA.length; i++) {
            dotProduct += vecA[i] * vecB[i];
            normA += vecA[i] * vecA[i];
            normB += vecB[i] * vecB[i];
        }
        const magnitude = Math.sqrt(normA) * Math.sqrt(normB);
        return magnitude === 0 ? 0 : dotProduct / magnitude;
    }
    // Calculate Euclidean distance between two vectors
    euclideanDistance(vecA, vecB) {
        if (vecA.length !== vecB.length) {
            throw new Error('Vectors must have the same length');
        }
        let sum = 0;
        for (let i = 0; i < vecA.length; i++) {
            sum += Math.pow(vecA[i] - vecB[i], 2);
        }
        return Math.sqrt(sum);
    }
    // Search for similar documents using vector similarity
    searchSimilar(queryEmbedding, limit = 5, useCosineSimilarity = true) {
        try {
            // Get all documents with their embeddings using JOIN
            const getAllDocsWithEmbeddings = this.db.prepare(`
        SELECT 
          d.id, 
          d.title, 
          d.content, 
          d.created_at, 
          e.embedding 
        FROM documents d 
        JOIN embeddings e ON d.id = e.document_id
      `);
            const allDocs = getAllDocsWithEmbeddings.all();
            const similarities = allDocs.map(doc => {
                const docEmbedding = JSON.parse(doc.embedding);
                let similarity;
                if (useCosineSimilarity) {
                    similarity = this.cosineSimilarity(queryEmbedding, docEmbedding);
                    // For cosine similarity, higher is better, so we sort descending
                    return {
                        id: doc.id,
                        title: doc.title,
                        content: doc.content,
                        created_at: doc.created_at,
                        similarity: similarity,
                        distance: 1 - similarity // Convert to distance for consistency
                    };
                }
                else {
                    // Use Euclidean distance (lower is better)
                    const distance = this.euclideanDistance(queryEmbedding, docEmbedding);
                    return {
                        id: doc.id,
                        title: doc.title,
                        content: doc.content,
                        created_at: doc.created_at,
                        similarity: 1 / (1 + distance), // Convert distance to similarity
                        distance: distance
                    };
                }
            });
            // Sort by similarity (descending) and take top results
            similarities.sort((a, b) => b.similarity - a.similarity);
            return similarities.slice(0, limit);
        }
        catch (error) {
            console.error('❌ Error searching similar documents:', error);
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
    // LLM Query Methods
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
    // Search documents by text content (for LLM preprocessing)
    searchByText(searchTerm, limit = 10) {
        try {
            const query = `
        SELECT d.id, d.title, d.content, d.created_at
        FROM documents d
        WHERE d.title LIKE ? OR d.content LIKE ?
        ORDER BY d.created_at DESC
        LIMIT ?
      `;
            const searchPattern = `%${searchTerm}%`;
            return this.executeQuery(query, [searchPattern, searchPattern, limit]);
        }
        catch (error) {
            console.error('❌ Error searching by text:', error);
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
    // Prepare context for LLM queries
    prepareLLMContext() {
        try {
            const schema = this.getDatabaseSchema();
            const stats = this.getStats();
            const recentDocs = this.getRecentlyEmbedded(5);
            return {
                database_info: {
                    type: 'SQLite with Vector Similarity Search',
                    tables: schema.tables,
                    relationships: schema.relationships,
                    indexes: schema.indexes,
                    statistics: stats
                },
                sample_data: {
                    recent_documents: recentDocs.map(doc => ({
                        id: doc.id,
                        title: doc.title,
                        content_preview: doc.content.substring(0, 100) + '...',
                        created_at: doc.created_at
                    }))
                },
                query_examples: [
                    "SELECT title, content FROM documents WHERE title LIKE '%machine learning%'",
                    "SELECT COUNT(*) FROM documents WHERE created_at > '2025-01-01'",
                    "SELECT d.title, d.created_at FROM documents d JOIN embeddings e ON d.id = e.document_id ORDER BY e.created_at DESC LIMIT 10"
                ]
            };
        }
        catch (error) {
            console.error('❌ Error preparing LLM context:', error);
            throw error;
        }
    }
}
exports.DatabaseRepository = DatabaseRepository;
//# sourceMappingURL=database.repo.js.map