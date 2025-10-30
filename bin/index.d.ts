export { connectDB, checkAndCreateTables, createTables } from './create-db';
export { DatabaseRepository } from './database.repo';
export { loadDummyData, generateRandomEmbedding, generateDocumentsWithEmbeddings, getDummyDataStats, insertDummyDataToDatabase } from './dummy-data-loader';
export { LLMQueryInterface, demonstrateLLMQueries } from './llm-query';
export { RealLLMIntegration, showInstallationInstructions, demonstrateRealLLMIntegration } from './llm-integration';
export type { Document, DocumentWithEmbedding, DocumentWithSimilarity, DatabaseStats, DatabaseSchema, LLMContext } from './database.repo';
export type { DummyDocument, DummyDocumentWithEmbedding, DummyDataStats } from './dummy-data-loader';
//# sourceMappingURL=index.d.ts.map