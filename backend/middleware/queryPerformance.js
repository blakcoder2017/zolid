// const { logger } = require('./logger');

// const queryPerformance = (req, res, next) => {
//     const start = Date.now();
    
//     // Ensure req.dbClient is available before patching
//     if (req.dbClient && req.dbClient.query) {
//         // Monkey patch pool.query to monitor performance
//         const originalQuery = req.dbClient.query;
//         req.dbClient.query = function(...args) {
//             const queryStart = Date.now();
//             return originalQuery.apply(this, args)
//                 .then((result) => {
//                     const queryDuration = Date.now() - queryStart;
                    
//                     // Log slow queries
//                     if (queryDuration > 1000) {
//                         logger.warn('Slow query detected', {
//                             request_id: req.request_id,
//                             query: args[0],
//                             duration_ms: queryDuration,
//                             timestamp: new Date().toISOString()
//                         });
//                     }
                    
//                     return result;
//                 })
//                 .catch((error) => {
//                     const queryDuration = Date.now() - queryStart;
                    
//                     logger.error('Query failed', {
//                         request_id: req.request_id,
//                         query: args[0],
//                         duration_ms: queryDuration,
//                         error: error.message,
//                         timestamp: new Date().toISOString()
//                     });
                    
//                     throw error;
//                 });
//         };
//     }
    
//     next();
// };

// module.exports = queryPerformance;

const { logger } = require('./logger');

// Define constants for better readability and maintainability.
const SLOW_QUERY_THRESHOLD_MS = 1000;
const LOG_FORMAT = {
    request_id: (req) => req.request_id,
    query: (args) => args[0],
    duration_ms: (queryDuration) => queryDuration,
    timestamp: (timestamp) => new Date(timestamp).toISOString(),
};

const queryPerformance = async (req, res, next) => {
    const start = Date.now();

    // Ensure req.dbClient is available before patching
    if (req.dbClient && req.dbClient.query) {
        const originalQuery = req.dbClient.query;

        // Monkey patch pool.query to monitor performance
        req.dbClient.query = async function(...args) {
            const queryStart = Date.now();
            try {
                const result = await originalQuery.apply(this, args);

                const queryDuration = Date.now() - queryStart;

                // Log slow queries
                if (queryDuration > SLOW_QUERY_THRESHOLD_MS) {
                    logger.warn('Slow query detected', {
                        ...LOG_FORMAT,
                        request_id: req.request_id,
                        query: args[0],
                        duration_ms: queryDuration,
                        timestamp: Date.now(),
                    });
                }

                return result;
            } catch (error) {
                const queryDuration = Date.now() - queryStart;

                logger.error('Query failed', {
                    ...LOG_FORMAT,
                    request_id: req.request_id,
                    query: args[0],
                    duration_ms: queryDuration,
                    error: error.message,
                    timestamp: Date.now(),
                });

                throw error;
            }
        };
    }

    next();
};

module.exports = queryPerformance;
