import Database from 'better-sqlite3';

// ========================================
// TYPES AND INTERFACES
// ========================================

interface TableCreationResult {
  created: boolean;
}

// ========================================
// DATABASE CONNECTION AND INITIALIZATION
// ========================================

export function connectDB(): Database.Database {
  // Hardcoded persistent database path
  const persistentDbPath = 'database.db';
  console.log('🔌 Connecting to SQLite Database with VSS Support...\n');
  
  try {
    // Create/Connect to SQLite database
    const db = new Database(persistentDbPath);

    console.log('✅ SQLite database connection established');
    
    // Check if tables exist, create if they don't
    const tablesExist = checkAndCreateTables(db);
    
    if (tablesExist.created) {
      console.log(`✅ Database initialized successfully: ${persistentDbPath}`);
      console.log('📋 Database structure:');
      console.log('   - Table: documents (id, title, content, created_at)');
      console.log('   - Table: embeddings (id, document_id, embedding, created_at)');
      console.log('   - Foreign Key: embeddings.document_id → documents.id');
      console.log('   - Index: idx_embeddings_document_id for fast lookups');
      console.log('   - Features: Vector similarity search (cosine & euclidean)');
    } else {
      console.log(`✅ Connected to existing database: ${persistentDbPath}`);
      console.log('📊 Using existing tables and data');
    }
    
    // Return the connected database instance
    return db;
  } catch (error) {
    console.error('❌ Error connecting to database:', error);
    throw error;
  }
}

export function checkAndCreateTables(db: Database.Database): TableCreationResult {
  let tablesCreated = false;
  
  // Check if documents table exists
  const documentsTableExists = db.prepare(`
    SELECT name FROM sqlite_master 
    WHERE type='table' AND name='documents'
  `).get();
  
  // Check if embeddings table exists
  const embeddingsTableExists = db.prepare(`
    SELECT name FROM sqlite_master 
    WHERE type='table' AND name='embeddings'
  `).get();
  
  // Create tables only if they don't exist
  if (!documentsTableExists || !embeddingsTableExists) {
    console.log('📋 Creating database tables...');
    
    // Create documents table if it doesn't exist
    if (!documentsTableExists) {
      db.exec(`
        CREATE TABLE documents (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          title TEXT NOT NULL,
          content TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
      `);
      console.log('✅ Created documents table');
    }

    // Create embeddings table if it doesn't exist
    if (!embeddingsTableExists) {
      db.exec(`
        CREATE TABLE embeddings (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          document_id INTEGER NOT NULL,
          embedding TEXT NOT NULL, -- Store as JSON string
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (document_id) REFERENCES documents (id) ON DELETE CASCADE
        );
      `);
      console.log('✅ Created embeddings table');
    }

    // Create index for faster lookups
    db.exec(`
      CREATE INDEX IF NOT EXISTS idx_embeddings_document_id 
      ON embeddings(document_id);
    `);

    // Enable foreign keys for cascade delete
    db.exec('PRAGMA foreign_keys = ON;');
    
    console.log('✅ Tables and indexes created successfully');
    tablesCreated = true;
  } else {
    console.log('✅ Database tables already exist');
    // Still enable foreign keys
    db.exec('PRAGMA foreign_keys = ON;');
  }
  
  return { created: tablesCreated };
}

export function createTables(db: Database.Database): TableCreationResult {
  // Legacy function - now redirects to checkAndCreateTables
  return checkAndCreateTables(db);
}