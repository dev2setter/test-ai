// ========================================
// OFFLINE LLM API INTERFACE
// ========================================
// Simple JavaScript interface for offline LLM and database communication

import { connectDB } from './create-db';
import { CrudRepository } from './crud.repo';
import { SearchRepository } from './search.repo';
import { OfflineChatService } from './offline-chat-simple';

// ========================================
// OFFLINE LLM API CLASS
// ========================================

export class OfflineLLMAPI {
  private crudRepo: CrudRepository;
  private searchRepo: SearchRepository;
  private chatService?: OfflineChatService;

  constructor() {
    // Initialize database and repositories
    const dbInstance = connectDB();
    this.crudRepo = new CrudRepository(dbInstance);
    this.searchRepo = new SearchRepository(dbInstance);
  }

  // Initialize offline chat (requires Ollama)
  async initialize(): Promise<boolean> {
    try {
      this.chatService = new OfflineChatService(this.searchRepo, this.crudRepo);
      
      // Check if Ollama is available
      const available = await this.chatService.isAvailable();
      if (!available) {
        console.error('❌ Ollama is not ready');
        console.log('💡 Run: ollama serve');
        console.log('💡 Install models: ollama pull llama3.2:3b && ollama pull nomic-embed-text');
        return false;
      }
      
      console.log('✅ Offline LLM API initialized');
      return true;
    } catch (error) {
      console.error('❌ Failed to initialize offline chat:', error);
      return false;
    }
  }

  // Main chat method
  async chat(message: string): Promise<{
    success: boolean;
    response?: string;
    sources?: string[];
    confidence?: number;
    model?: string;
    responseTime?: number;
    error?: string;
  }> {
    try {
      if (!this.chatService) {
        return {
          success: false,
          error: 'Chat service not initialized. Call initialize() first.'
        };
      }

      const result = await this.chatService.chat(message);
      
      return {
        success: true,
        response: result.message,
        sources: result.sources,
        confidence: result.confidence,
        model: result.model,
        responseTime: result.responseTime
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Search database for similar documents
  async searchDatabase(query: string, limit: number = 5): Promise<{
    success: boolean;
    results?: any[];
    error?: string;
  }> {
    try {
      if (!this.chatService) {
        return {
          success: false,
          error: 'Chat service not initialized. Call initialize() first.'
        };
      }

      // Generate embedding for search
      const embedding = await (this.chatService as any).generateEmbedding(query);
      const results = this.searchRepo.searchSimilar(embedding, limit);
      
      return {
        success: true,
        results
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Add document to database
  async addDocument(title: string, content: string): Promise<{
    success: boolean;
    documentId?: number;
    error?: string;
  }> {
    try {
      if (!this.chatService) {
        return {
          success: false,
          error: 'Chat service not initialized. Call initialize() first.'
        };
      }

      // Generate embedding for the document
      const embedding = await (this.chatService as any).generateEmbedding(`${title}\n\n${content}`);
      const documentId = this.crudRepo.insertDocument(title, content, embedding);
      
      return {
        success: true,
        documentId
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Get database statistics
  async getStats(): Promise<{
    success: boolean;
    stats?: any;
    error?: string;
  }> {
    try {
      const stats = this.crudRepo.getStats();
      return {
        success: true,
        stats
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Get conversation history
  getHistory(): any[] {
    if (!this.chatService) {
      return [];
    }
    return this.chatService.getHistory();
  }

  // Clear conversation history
  clearHistory(): boolean {
    if (!this.chatService) {
      return false;
    }
    this.chatService.clearHistory();
    return true;
  }

  // Check if service is ready
  isReady(): boolean {
    return !!this.chatService;
  }
}

// ========================================
// USAGE EXAMPLE
// ========================================

export async function demonstrateOfflineLLMAPI(): Promise<void> {
  console.log('🚀 Offline LLM API Demo\n');
  
  const api = new OfflineLLMAPI();
  
  try {
    // Initialize the API
    console.log('🔧 Initializing offline LLM API...');
    const initialized = await api.initialize();
    
    if (!initialized) {
      console.log('❌ Failed to initialize. Please make sure Ollama is running.');
      return;
    }

    // Get database stats
    const statsResult = await api.getStats();
    if (statsResult.success) {
      console.log('📊 Database stats:', statsResult.stats);
    }

    // Example chat
    console.log('\n💬 Chat example:');
    const chatResult = await api.chat('What documents do you have about machine learning?');
    
    if (chatResult.success) {
      console.log('🤖 Response:', chatResult.response);
      console.log('📚 Sources:', chatResult.sources);
      console.log('🎯 Confidence:', chatResult.confidence);
      console.log('⚡ Response time:', chatResult.responseTime + 'ms');
    } else {
      console.log('❌ Chat error:', chatResult.error);
    }

    // Example search
    console.log('\n🔍 Search example:');
    const searchResult = await api.searchDatabase('artificial intelligence', 3);
    
    if (searchResult.success) {
      console.log('📄 Found', searchResult.results?.length, 'documents');
      searchResult.results?.forEach((doc, i) => {
        console.log(`   ${i + 1}. ${doc.title} (similarity: ${doc.similarity?.toFixed(3)})`);
      });
    } else {
      console.log('❌ Search error:', searchResult.error);
    }

    // Example add document
    console.log('\n📝 Adding document example:');
    const addResult = await api.addDocument(
      'API Documentation', 
      'This is documentation for the Offline LLM API, showing how to use it for chat and search.'
    );
    
    if (addResult.success) {
      console.log('✅ Document added with ID:', addResult.documentId);
    } else {
      console.log('❌ Add document error:', addResult.error);
    }

  } catch (error) {
    console.error('❌ Demo failed:', error);
  }
}

// Run demo if executed directly
if (require.main === module) {
  demonstrateOfflineLLMAPI().catch(console.error);
}