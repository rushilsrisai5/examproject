/**
 * Re-export the institutional Firestore CRUD utility service from firestore.ts
 * Ensures full backward compatibility across all modules and components.
 */
export * from './firestore';
export { FirestoreService as default } from './firestore';
