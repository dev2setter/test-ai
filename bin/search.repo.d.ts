import Database from 'better-sqlite3';
import { Document } from './crud.repo';
export interface DocumentWithSimilarity extends Document {
    similarity: number;
    distance: number;
}
export interface SearchFilters {
    startDate?: string;
    endDate?: string;
    categories?: string[];
    minSimilarity?: number;
    maxResults?: number;
}
export interface HybridSearchResult extends DocumentWithSimilarity {
    textScore: number;
    semanticScore: number;
    totalScore: number;
}
export declare class SearchRepository {
    private db;
    constructor(dbInstance: Database.Database);
    cosineSimilarity(vecA: number[], vecB: number[]): number;
    euclideanDistance(vecA: number[], vecB: number[]): number;
    searchSimilar(queryEmbedding: number[], limit?: number, useCosineSimilarity?: boolean, filters?: SearchFilters): DocumentWithSimilarity[];
    searchByText(searchTerm: string, limit?: number): Document[];
    searchByTextAdvanced(searchTerms: string[], operator?: 'AND' | 'OR', limit?: number): Document[];
    hybridSearch(query: string, queryEmbedding: number[], textWeight?: number, semanticWeight?: number, limit?: number): HybridSearchResult[];
    searchWithClustering(queryEmbedding: number[], limit?: number, similarityThreshold?: number): Array<{
        cluster: number;
        documents: DocumentWithSimilarity[];
    }>;
    searchWithFacets(queryEmbedding: number[], limit?: number): {
        results: DocumentWithSimilarity[];
        facets: {
            similarityRanges: {
                range: string;
                count: number;
            }[];
            timePeriods: {
                period: string;
                count: number;
            }[];
        };
    };
}
//# sourceMappingURL=search.repo.d.ts.map