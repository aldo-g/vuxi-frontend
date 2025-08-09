/**
 * Database Connection - Data Persistence Layer
 * 
 * Database connection and query utilities for the application.
 * Provides abstracted database operations and connection
 * management for data persistence.
 * 
 * @responsibilities
 * - Establishes database connections
 * - Provides query execution utilities
 * - Handles database error management
 * - Manages connection pooling and cleanup
 * - Abstracts database operations for application use
 */

// Frontend-only deployment stub - replaces @repo/db import
const database = {
  $transaction: async () => {
    throw new Error('Database operations not available in frontend-only mode');
  },
  project: {
    upsert: async () => {
      throw new Error('Database operations not available in frontend-only mode');
    },
    findMany: async () => {
      throw new Error('Database operations not available in frontend-only mode');
    },
    findUnique: async () => {
      throw new Error('Database operations not available in frontend-only mode');
    },
    create: async () => {
      throw new Error('Database operations not available in frontend-only mode');
    },
    update: async () => {
      throw new Error('Database operations not available in frontend-only mode');
    }
  },
  analysisRun: {
    create: async () => {
      throw new Error('Database operations not available in frontend-only mode');
    },
    findMany: async () => {
      throw new Error('Database operations not available in frontend-only mode');
    },
    findUnique: async () => {
      throw new Error('Database operations not available in frontend-only mode');
    },
    update: async () => {
      throw new Error('Database operations not available in frontend-only mode');
    }
  },
  screenshot: {
    create: async () => {
      throw new Error('Database operations not available in frontend-only mode');
    },
    createMany: async () => {
      throw new Error('Database operations not available in frontend-only mode');
    }
  },
  user: {
    findUnique: async () => {
      throw new Error('Database operations not available in frontend-only mode');
    },
    create: async () => {
      throw new Error('Database operations not available in frontend-only mode');
    },
    update: async () => {
      throw new Error('Database operations not available in frontend-only mode');
    }
  }
};

export default database;