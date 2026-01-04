// const express = require('express');
// const { v4: uuidv4 } = require('uuid');
// const helmet = require('helmet');
// const cors = require('cors');
// const rateLimit = require('express-rate-limit');
// const path = require('path');
// const fs = require('fs');
// require('dotenv').config();

// const db = require('./db/db');
// const jobRoutes = require('./routes/jobRoutes');
// const identityRoutes = require('./routes/identityRoutes');
// const profileRoutes = require('./routes/profileRoutes');
// const financeRoutes = require('./routes/financeRoutes');
// const uploadRoutes = require('./routes/uploadRoutes');
// const benefitsRoutes = require('./routes/benefitsRoutes');
// const contactRoutes = require('./routes/contactRoutes');
// const disputeRoutes = require('./routes/disputeRoutes');
// const adminRoutes = require('./routes/adminRoutes');
// const dashboardRoutes = require('./routes/dashboardRoutes');

// const { initializeMomoCodes } = require('./services/identityService');
// const configService = require('./services/configService');
// const globalErrorHandler = require('./middleware/errorController');
// const { requestLogger } = require('./middleware/logger');
// const queryPerformance = require('./middleware/queryPerformance');
// const batchRemittanceScheduler = require('./services/batchRemittanceScheduler');
// const jobExpiryService = require('./services/jobExpiryService');

// require('./workers');

// const app = express();
// const PORT = process.env.PORT || 8000;
// const API_V1 = '/api/v1';

// /* ======================================================
//    ✅ CORS — MUST BE FIRST (before helmet, rate-limit, db)
// ====================================================== */

// const allowedOrigins =
//   process.env.ALLOWED_ORIGINS?.split(',').map(o => o.trim()) || [
//     'http://localhost:3000',
//     'http://localhost:3001',
//     'http://localhost:3002',
//     'http://localhost:3003',
//   ];
// app.use('/uploads', express.static(path.join(__dirname, 'uploads')));


// app.use(cors({
//   origin: (origin, callback) => {
//     if (!origin) return callback(null, true); // Postman, curl

//     const isDev =
//       process.env.NODE_ENV === 'development' ||
//       process.env.ENVIRONMENT === 'development';

//     if (isDev && origin.startsWith('http://localhost:')) {
//       return callback(null, true);
//     }

//     if (allowedOrigins.includes(origin)) {
//       return callback(null, true);
//     }

//     return callback(new Error(`CORS blocked: ${origin}`));
//   },
//   credentials: true,
//   methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
//   allowedHeaders: [
//     'Content-Type',
//     'Authorization',
//     'X-Request-ID',
//     'X-Temp-Token',
//   ],
// }));

// // 🔴 CRITICAL: allow all preflight requests
// app.options('*', cors());

// /* ======================================================
//    🔐 SECURITY HEADERS (Helmet)
// ====================================================== */

// app.use(helmet({
//   contentSecurityPolicy: {
//     directives: {
//       defaultSrc: ["'self'"],
//       styleSrc: ["'self'", "'unsafe-inline'"],
//       scriptSrc: ["'self'"],
//       imgSrc: ["'self'", "data:", "https:", "http://localhost:8000"],
//       connectSrc: [
//         "'self'",
//         "http://localhost:8000",
//         "http://127.0.0.1:8000"
//       ],
//       fontSrc: ["'self'"],
//       objectSrc: ["'none'"],
//       mediaSrc: ["'self'"],
//       frameSrc: ["'none'"],
//     },
//   },
//   crossOriginEmbedderPolicy: false,
//   crossOriginResourcePolicy: { policy: "cross-origin" },
// }));

// /* ======================================================
//    🚦 RATE LIMITING (after CORS)
// ====================================================== */

// const isDevelopment =
//   process.env.NODE_ENV === 'development' ||
//   process.env.ENVIRONMENT === 'development';

// const limiter = rateLimit({
//   windowMs: 15 * 60 * 1000,
//   max: isDevelopment ? 10000 : 100,
//   standardHeaders: true,
//   legacyHeaders: false,
// });

// app.use('/api', limiter);

// /* ======================================================
//    🧠 CORE MIDDLEWARE
// ====================================================== */

// app.use(express.json());
// app.use(requestLogger);

// app.use((req, res, next) => {
//   req.request_id = uuidv4();
//   res.setHeader('X-Request-ID', req.request_id);
//   next();
// });

// /* ======================================================
//    📂 UPLOADS (CORS-SAFE)
// ====================================================== */

// app.use('/uploads', (req, res, next) => {
//   res.setHeader(
//     'Access-Control-Allow-Origin',
//     req.headers.origin || 'http://localhost:3003'
//   );
//   res.setHeader('Access-Control-Allow-Credentials', 'true');
//   res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS, HEAD');
//   res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

//   if (req.method === 'OPTIONS') return res.status(204).end();

//   const filePath = path.join(__dirname, 'uploads', req.path);
//   const normalized = path.normalize(filePath);
//   const uploadsDir = path.join(__dirname, 'uploads');

//   if (!normalized.startsWith(uploadsDir)) {
//     return res.status(403).json({ error: 'Access denied' });
//   }

//   if (!fs.existsSync(filePath)) {
//     return res.status(404).json({ error: 'File not found' });
//   }

//   return res.sendFile(filePath);
// });

// /* ======================================================
//    🚀 SERVER STARTUP
// ====================================================== */

// async function startServer() {
//   await initializeMomoCodes();
//   await configService.loadFinancialConfig();

//   /* -------- Health -------- */
//   app.get('/health', async (req, res) => {
//     let dbStatus = 'disconnected';
//     try {
//       const client = await db.getClient();
//       await client.query('SELECT 1');
//       client.release();
//       dbStatus = 'connected';
//     } catch {}
//     res.json({ status: 'healthy', db_status: dbStatus });
//   });

//   app.get('/', (req, res) => {
//     res.json({ message: 'Welcome to ZOLID Systems API' });
//   });

//   /* -------- DB & Performance -------- */
//   app.use(db.dbClientMiddleware);
//   app.use(queryPerformance);

//   /* -------- Routes -------- */
//   app.use(`${API_V1}/identity`, identityRoutes);
//   app.use(`${API_V1}/jobs`, jobRoutes);
//   app.use(`${API_V1}/profile`, profileRoutes);
//   app.use(`${API_V1}/finance`, financeRoutes);
//   app.use(`${API_V1}/upload`, uploadRoutes);
//   app.use(`${API_V1}/benefits`, benefitsRoutes);
//   app.use(`${API_V1}/contact`, contactRoutes);
//   app.use(`${API_V1}/disputes`, disputeRoutes);
//   app.use(`${API_V1}/admin`, adminRoutes);
//   app.use(`${API_V1}/dashboard`, dashboardRoutes);

//   /* -------- Errors -------- */
//   app.all('*', (req, res, next) => {
//     const AppError = require('./utils/appError');
//     next(new AppError(`Cannot find ${req.originalUrl}`, 404));
//   });

//   app.use(globalErrorHandler);

//   app.listen(PORT, () => {
//     console.log(`🚀 API running on http://localhost:${PORT}`);
//     batchRemittanceScheduler.startScheduler();

//     setInterval(() => {
//       jobExpiryService.runExpiryChecks().catch(() => {});
//     }, 6 * 60 * 60 * 1000);

//     jobExpiryService.runExpiryChecks().catch(() => {});
//   });
// }

// startServer();
const express = require('express');
const { v4: uuidv4 } = require('uuid');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const db = require('./db/db');
const jobRoutes = require('./routes/jobRoutes');
const identityRoutes = require('./routes/identityRoutes');
const profileRoutes = require('./routes/profileRoutes');
const financeRoutes = require('./routes/financeRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
const benefitsRoutes = require('./routes/benefitsRoutes');
const contactRoutes = require('./routes/contactRoutes');
const disputeRoutes = require('./routes/disputeRoutes');
const adminRoutes = require('./routes/adminRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');

const { initializeMomoCodes } = require('./services/identityService');
const configService = require('./services/configService');
const globalErrorHandler = require('./middleware/errorController');
const { requestLogger } = require('./middleware/logger');
const queryPerformance = require('./middleware/queryPerformance');
const batchRemittanceScheduler = require('./services/batchRemittanceScheduler');
const jobExpiryService = require('./services/jobExpiryService');

// ⚠️ WORKERS: Commented out for Vercel deployment (Redis not supported in serverless functions)
// require('./workers'); 

const app = express();
const PORT = process.env.PORT || 8000;
const API_V1 = '/api/v1';

/* ======================================================
   ✅ CORS — MUST BE FIRST
====================================================== */

const allowedOrigins =
  process.env.ALLOWED_ORIGINS?.split(',').map(o => o.trim()) || [
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:3002',
    'http://localhost:3003',
    'https://zolid.online',
    'https://www.zolid.online',
    'https://app.zolid.online',
    'https://www.app.zolid.online',
    'https://api.zolid.online',
    'https://www.api.zolid.online',
    'https://admin.zolid.online',
    'https://www.admin.zolid.online',
    'https://pro.zolid.online',
    'https://www.pro.zolid.online',
  ];

// 📂 STORAGE CONFIGURATION
// Vercel only allows writing to /tmp. We use this for temporary processing if needed.
const isVercel = process.env.IS_VERCEL === 'true';
const uploadsPath = isVercel ? '/tmp/uploads' : path.join(__dirname, 'uploads');

// Ensure directory exists to prevent ENOENT crashes
if (!fs.existsSync(uploadsPath)) {
    try {
        fs.mkdirSync(uploadsPath, { recursive: true });
    } catch (e) {
        console.error("⚠️ Could not create uploads directory:", e.message);
    }
}

// Serve static files from the determined path
app.use('/uploads', express.static(uploadsPath));

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true); // Allow non-browser requests (Postman, etc.)
    if (allowedOrigins.includes(origin)) return callback(null, true);
    
    // Optional: Log blocked origin for debugging
    // console.log(`Blocked Origin: ${origin}`);
    return callback(new Error(`CORS blocked: ${origin}`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID', 'X-Temp-Token'],
}));

// 🔴 CRITICAL: allow all preflight requests
app.options('*', cors());

/* ======================================================
   🔐 SECURITY HEADERS (Helmet)
====================================================== */

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:", "http://localhost:8000", "https://storage.googleapis.com"],
      connectSrc: [
        "'self'",
        "http://localhost:8000",
        "https://api.paystack.co",
        ...allowedOrigins 
      ],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: "cross-origin" },
}));

/* ======================================================
   🚦 RATE LIMITING (after CORS)
====================================================== */

const isDevelopment =
  process.env.NODE_ENV === 'development' ||
  process.env.ENVIRONMENT === 'development';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isDevelopment ? 10000 : 100,
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api', limiter);

/* ======================================================
   🧠 CORE MIDDLEWARE
====================================================== */

app.use(express.json());
app.use(requestLogger);

app.use((req, res, next) => {
  req.request_id = uuidv4();
  res.setHeader('X-Request-ID', req.request_id);
  next();
});

/* ======================================================
   📂 MANUAL UPLOADS HANDLER (CORS-SAFE)
   For serving local files with specific headers
====================================================== */

app.use('/uploads', (req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS, HEAD');
  
  if (req.method === 'OPTIONS') return res.status(204).end();

  const filePath = path.join(uploadsPath, req.path);
  const normalized = path.normalize(filePath);

  // Security check: Prevent directory traversal
  if (!normalized.startsWith(uploadsPath)) {
    return res.status(403).json({ error: 'Access denied' });
  }

  if (!fs.existsSync(filePath)) {
    // If not found locally, 404. (Production uses Firebase URLs directly)
    return res.status(404).json({ error: 'File not found' });
  }

  return res.sendFile(filePath);
});

/* ======================================================
   🚀 SERVER STARTUP
====================================================== */

// Function to initialize services robustly
async function initializeApp() {
  try {
      if (process.env.DATABASE_URL) {
          // Initialize financial config but catch errors to prevent crash
          await configService.loadFinancialConfig().catch(e => console.error("⚠️ Config Load Error:", e.message));
          
          // MoMo codes might fail if DB is cold, handled internally
          await initializeMomoCodes().catch(() => {});
      }
      
      // Start schedulers only if NOT in Vercel
      if (process.env.IS_VERCEL !== 'true') {
          console.log("⏰ Starting background schedulers...");
          batchRemittanceScheduler.startScheduler();
          setInterval(() => {
            jobExpiryService.runExpiryChecks().catch(() => {});
          }, 6 * 60 * 60 * 1000);
          jobExpiryService.runExpiryChecks().catch(() => {});
      }
  } catch (error) {
      console.error("⚠️ Non-Fatal Initialization Error:", error.message);
  }
}

// Routes and Middleware Setup
app.get('/health', async (req, res) => {
    let dbStatus = 'disconnected';
    try {
      const client = await db.getClient();
      await client.query('SELECT 1');
      client.release();
      dbStatus = 'connected';
    } catch (e) {
        // console.error("Health Check DB Error:", e.message);
    }
    res.json({ status: 'healthy', db_status: dbStatus, env: process.env.NODE_ENV });
});

app.get('/', (req, res) => { res.json({ message: 'Welcome to ZOLID Systems API' }); });

app.use(db.dbClientMiddleware);
app.use(queryPerformance);

app.use(`${API_V1}/identity`, identityRoutes);
app.use(`${API_V1}/jobs`, jobRoutes);
app.use(`${API_V1}/profile`, profileRoutes);
app.use(`${API_V1}/finance`, financeRoutes);
app.use(`${API_V1}/upload`, uploadRoutes);
app.use(`${API_V1}/benefits`, benefitsRoutes);
app.use(`${API_V1}/contact`, contactRoutes);
app.use(`${API_V1}/disputes`, disputeRoutes);
app.use(`${API_V1}/admin`, adminRoutes);
app.use(`${API_V1}/dashboard`, dashboardRoutes);

app.all('*', (req, res, next) => {
  const AppError = require('./utils/appError');
  next(new AppError(`Cannot find ${req.originalUrl}`, 404));
});

app.use(globalErrorHandler);

// Initialize app data (Async, non-blocking)
initializeApp();

// Export for Vercel
module.exports = app;

// Only listen if running locally (not imported)
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`🚀 API running on http://localhost:${PORT}`);
  });
}