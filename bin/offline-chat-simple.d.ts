import { CrudRepository } from './crud.repo';
import { SearchRepository } from './search.repo';
interface ChatMessage {
    role: 'user' | 'assistant' | 'system';
    content: string;
    timestamp?: Date;
    searchResults?: any[];
}
interface ChatResponse {
    message: string;
    searchResults: any[];
    sources: string[];
    confidence: number;
    model: string;
    responseTime: number;
}
export declare class OfflineChatService {
    private ollama;
    private chatModel;
    private embeddingModel;
    private searchRepo;
    private crudRepo;
    private conversationHistory;
    private context;
    constructor(searchRepo: SearchRepository, crudRepo: CrudRepository, chatModel?: string, embeddingModel?: string);
    chat(userMessage: string): Promise<ChatResponse>;
    private generateEmbedding;
    checkEmbeddingCompatibility(): Promise<{
        compatible: boolean;
        dbDimension: number;
        modelDimension: number;
        needsMigration: boolean;
    }>;
    migrateEmbeddings(): Promise<boolean>;
    private generateResponse;
    isAvailable(): Promise<boolean>;
    installModels(): Promise<boolean>;
    getAvailableModels(): Promise<string[]>;
    switchModel(newModel: string): void;
    private prepareContext;
    private combineResults;
    private calculateConfidence;
    getHistory(): ChatMessage[];
    clearHistory(): void;
    getStats(): Promise<any>;
}
export declare function startOfflineChat(): Promise<void>;
export {};
//# sourceMappingURL=offline-chat-simple.d.ts.map