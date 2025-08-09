/**
 * Database Connection - Data Persistence Layer
 * 
 * Database connection and query utilities for the application.
 * Provides abstracted database operations and connection
 * management for data persistence.
 * 
 * Frontend-only deployment stub - replaces @repo/db import
 * Returns null/undefined for database operations to prevent build errors
 * while gracefully handling the method calls.
 */

// Frontend-only deployment stub - replaces @repo/db import
const database = {
  $transaction: async (...args: any[]) => {
    console.warn('Database operations not available in frontend-only mode');
    return null;
  },
  project: {
    upsert: async (...args: any[]) => {
      console.warn('Database operations not available in frontend-only mode');
      return null;
    },
    findMany: async (...args: any[]) => {
      console.warn('Database operations not available in frontend-only mode');
      return [];
    },
    findUnique: async (...args: any[]) => {
      console.warn('Database operations not available in frontend-only mode');
      return null;
    },
    create: async (...args: any[]) => {
      console.warn('Database operations not available in frontend-only mode');
      return null;
    },
    update: async (...args: any[]) => {
      console.warn('Database operations not available in frontend-only mode');
      return null;
    }
  },
  analysisRun: {
    create: async (...args: any[]) => {
      console.warn('Database operations not available in frontend-only mode');
      return null;
    },
    findMany: async (...args: any[]) => {
      console.warn('Database operations not available in frontend-only mode');
      return [];
    },
    findUnique: async (...args: any[]) => {
      console.warn('Database operations not available in frontend-only mode');
      return null;
    },
    update: async (...args: any[]) => {
      console.warn('Database operations not available in frontend-only mode');
      return null;
    }
  },
  screenshot: {
    create: async (...args: any[]) => {
      console.warn('Database operations not available in frontend-only mode');
      return null;
    },
    createMany: async (...args: any[]) => {
      console.warn('Database operations not available in frontend-only mode');
      return null;
    }
  },
  user: {
    findUnique: async (...args: any[]) => {
      console.warn('Database operations not available in frontend-only mode');
      return null; // This will make authentication fail gracefully
    },
    create: async (...args: any[]) => {
      console.warn('Database operations not available in frontend-only mode');
      return null;
    },
    update: async (...args: any[]) => {
      console.warn('Database operations not available in frontend-only mode');
      return null;
    }
  }
};

export default database;