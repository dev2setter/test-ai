import { CrudRepository } from './crud.repo';
export declare class OfflineEmbeddingMigration {
    private embeddingService;
    constructor(ollamaUrl?: string);
    checkReadiness(): Promise<{
        ready: boolean;
        message: string;
    }>;
    migrateExistingDocuments(crudRepo: CrudRepository): Promise<{
        success: boolean;
        migratedCount: number;
        totalCount: number;
        errors: string[];
    }>;
    addDocumentWithOfflineEmbedding(crudRepo: CrudRepository, title: string, content: string): Promise<number>;
    batchMigrateDocuments(crudRepo: CrudRepository, batchSize?: number): Promise<{
        success: boolean;
        migratedCount: number;
        totalCount: number;
        errors: string[];
    }>;
}
export declare function runOfflineMigration(): Promise<void>;
//# sourceMappingURL=offline-migration.d.ts.map