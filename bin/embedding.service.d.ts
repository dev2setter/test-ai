export declare class EmbeddingService {
    private apiKey;
    private model;
    constructor(apiKey: string, model?: string);
    generateEmbedding(text: string): Promise<number[]>;
    generateDocumentEmbedding(title: string, content: string): Promise<number[]>;
    generateBatchEmbeddings(texts: string[]): Promise<number[][]>;
    private preprocessText;
}
export declare class LocalEmbeddingService {
    private modelPath;
    constructor(modelPath?: string);
    generateEmbedding(text: string): Promise<number[]>;
}
export declare class RealWorldEmbeddingExample {
    private embeddingService;
    constructor(apiKey: string);
    insertDocumentWithRealEmbedding(crudRepo: any, // Your CrudRepository
    title: string, content: string): Promise<number>;
    searchWithRealEmbedding(searchRepo: any, // Your SearchRepository
    query: string, limit?: number): Promise<any[]>;
    processBatchDocuments(crudRepo: any, documents: Array<{
        title: string;
        content: string;
    }>): Promise<number[]>;
}
export declare const EmbeddingConfigs: {
    openai: {
        model: string;
        maxTokens: number;
        dimensions: number;
    };
    openaiLarge: {
        model: string;
        maxTokens: number;
        dimensions: number;
    };
    local: {
        model: string;
        dimensions: number;
    };
    localLarge: {
        model: string;
        dimensions: number;
    };
};
export declare class EmbeddingMigration {
    private embeddingService;
    constructor(apiKey: string);
    migrateExistingDocuments(crudRepo: any): Promise<void>;
}
//# sourceMappingURL=embedding.service.d.ts.map