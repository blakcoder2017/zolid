
// const { Pool } = require('pg');
// require('dotenv').config();
// const { DB_USER, DB_HOST, DB_NAME, DB_PASS, DB_PORT } = process.env;

// // Enhanced PostgreSQL connection pool
// const pool = new Pool({
//     user: DB_USER,
//     host: DB_HOST,
//     database: DB_NAME,
//     password: DB_PASS,
//     port: DB_PORT,
    
//     // Connection pool settings
//     max: parseInt(process.env.DB_POOL_MAX) || 25,
//     min: parseInt(process.env.DB_POOL_MIN) || 5,
//     idleTimeoutMillis: 30000,
//     connectionTimeoutMillis: 10000, // Increased from 5000 to 10000
//     keepAlive: true,
//     keepAliveInitialDelayMillis: 10000,

//     // SSL configuration for production
//     ssl: process.env.NODE_ENV === 'production' ? {
//         rejectUnauthorized: false,
//         ca: process.env.DB_SSL_CERT
//     } : false,

//     // Application-level settings
//     application_name: 'zolid-backend',
//     statement_timeout: '60s', // Increased from 30s to 60s
//     idle_in_transaction_session_timeout: '120s' // Increased to 120s to accommodate longer transactions
// });

// // Enhanced error handling for the pool
// pool.on('error', (err) => {
//     console.error('FATAL: Unexpected error on idle database client.', err);

//     if (process.env.NODE_ENV === 'production') {
//         // Implement alerting logic here (e.g. Sentry or PagerDuty)
//     }
// });

// // Connection timeout handling
// pool.on('timeout', () => {
//     console.warn('Database connection pool timeout occurred. Consider increasing pool size or connection timeout.');
// });

// // Connection event logging and per-client error handling
// pool.on('connect', (client) => {
//     console.log('Database client connected');
    
//     // CRITICAL: Handle errors on individual clients to prevent unhandled 'error' events
//     // from crashing the Node.js process (Fixes node:events:502)
//     client.on('error', (err) => {
//         if (err.code === '25P03' || err.message.includes('terminated')) {
//             console.error('Database client connection lost (Idle timeout or unexpected termination).');
//         } else {
//             console.error('Unexpected error on active database client:', err.message);
//         }
//     });
// });

// // Connection acquisition tracking
// pool.on('acquire', (client) => {
//     console.log('Database client acquired from pool');
    
//     // Mark this client as being in use
//     client.__inUse = true;
//     client.__acquiredAt = new Date();
// });

// // Connection release tracking with improved error handling
// pool.on('release', (err, client) => {
//     if (err) {
//         console.error('Error releasing database client:', err);
//     } else {
//         console.log('Database client released back to pool');
//     }
    
//     // Clean up tracking flags
//     if (client) {
//         client.__inUse = false;
//         client.__acquiredAt = null;
//     }
// });

// pool.on('acquire', (client) => {
//     console.log('Database client acquired from pool');
// });

// pool.on('release', (err, client) => {
//     if (err) {
//         console.error('Error releasing database client:', err);
//     } else {
//         console.log('Database client released back to pool');
//     }
// });

// /**
//  * Executes a set of queries within a transaction block.
//  * Handles BEGIN, COMMIT, and ROLLBACK automatically.
//  * @param {Object} client - The pg client to use.
//  * @param {Function} callback - Async function containing queries.
//  */
// async function executeTransaction(client, callback) {
//     // Check if client is still valid before starting transaction
//     if (!client || !client.query) {
//         throw new Error('Invalid database client provided for transaction');
//     }
    
//     try {
//         // Check if connection is still alive before starting transaction
//         try {
//             await client.query('SELECT 1'); // Simple query to test connection
//         } catch (testError) {
//             throw new Error(`Database connection is not queryable: ${testError.message}`);
//         }
        
//         await client.query('BEGIN');
//         const result = await callback(client);
//         await client.query('COMMIT');
//         return result;
//     } catch (error) {
//         try {
//             // Only attempt rollback if the connection is still queryable
//             // Check connection state before attempting rollback
//             if (client && client.query && isClientQueryable(client)) {
//                 await client.query('ROLLBACK');
//             }
//         } catch (rollbackError) {
//             // Silence expected errors during rollback as the connection might be already dead
//             const errorMsg = rollbackError.message.toLowerCase();
//             if (!errorMsg.includes('not queryable') &&
//                 !errorMsg.includes('connection terminated') &&
//                 !errorMsg.includes('no transaction')) {
//                 console.error('Transaction rollback failed:', rollbackError.message);
//             }
//         }
//         throw error;
//     }
// }

// /**
//  * Check if a database client is still queryable
//  */
// function isClientQueryable(client) {
//     if (!client || !client.query) return false;
    
//     // Check for common signs of a dead connection
//     if (client.__connectionLost) return false;
//     if (client._ending) return false;
    
//     return true;
// }

// // Health check function
// async function healthCheck() {
//     const client = await pool.connect();
//     try {
//         const result = await client.query('SELECT NOW() as current_time, version() as db_version');
//         return {
//             status: 'healthy',
//             current_time: result.rows[0].current_time,
//             db_version: result.rows[0].db_version,
//             pool_stats: {
//                 totalCount: pool.totalCount,
//                 idleCount: pool.idleCount,
//                 waitingCount: pool.waitingCount
//             }
//         };
//     } finally {
//         client.release();
//     }
// }

// /**
//  * Middleware to acquire a connection from the pool and attach it to the request (req.dbClient).
//  * This ensures transaction safety and client release on completion.
//  * * Skips OPTIONS requests (CORS preflight) as they don't need database connections.
//  */
// const dbClientMiddleware = async (req, res, next) => {
//     if (req.method === 'OPTIONS') {
//         return next();
//     }
    
//     let client;
//     let released = false;
    
//     const releaseClient = async () => {
//         if (client && !released) {
//             released = true;
            
//             // Try to rollback any open transaction before releasing
//             try {
//                 // Defensive check: only attempt rollback if the connection is still alive and queryable
//                 if (isClientQueryable(client)) {
//                     await client.query('ROLLBACK');
//                 }
//             } catch (rollbackError) {
//                 const msg = rollbackError.message.toLowerCase();
//                 // Avoid logging if the connection is already gone
//                 if (!msg.includes('no transaction') &&
//                     !msg.includes('connection terminated') &&
//                     !msg.includes('not queryable') &&
//                     !msg.includes('closed')) {
//                     console.error('Warning: Failed to cleanup connection state:', rollbackError.message);
//                 }
//             }
            
//             // Mark connection as released and clean up
//             try {
//                 client.release();
//             } catch (releaseError) {
//                 console.error('Error releasing database client:', releaseError.message);
//             }
//         }
//     };
    
//     try {
//         client = await pool.connect();
        
//         // Ensure connection is clean
//         try {
//             await client.query('ROLLBACK');
//         } catch (rollbackError) {
//             if (!rollbackError.message.toLowerCase().includes('no transaction')) {
//                 console.warn('Warning: Connection had unexpected state:', rollbackError.message);
//             }
//         }
        
//         req.dbClient = client;
        
//         // Release the client when the response finishes
//         res.once('finish', () => {
//             releaseClient().catch(err => console.error('Error in finish cleanup:', err));
//         });
        
//         // Handle cases where the connection is closed prematurely
//         res.once('close', () => {
//             releaseClient().catch(err => console.error('Error in close cleanup:', err));
//         });
        
//         next();
//     } catch (err) {
//         console.error('Database connection failed in middleware:', err);
//         if (client) client.release();
//         return res.status(503).json({ error: 'Service Unavailable: Database connection failed.' });
//     }
// };

// module.exports = {
//     query: (text, params) => pool.query(text, params),
//     getClient: () => pool.connect(),
//     executeTransaction,
//     dbClientMiddleware,
//     healthCheck,
//     pool
// };
/**
 * ZOLID Database Transaction Utility
 * Strictly configured for Neon PostgreSQL (via DATABASE_URL)
 */
/**
 * ZOLID Database Connection (Neon PostgreSQL Optimized)
 * Robust configuration for Serverless/Cloud environments.
 */
/**
 * ZOLID Database Connection (Neon PostgreSQL Optimized)
 * Robust configuration for Serverless/Cloud environments.
 */
const { Pool } = require('pg');
require('dotenv').config();

// Get connection string from environment
const connectionString = process.env.DATABASE_URL;

// Validation
if (!connectionString) {
    console.error("❌ CRITICAL ERROR: DATABASE_URL is missing in .env");
    // Allow process to continue for testing mocks, but it will fail on connect
}

// Pool Configuration
const pool = new Pool({
    connectionString: connectionString,
    
    // SSL Configuration (Critical for Neon)
    ssl: {
        rejectUnauthorized: false // Required for many cloud connection poolers
    },

    // --- NEON / SERVERLESS OPTIMIZATIONS ---
    max: 10,                    // Max clients in the pool
    min: 0,                     // Allow pool to scale down to 0 when idle
    idleTimeoutMillis: 10000,   // Close idle clients after 10s
    connectionTimeoutMillis: 5000, // Give up if connection takes > 5s
    keepAlive: true,
    keepAliveInitialDelayMillis: 10000, 

    // Application Settings
    application_name: 'zolid-backend'
});

// --- Event Listeners & Error Handling ---

pool.on('error', (err) => {
    console.warn('⚠️  Database pool error (client removed):', err.message);
});

pool.on('connect', (client) => {
    client.on('error', (err) => {
        const msg = err.message || '';
        if (err.code === 'ETIMEDOUT' || err.code === 'ECONNRESET' || msg.includes('closed')) {
            console.warn('⚠️  Database connection lost (network/idle). Auto-reconnecting...');
        } else {
            console.error('❌ Unexpected database client error:', err);
        }
    });
});

// --- Transaction Utilities ---

async function executeTransaction(client, callback) {
    if (!client || !client.query) throw new Error('Invalid client');
    try {
        await client.query('BEGIN');
        const result = await callback(client);
        await client.query('COMMIT');
        return result;
    } catch (error) {
        try {
            await client.query('ROLLBACK');
        } catch (e) { /* ignore rollback error */ }
        throw error;
    }
}

async function healthCheck() {
    const client = await pool.connect();
    try {
        const result = await client.query('SELECT NOW() as current_time, version() as db_version');
        return {
            status: 'healthy',
            current_time: result.rows[0].current_time,
            db_version: result.rows[0].db_version
        };
    } finally {
        client.release();
    }
}

/**
 * Middleware to acquire a connection from the pool
 * FIX: Prevents double-release of the client
 */
const dbClientMiddleware = async (req, res, next) => {
    if (req.method === 'OPTIONS') return next();
    
    let client;
    try {
        client = await pool.connect();
        req.dbClient = client;
        
        // Safety mechanism: Ensure release is called exactly once
        let released = false;
        const safeRelease = () => {
            if (!released && client) {
                released = true;
                try {
                    client.release();
                } catch (e) {
                    console.error('Error releasing client:', e.message);
                }
            }
        };

        // Attach listeners to release the client when response ends
        res.on('finish', safeRelease);
        res.on('close', safeRelease);
        
        next();
    } catch (err) {
        console.error('❌ DB Middleware Error:', err.message);
        if (client) client.release(); // Immediate release on acquire fail
        return res.status(503).json({ error: 'Service Unavailable - Database Connection Failed' });
    }
};

module.exports = {
    query: (text, params) => pool.query(text, params),
    getClient: () => pool.connect(),
    executeTransaction,
    dbClientMiddleware,
    healthCheck,
    pool
};