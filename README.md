# SQLite with VSS (Vector Similarity Search) - Node.js

This project demonstrates how to implement Vector Similarity Search (VSS) with SQLite in Node.js using custom similarity algorithms including cosine similarity and Euclidean distance.

## Features

- ✅ SQLite database with custom vector similarity search
- ✅ Cosine similarity and Euclidean distance algorithms
- ✅ Document storage with separate embeddings table
- ✅ CRUD operations with referential integrity
- ✅ Performance optimization with indexing
- ✅ **LLM Integration for natural language queries**
- ✅ **Text-to-SQL with OpenAI, Claude, Hugging Face**
- ✅ **Semantic search with real embeddings**
- ✅ **Hybrid search (text + semantic)**
- ✅ Comprehensive test suite
- ✅ Real-world examples

## Prerequisites

- Node.js 16+ 
- npm or yarn

## Installation

1. Clone or download this project
2. Install dependencies:
```bash
npm install
```

## Quick Start

```bash
# Create the database
npm run create-db
# or
node create-db.js

# Run the main demo
npm start

# Run examples
npm run examples

# Test LLM query interface
npm run llm-query

# Test LLM integration (with real APIs)
npm run llm-integration

# Show setup guide for real LLM APIs
node setup-guide.js

# Run tests
npm test

# Quick start guide
node quick-start.js
```

## 🧪 Testing with Dummy Data

The project includes comprehensive dummy data for testing all functionality:

```bash
# Create database with realistic sample data
npm run create-dummy-db

# Run comprehensive dummy data demo
npm run dummy-data

# Interactive query demo with dummy data
npm run query-dummy

# Quick test with dummy data
npm run quick-test

# View dummy data structure (without database)
npm run view-dummy
```

### Dummy Data Features
- **15 sample documents** across 12 categories (AI/ML, Database, Web Dev, etc.)
- **384-dimensional embeddings** for each document
- **Realistic content** covering various tech topics
- **Tags and categorization** for advanced queries
- **Performance testing** capabilities
- **JSON format** for easy editing and customization
- **Separate embedding generation** for flexibility

### Dummy Data Files
- **`dummy-data.json`** - Pure JSON data with 15 sample documents
- **`generate-embeddings.js`** - Embedding generation and data processing utilities
- **`demo-dummy-data.js`** - Comprehensive demo script
- **`query-dummy-data.js`** - Interactive query demonstration

## Usage

### Basic Usage (Updated Structure)

```javascript
// Import from the new structure
const { connectDB } = require('./create-db.js');

function example() {
  // Create database
  const dbPath = 'mydb.db';
  connectDB(dbPath);
  
  // Initialize repository for operations
  const db = connectDB();
  repo.connect();
  
  // Insert a document with embedding
  const embedding = [0.1, 0.2, 0.3, ...]; // Your vector
  const docId = repo.insertDocument(
    "Sample Document", 
    "This is sample content", 
    embedding
  );
  
  // Search for similar documents
  const queryEmbedding = [0.15, 0.25, 0.35, ...];
  const results = repo.searchSimilar(queryEmbedding, 5);
  
  repo.close();
}
```

### Using Dummy Data

```javascript
// Import the embedding generator
const { generateDocumentsWithEmbeddings } = require('./create-db.js');

function exampleWithDummyData() {
  // Generate documents with embeddings from JSON data
  const documentsWithEmbeddings = generateDocumentsWithEmbeddings(384);
  
  // Create and populate database
  const db = connectDB();
  repo.connect();
  
  // Insert all dummy documents
  documentsWithEmbeddings.forEach(doc => {
    repo.insertDocument(doc.title, doc.content, doc.embedding);
  });
  
  // Test similarity search
  const queryEmbedding = documentsWithEmbeddings[0].embedding;
  const results = repo.searchSimilar(queryEmbedding, 5);
  
  repo.close();
}
```

## API Reference

### Database Object

#### Factory Function
- `connectDB()` - Connect to persistent database.db, create tables if needed

#### Methods

- `insertDocument(title, content, embedding)` - Insert document with vector embedding
- `searchSimilar(queryEmbedding, limit, useCosineSimilarity)` - Find similar documents
- `getAllDocuments()` - Get all documents (without embeddings)
- `getDocumentById(id)` - Get specific document with embedding
- `deleteDocument(id)` - Delete a document by ID
- `cosineSimilarity(vecA, vecB)` - Calculate cosine similarity
- `euclideanDistance(vecA, vecB)` - Calculate Euclidean distance
- `close()` - Close database connection

## Database Schema

### documents table
```sql
CREATE TABLE documents (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  embedding TEXT, -- JSON string of vector array
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

## Vector Embeddings

This implementation supports any dimensional vectors. Default examples use 384-dimensional vectors.

### 1. Generate Random Embeddings (for testing)
```javascript
const { generateRandomEmbedding } = require('./index.js');
const embedding = generateRandomEmbedding(384);
```

### 2. Use Real Embeddings

#### OpenAI Embeddings
```javascript
const openai = new OpenAI({ apiKey: 'your-api-key' });

async function getEmbedding(text) {
  const response = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: text,
  });
  return response.data[0].embedding;
}
```

#### Hugging Face Inference
```javascript
const { HfInference } = require('@huggingface/inference');
const hf = new HfInference('your-api-key');

async function getHFEmbedding(text) {
  const result = await hf.featureExtraction({
    model: 'sentence-transformers/all-MiniLM-L6-v2',
    inputs: text
  });
  return result;
}
```

#### Local Python with Sentence Transformers
```python
from sentence_transformers import SentenceTransformer
import json

model = SentenceTransformer('all-MiniLM-L6-v2')
embeddings = model.encode(['Your text here'])
# Save to JSON file for Node.js consumption
```

### 3. LLM Query Interface

#### Natural Language to SQL
```javascript
const { connectDB } = require('./create-db.js');
const { LLMQueryInterface } = require('./llm-query.js');

const db = await connectDB();
const llm = new LLMQueryInterface(db);

// Ask questions in natural language
await llm.queryWithNaturalLanguage('show all documents about machine learning');
await llm.queryWithNaturalLanguage('count documents created this month');
await llm.queryWithNaturalLanguage('find documents with embeddings');
```

#### Real LLM Integration
```javascript
// Install: npm install openai dotenv
const { RealLLMIntegration } = require('./llm-integration.js');

require('dotenv').config();
const llm = new RealLLMIntegration(db, process.env.OPENAI_API_KEY);

// AI-powered queries
await llm.queryWithNaturalLanguage('Show me documents about neural networks');
await llm.enhancedSemanticSearch('machine learning algorithms');
await llm.smartInsertDocument('AI Paper', 'Content about AI...');
```

#### Hybrid Search
```javascript
// Combine text search and semantic search
const results = await llm.hybridSearch('machine learning', 0.3, 0.7);
// 30% text matching, 70% semantic similarity
```

## Similarity Algorithms

### Cosine Similarity (Default)
- **Range**: -1 to 1 (1 = identical, 0 = orthogonal, -1 = opposite)
- **Best for**: Text embeddings, high-dimensional vectors
- **Usage**: `db.searchSimilar(embedding, 5, true)`

### Euclidean Distance
- **Range**: 0 to ∞ (0 = identical, larger = more different)
- **Best for**: Low-dimensional vectors, spatial data
- **Usage**: `db.searchSimilar(embedding, 5, false)`

## Performance

Based on test results:
- **Insertion**: ~3.25ms per document
- **Search**: ~6.40ms per search (across 100 documents)
- **Memory**: Efficient JSON storage for embeddings

### Optimization Tips

1. **Batch Operations**: Insert multiple documents in sequence
2. **Dimension Reduction**: Use 384 or fewer dimensions for faster computation
3. **Result Limiting**: Use appropriate limits for search results
4. **Indexing**: SQLite automatically indexes primary keys

## File Structure

```
sqlite-vss-demo/
├── package.json              # Project configuration
├── create-db.js              # 🔧 Database creation script
├── index.js                 # Main demo using connectDB function
├── llm-query.js             # 🤖 LLM query interface (NEW)
├── llm-integration.js       # 🌐 Real LLM API integration (NEW)
├── setup-guide.js           # 📋 LLM setup instructions (NEW)
├── test.js                  # Comprehensive test suite
├── examples.js              # Real-world usage examples
├── quick-start.js           # Getting started guide
├── README.md                # This file
└── .gitignore              # Git ignore patterns
```

## Examples

### Document Search System
```bash
npm run examples
```

### Performance Testing
```bash
npm test
```

### Integration Patterns
```bash
node quick-start.js
```

## Common Use Cases

1. **Semantic Search**: Find documents similar to user queries
2. **Recommendation Systems**: Suggest similar content
3. **Duplicate Detection**: Identify similar or duplicate documents
4. **Content Clustering**: Group related documents
5. **Question Answering**: Find relevant context for questions
6. **🆕 Natural Language Database Queries**: Ask questions in plain English
7. **🆕 AI-Powered Search**: Combine text and semantic search
8. **🆕 Smart Content Management**: Auto-categorize and search content

## Troubleshooting

### Common Issues

1. **Embedding Dimension Mismatch**:
   - Ensure all embeddings have the same dimensions
   - Check vector length before insertion

2. **Poor Search Results**:
   - Try different similarity algorithms (cosine vs. euclidean)
   - Adjust similarity thresholds
   - Use higher-quality embedding models

3. **Performance Issues**:
   - Reduce embedding dimensions
   - Limit search results
   - Consider database indexing for large datasets

## Dependencies

- `better-sqlite3`: Fast SQLite3 bindings for Node.js
- `nodemon`: Development auto-reload (dev dependency)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality
4. Ensure all tests pass
5. Submit a pull request

## License

MIT License - feel free to use in your projects!
