import Database from 'better-sqlite3';
export interface Document {
    id: number;
    title: string;
    content: string;
    created_at: string;
}
export interface DocumentWithEmbedding extends Document {
    embedding?: number[];
}
export interface DocumentWithSimilarity extends Document {
    similarity: number;
    distance: number;
}
export interface DatabaseStats {
    documents: number;
    embeddings: number;
    orphaned_documents: number;
}
export interface DatabaseSchema {
    tables: {
        documents: {
            columns: string[];
            description: string;
        };
        embeddings: {
            columns: string[];
            description: string;
        };
    };
    relationships: string[];
    indexes: string[];
}
export interface LLMContext {
    database_info: {
        type: string;
        tables: DatabaseSchema['tables'];
        relationships: string[];
        indexes: string[];
        statistics: DatabaseStats;
    };
    sample_data: {
        recent_documents: Array<{
            id: number;
            title: string;
            content_preview: string;
            created_at: string;
        }>;
    };
    query_examples: string[];
}
export declare class DatabaseRepository {
    private db;
    constructor(dbInstance: Database.Database);
    getDatabase(): Database.Database;
    close(): void;
    insertDocument(title: string, content: string, embedding: number[]): number;
    cosineSimilarity(vecA: number[], vecB: number[]): number;
    euclideanDistance(vecA: number[], vecB: number[]): number;
    searchSimilar(queryEmbedding: number[], limit?: number, useCosineSimilarity?: boolean): DocumentWithSimilarity[];
    getAllDocuments(): Document[];
    deleteDocument(id: number): boolean;
    getDocumentById(id: number): DocumentWithEmbedding | null;
    getEmbeddingByDocumentId(documentId: number): number[] | null;
    updateEmbedding(documentId: number, newEmbedding: number[]): boolean;
    getStats(): DatabaseStats;
    getDatabaseSchema(): DatabaseSchema;
    executeQuery(sql: string, params?: any[]): any;
    searchByText(searchTerm: string, limit?: number): Document[];
    getDocumentsByDateRange(startDate: string, endDate: string, limit?: number): Document[];
    getRecentlyEmbedded(limit?: number): Array<Document & {
        embedding_created: string;
    }>;
    prepareLLMContext(): LLMContext;
}
//# sourceMappingURL=database.repo.d.ts.map