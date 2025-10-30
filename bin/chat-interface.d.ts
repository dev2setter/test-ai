export interface ChatMessage {
    role: 'user' | 'assistant' | 'system';
    content: string;
    timestamp?: Date;
    searchResults?: any[];
}
export interface ChatResponse {
    message: string;
    searchResults: any[];
    sources: string[];
    confidence: number;
    responseTime: number;
    model: string;
}
interface ChatService {
    chat(message: string): Promise<ChatResponse>;
    getStats(): Promise<any>;
    getHistory(): ChatMessage[];
    clearHistory(): void;
}
export declare class ConsoleChatInterface {
    private chatService;
    constructor(chatService: ChatService);
    start(): Promise<void>;
}
export {};
//# sourceMappingURL=chat-interface.d.ts.map