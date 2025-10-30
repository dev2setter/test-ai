"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SearchRepository = void 0;
// ========================================
// SEARCH REPOSITORY CLASS
// ========================================
class SearchRepository {
    constructor(dbInstance) {
        if (!dbInstance) {
            throw new Error('Database instance is required');
        }
        this.db = dbInstance;
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
    searchSimilar(queryEmbedding, limit = 5, useCosineSimilarity = true, filters) {
        try {
            // Build base query with optional filters
            let query = `
        SELECT 
          d.id, 
          d.title, 
          d.content, 
          d.created_at, 
          e.embedding 
        FROM documents d 
        JOIN embeddings e ON d.id = e.document_id
      `;
            const queryParams = [];
            const whereConditions = [];
            // Add date filters if provided
            if (filters?.startDate && filters?.endDate) {
                whereConditions.push('d.created_at BETWEEN ? AND ?');
                queryParams.push(filters.startDate, filters.endDate);
            }
            if (whereConditions.length > 0) {
                query += ' WHERE ' + whereConditions.join(' AND ');
            }
            const stmt = this.db.prepare(query);
            const allDocs = stmt.all(...queryParams);
            const similarities = allDocs.map(doc => {
                const docEmbedding = JSON.parse(doc.embedding);
                let similarity;
                if (useCosineSimilarity) {
                    similarity = this.cosineSimilarity(queryEmbedding, docEmbedding);
                    return {
                        id: doc.id,
                        title: doc.title,
                        content: doc.content,
                        created_at: doc.created_at,
                        similarity: similarity,
                        distance: 1 - similarity
                    };
                }
                else {
                    const distance = this.euclideanDistance(queryEmbedding, docEmbedding);
                    return {
                        id: doc.id,
                        title: doc.title,
                        content: doc.content,
                        created_at: doc.created_at,
                        similarity: 1 / (1 + distance),
                        distance: distance
                    };
                }
            });
            // Filter by minimum similarity if provided
            let filteredSimilarities = similarities;
            if (filters?.minSimilarity) {
                filteredSimilarities = similarities.filter(doc => doc.similarity >= filters.minSimilarity);
            }
            // Sort by similarity (descending) and take top results
            filteredSimilarities.sort((a, b) => b.similarity - a.similarity);
            const maxResults = filters?.maxResults || limit;
            return filteredSimilarities.slice(0, maxResults);
        }
        catch (error) {
            console.error('❌ Error searching similar documents:', error);
            throw error;
        }
    }
    // Search documents by text content
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
            const stmt = this.db.prepare(query);
            return stmt.all(searchPattern, searchPattern, limit);
        }
        catch (error) {
            console.error('❌ Error searching by text:', error);
            throw error;
        }
    }
    // Advanced text search with multiple terms
    searchByTextAdvanced(searchTerms, operator = 'OR', limit = 10) {
        try {
            const conditions = [];
            const params = [];
            searchTerms.forEach(term => {
                conditions.push('(d.title LIKE ? OR d.content LIKE ?)');
                const pattern = `%${term}%`;
                params.push(pattern, pattern);
            });
            const whereClause = conditions.join(` ${operator} `);
            const query = `
        SELECT d.id, d.title, d.content, d.created_at
        FROM documents d
        WHERE ${whereClause}
        ORDER BY d.created_at DESC
        LIMIT ?
      `;
            params.push(limit.toString());
            const stmt = this.db.prepare(query);
            return stmt.all(...params);
        }
        catch (error) {
            console.error('❌ Error in advanced text search:', error);
            throw error;
        }
    }
    // Hybrid search: combine text search and semantic search
    hybridSearch(query, queryEmbedding, textWeight = 0.3, semanticWeight = 0.7, limit = 10) {
        try {
            console.log(`🔄 Hybrid Search: "${query}"`);
            console.log(`   Text weight: ${textWeight}, Semantic weight: ${semanticWeight}`);
            // Text search
            const textResults = this.searchByText(query, limit * 2); // Get more for better ranking
            console.log(`📝 Text search found ${textResults.length} results`);
            // Semantic search
            const semanticResults = this.searchSimilar(queryEmbedding, limit * 2);
            console.log(`🧠 Semantic search found ${semanticResults.length} results`);
            // Combine results
            const combinedResults = new Map();
            // Add text results
            textResults.forEach(doc => {
                combinedResults.set(doc.id, {
                    ...doc,
                    similarity: 0,
                    distance: 0,
                    textScore: textWeight,
                    semanticScore: 0,
                    totalScore: textWeight
                });
            });
            // Add semantic results
            semanticResults.forEach(doc => {
                const existing = combinedResults.get(doc.id);
                if (existing) {
                    existing.similarity = doc.similarity;
                    existing.distance = doc.distance;
                    existing.semanticScore = doc.similarity * semanticWeight;
                    existing.totalScore = existing.textScore + existing.semanticScore;
                }
                else {
                    combinedResults.set(doc.id, {
                        ...doc,
                        textScore: 0,
                        semanticScore: doc.similarity * semanticWeight,
                        totalScore: doc.similarity * semanticWeight
                    });
                }
            });
            // Sort by total score and return top results
            const finalResults = Array.from(combinedResults.values())
                .sort((a, b) => b.totalScore - a.totalScore)
                .slice(0, limit);
            return finalResults;
        }
        catch (error) {
            console.error('❌ Error in hybrid search:', error);
            throw error;
        }
    }
    // Semantic search with clustering (group similar results)
    searchWithClustering(queryEmbedding, limit = 10, similarityThreshold = 0.8) {
        try {
            const allResults = this.searchSimilar(queryEmbedding, limit * 3);
            const clusters = [];
            const processed = new Set();
            let clusterIndex = 0;
            for (const doc of allResults) {
                if (processed.has(doc.id))
                    continue;
                const cluster = { cluster: clusterIndex++, documents: [doc] };
                processed.add(doc.id);
                // Find similar documents for this cluster
                for (const otherDoc of allResults) {
                    if (processed.has(otherDoc.id))
                        continue;
                    // Get embeddings and calculate similarity
                    const docEmbedding = JSON.parse(this.db.prepare('SELECT embedding FROM embeddings WHERE document_id = ?').get(doc.id)).embedding;
                    const otherEmbedding = JSON.parse(this.db.prepare('SELECT embedding FROM embeddings WHERE document_id = ?').get(otherDoc.id)).embedding;
                    const similarity = this.cosineSimilarity(docEmbedding, otherEmbedding);
                    if (similarity >= similarityThreshold) {
                        cluster.documents.push(otherDoc);
                        processed.add(otherDoc.id);
                    }
                }
                clusters.push(cluster);
                if (clusters.length >= limit)
                    break;
            }
            return clusters;
        }
        catch (error) {
            console.error('❌ Error in clustered search:', error);
            throw error;
        }
    }
    // Search with faceted results (group by time periods, similarity ranges, etc.)
    searchWithFacets(queryEmbedding, limit = 20) {
        try {
            const results = this.searchSimilar(queryEmbedding, limit);
            // Calculate similarity range facets
            const similarityRanges = [
                { range: '0.9-1.0', count: 0 },
                { range: '0.7-0.9', count: 0 },
                { range: '0.5-0.7', count: 0 },
                { range: '0.0-0.5', count: 0 }
            ];
            // Calculate time period facets
            const now = new Date();
            const timePeriods = [
                { period: 'Last 24 hours', count: 0 },
                { period: 'Last week', count: 0 },
                { period: 'Last month', count: 0 },
                { period: 'Older', count: 0 }
            ];
            results.forEach(doc => {
                // Similarity range facets
                if (doc.similarity >= 0.9)
                    similarityRanges[0].count++;
                else if (doc.similarity >= 0.7)
                    similarityRanges[1].count++;
                else if (doc.similarity >= 0.5)
                    similarityRanges[2].count++;
                else
                    similarityRanges[3].count++;
                // Time period facets
                const docDate = new Date(doc.created_at);
                const timeDiff = now.getTime() - docDate.getTime();
                const daysDiff = timeDiff / (1000 * 3600 * 24);
                if (daysDiff <= 1)
                    timePeriods[0].count++;
                else if (daysDiff <= 7)
                    timePeriods[1].count++;
                else if (daysDiff <= 30)
                    timePeriods[2].count++;
                else
                    timePeriods[3].count++;
            });
            return {
                results,
                facets: {
                    similarityRanges,
                    timePeriods
                }
            };
        }
        catch (error) {
            console.error('❌ Error in faceted search:', error);
            throw error;
        }
    }
}
exports.SearchRepository = SearchRepository;
//# sourceMappingURL=search.repo.js.map