"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmbeddingsService = void 0;
const ollama_1 = require("ollama");
// ========================================
// EMBEDDINGS SERVICE CLASS
// ========================================
class EmbeddingsService {
    constructor(embeddingModel = 'nomic-embed-text', ollamaInstance) {
        this.ollama = ollamaInstance || new ollama_1.Ollama();
        this.embeddingModel = embeddingModel;
    }
    // Generate embedding using Ollama
    async generateEmbedding(text) {
        try {
            console.log(`🔮 Generating embedding for text using model: ${this.embeddingModel}`);
            const response = await this.ollama.embeddings({
                model: this.embeddingModel,
                prompt: text.trim().substring(0, 4000)
            });
            console.log(`✅ Embedding generated successfully (${response.embedding.length} dimensions)`);
            return response.embedding;
        }
        catch (error) {
            console.error('❌ Error generating embedding with Ollama:', error);
            throw new Error(`Failed to generate embedding: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    // Generate embedding for document with metadata
    async generateDocumentEmbedding(title, content, category, tags) {
        // Include all metadata for richer embeddings
        const categoryText = category ? `\nCategory: ${category}` : '';
        const tagsText = tags && tags.length > 0 ? `\nTags: ${tags.join(', ')}` : '';
        const combinedText = `${title}\n\n${content}${categoryText}${tagsText}`;
        return this.generateEmbedding(combinedText);
    }
    // Generate embedding for search queries
    async generateQueryEmbedding(text) {
        return this.generateEmbedding(text);
    }
    // Get the embedding model being used
    getEmbeddingModel() {
        return this.embeddingModel;
    }
    // Set a different embedding model
    setEmbeddingModel(model) {
        this.embeddingModel = model;
        console.log(`🔄 Embedding model changed to: ${model}`);
    }
    // Get the Ollama instance (useful for sharing across multiple services)
    getOllamaInstance() {
        return this.ollama;
    }
}
exports.EmbeddingsService = EmbeddingsService;
//# sourceMappingURL=embeddings.service.js.map