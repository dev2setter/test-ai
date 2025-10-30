import { CrudRepository } from './crud.repo';
export interface DummyDocument {
    title: string;
    content: string;
    category: string;
    tags: string[];
}
export interface DummyDocumentWithEmbedding extends DummyDocument {
    id: number;
    embedding: number[];
    created_at: string;
}
export interface DummyDataStats {
    totalDocuments: number;
    categories: number;
    totalTags: number;
    averageContentLength: number;
    categoryCounts: Record<string, number>;
    categoryList: string[];
    tagList: string[];
}
export declare function loadDummyData(): DummyDocument[];
export declare function generateRandomEmbedding(dimensions?: number): number[];
export declare function generateDocumentsWithEmbeddings(embeddingSize?: number): DummyDocumentWithEmbedding[];
export declare function getDummyDataStats(): DummyDataStats;
export declare function insertDummyDataToDatabase(dbRepo: CrudRepository): Promise<number>;
//# sourceMappingURL=dummy-data-loader.d.ts.map