import Database from 'better-sqlite3';
interface TableCreationResult {
    created: boolean;
}
export declare function connectDB(): Database.Database;
export declare function checkAndCreateTables(db: Database.Database): TableCreationResult;
export declare function createTables(db: Database.Database): TableCreationResult;
export {};
//# sourceMappingURL=create-db.d.ts.map