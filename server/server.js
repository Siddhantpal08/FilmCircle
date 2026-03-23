require('dotenv').config({ path: '../.env' });
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');

const authRoutes = require('./routes/auth.routes');
const movieRoutes = require('./routes/movies.routes');
const reviewRoutes = require('./routes/reviews.routes');
const communityRoutes = require('./routes/community.routes');
const clubRoutes = require('./routes/clubs.routes');
const { errorHandler, notFound } = require('./middleware/errorMiddleware');

const app = express();

// ── Connect to MongoDB ────────────────────────────────────────────────────────
connectDB();

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173', credentials: true }));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// ── Routes ────────────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/movies', movieRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/community', communityRoutes);
app.use('/api/clubs', clubRoutes);

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'ok', time: new Date().toISOString() }));

// Basic Home Route for Backend
app.get('/', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>FilmCircle API</title>
            <style>
                :root { --bg: #0f0f13; --text: #e2e2e9; --accent: #7c5cfc; }
                body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; background-color: var(--bg); color: var(--text); display: flex; align-items: center; justify-content: center; height: 100vh; text-align: center; }
                .container { max-width: 600px; padding: 2rem; background: #161622; border-radius: 16px; box-shadow: 0 10px 30px rgba(0,0,0,0.5); border: 1px solid rgba(255,255,255,0.05); }
                h1 { margin: 0 0 1rem; color: #fff; font-size: 2.5rem; letter-spacing: -0.5px; }
                span { color: var(--accent); }
                p { font-size: 1.1rem; line-height: 1.6; margin: 0 0 1.5rem; color: #9a9cae; }
                .status { display: inline-flex; align-items: center; gap: 0.5rem; background: rgba(46, 204, 113, 0.1); color: #2ecc71; padding: 0.5rem 1rem; border-radius: 50px; font-weight: 600; font-size: 0.9rem; }
                .dot { width: 8px; height: 8px; background: #2ecc71; border-radius: 50%; box-shadow: 0 0 8px #2ecc71; animation: pulse 2s infinite; }
                @keyframes pulse { 0% { opacity: 0.5; transform: scale(0.8); } 50% { opacity: 1; transform: scale(1.2); } 100% { opacity: 0.5; transform: scale(0.8); } }
            </style>
        </head>
        <body>
            <div class="container">
                <h1>🎬 Film<span>Circle</span> API</h1>
                <p>The backend server is running successfully. This API powers the FilmCircle community platform.</p>
                <div class="status">
                    <div class="dot"></div>
                    System Online & Ready
                </div>
            </div>
        </body>
        </html>
    `);
});

// ── Error Handling ────────────────────────────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

// ── Start Server ──────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ FilmCircle server running on http://localhost:${PORT}`);
});

module.exports = app; // exported for testing
