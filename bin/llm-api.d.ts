export declare class LLMDatabaseAPI {
    private crudRepo;
    private searchRepo;
    private offlineChatService?;
    private currentMode;
    constructor();
    initializeOnlineChat(apiKey: string): Promise<boolean>;
    initializeOfflineChat(): Promise<boolean>;
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
        count?: number;
        error?: string;
    }>;
    addDocument(title: string, content: string): Promise<{
        success: boolean;
        documentId?: number;
        error?: string;
    }>;
    getAllDocuments(): Promise<{
        success: boolean;
        documents?: any[];
        count?: number;
        error?: string;
    }>;
    getStats(): Promise<{
        success: boolean;
        stats?: any;
        error?: string;
    }>;
    switchMode(mode: 'online' | 'offline'): void;
    getCurrentMode(): 'online' | 'offline';
    close(): void;
}
export declare function exampleUsage(): Promise<void>;
export default LLMDatabaseAPI;
//# sourceMappingURL=llm-api.d.ts.map