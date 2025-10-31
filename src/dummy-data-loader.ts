import * as fs from 'fs';
import * as path from 'path';
import { CrudRepository } from './crud.repo';

// ========================================
// TYPES AND INTERFACES
// ========================================

export interface DummyDocument {
  title: string;
  content: string;
  category: string;
  tags: string[];
}

export interface DummyDocumentWithEmbedding extends DummyDocument {
  id: number;
  embedding: number[];
  created_at: string;
}

export interface DummyDataStats {
  totalDocuments: number;
  categories: number;
  totalTags: number;
  averageContentLength: number;
  categoryCounts: Record<string, number>;
  categoryList: string[];
  tagList: string[];
}

// ========================================
// DUMMY DATA LOADING UTILITIES
// ========================================

// Load dummy data from JSON file
export function loadDummyData(): DummyDocument[] {
  try {
    const dataPath = path.join(__dirname, '..', 'dummy-data.json');
    const jsonData = fs.readFileSync(dataPath, 'utf8');
    return JSON.parse(jsonData) as DummyDocument[];
  } catch (error) {
    console.error('❌ Error loading dummy data:', error);
    throw error;
  }
}

// Generate random vector embedding for testing
export function generateRandomEmbedding(dimensions: number = 384): number[] {
  return Array.from({ length: dimensions }, () => Math.random() * 2 - 1);
}

// Generate embeddings for all documents
export function generateDocumentsWithEmbeddings(embeddingSize: number = 384): DummyDocumentWithEmbedding[] {
  const documents = loadDummyData();
  
  return documents.map((doc, index) => ({
    ...doc,
    id: index + 1,
    embedding: generateRandomEmbedding(embeddingSize),
    created_at: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString() // Random date within last 30 days
  }));
}

// Get basic statistics about the dummy data
export function getDummyDataStats(): DummyDataStats {
  const documents = loadDummyData();
  
  // Get all unique categories
  const categories = [...new Set(documents.map(doc => doc.category))];
  
  // Get all unique tags
  const allTags = documents.flatMap(doc => doc.tags);
  const uniqueTags = [...new Set(allTags)];
  
  // Calculate average content length
  const averageContentLength = Math.round(
    documents.reduce((sum, doc) => sum + doc.content.length, 0) / documents.length
  );
  
  // Count documents by category
  const categoryCounts = categories.reduce((acc, category) => {
    acc[category] = documents.filter(doc => doc.category === category).length;
    return acc;
  }, {} as Record<string, number>);
  
  return {
    totalDocuments: documents.length,
    categories: categories.length,
    totalTags: uniqueTags.length,
    averageContentLength,
    categoryCounts,
    categoryList: categories,
    tagList: uniqueTags
  };
}

// Insert all dummy data into the database
export async function insertDummyDataToDatabase(dbRepo: CrudRepository): Promise<number> {
  try {
    console.log('📥 Loading dummy data into database...');

    // Load raw dummy data (no need for random embeddings)
    const documents = loadDummyData();
    let insertedCount = 0;
    
    for (const doc of documents) {
      try {
        // CrudRepository automatically generates Ollama embeddings
        // Pass category and tags as separate parameters so they're stored in dedicated columns
        const docId = await dbRepo.insertDocument(doc.title, doc.content, doc.category, doc.tags);
        insertedCount++;
        
        if (insertedCount % 5 === 0) {
          console.log(`   Inserted ${insertedCount}/${documents.length} documents...`);
        }
      } catch (error) {
        console.error(`❌ Error inserting document "${doc.title}":`, (error as Error).message);
      }
    }
    
    console.log(`✅ Successfully inserted ${insertedCount} documents with Ollama embeddings`);
    
    // Display stats
    const stats = dbRepo.getStats();
    console.log('📊 Database Statistics:');
    console.log(`   Total Documents: ${stats.documents}`);
    console.log(`   Total Embeddings: ${stats.embeddings}`);
    console.log(`   Orphaned Documents: ${stats.orphaned_documents}`);
    
    return insertedCount;
  } catch (error) {
    console.error('❌ Error inserting dummy data:', error);
    throw error;
  }
}