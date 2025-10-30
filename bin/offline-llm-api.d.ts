export declare class OfflineLLMAPI {
    private crudRepo;
    private searchRepo;
    private chatService?;
    constructor();
    initialize(): Promise<boolean>;
    chat(message: string): Promise<{
        success: boolean;
        response?: string;
        sources?: string[];
        confidence?: number;
        model?: string;
        responseTime?: number;
        error?: string;
    }>;
    searchDatabase(query: string, limit?: number): Promise<{
        success: boolean;
        results?: any[];
        error?: string;
    }>;
    addDocument(title: string, content: string): Promise<{
        success: boolean;
        documentId?: number;
        error?: string;
    }>;
    getStats(): Promise<{
        success: boolean;
        stats?: any;
        error?: string;
    }>;
    getHistory(): any[];
    clearHistory(): boolean;
    isReady(): boolean;
}
export declare function demonstrateOfflineLLMAPI(): Promise<void>;
//# sourceMappingURL=offline-llm-api.d.ts.map