import { DatabaseRepository, DocumentWithSimilarity } from './database.repo';
interface HybridSearchResult {
    id: number;
    title: string;
    content: string;
    created_at: string;
    textScore: number;
    semanticScore: number;
    totalScore: number;
    similarity?: number;
}
export declare class LLMQueryInterface {
    protected db: DatabaseRepository;
    constructor(db: DatabaseRepository);
    generateSystemPrompt(): string;
    processNaturalLanguageQuery(userQuery: string): Promise<string>;
    queryWithNaturalLanguage(userQuery: string): Promise<any>;
    semanticSearch(query: string, useEmbeddingAPI?: boolean): Promise<DocumentWithSimilarity[]>;
    hybridSearch(query: string, textWeight?: number, semanticWeight?: number): Promise<HybridSearchResult[]>;
}
export declare function demonstrateLLMQueries(): Promise<void>;
export {};
//# sourceMappingURL=llm-query.d.ts.map