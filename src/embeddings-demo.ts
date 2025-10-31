import { connectDB } from './create-db';
import { CrudRepository } from './crud.repo';
import { EmbeddingsService } from './embeddings.service';

// Example of how to use the new EmbeddingsService

async function demonstrateEmbeddingsService(): Promise<void> {
  console.log('🚀 Demonstrating EmbeddingsService Usage...\n');

  // Method 1: Use EmbeddingsService directly
  console.log('Method 1: Direct EmbeddingsService usage');
  const embeddingsService = new EmbeddingsService('nomic-embed-text');
  
  const directEmbedding = await embeddingsService.generateQueryEmbedding('What is machine learning?');
  console.log(`✅ Direct embedding generated: ${directEmbedding.length} dimensions\n`);

  // Method 2: Use EmbeddingsService through CrudRepository (NEW PATTERN)
  console.log('Method 2: EmbeddingsService through CrudRepository');
  const dbInstance = connectDB();
  
  // Create EmbeddingsService first
  const sharedEmbeddingsService = new EmbeddingsService('nomic-embed-text');
  
  // Pass it to CrudRepository
  const crudRepo = new CrudRepository(dbInstance, sharedEmbeddingsService);
  
  const repoEmbedding = await crudRepo.generateQueryEmbedding('What is machine learning?');
  console.log(`✅ Repository embedding generated: ${repoEmbedding.length} dimensions\n`);

  // Method 3: Access EmbeddingsService from CrudRepository
  console.log('Method 3: Access EmbeddingsService from CrudRepository');
  const embeddingsFromRepo = crudRepo.getEmbeddingsService();
  
  // Change the model if needed
  console.log(`Current model: ${embeddingsFromRepo.getEmbeddingModel()}`);
  
  // Generate document embedding with metadata
  const docEmbedding = await embeddingsFromRepo.generateDocumentEmbedding(
    'Machine Learning Basics',
    'This is a comprehensive guide to machine learning fundamentals.',
    'AI/ML',
    ['machine learning', 'artificial intelligence', 'data science']
  );
  console.log(`✅ Document embedding with metadata: ${docEmbedding.length} dimensions\n`);

  // Method 4: Insert document using the improved insertDocument
  console.log('Method 4: Insert document with automatic embedding generation');
  const docId = await crudRepo.insertDocument(
    'Advanced Neural Networks',
    'Deep dive into neural network architectures and training techniques.',
    'AI/ML',
    ['neural networks', 'deep learning', 'AI']
  );
  console.log(`✅ Document inserted with ID: ${docId}\n`);

  console.log('🎉 EmbeddingsService demonstration completed!');
}

// Run the demonstration
if (require.main === module) {
  demonstrateEmbeddingsService().catch(console.error);
}