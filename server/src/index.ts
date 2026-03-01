import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import knowledgeRoutes from './routes/knowledge';

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

const requiredEnv = ['MONGODB_URI', 'GEMINI_API_KEY', 'API_KEY'];
requiredEnv.forEach((key) => {
    if (!process.env[key]) {
        console.warn(`[startup] Missing env var ${key}`);
    }
});

const corsOrigins = process.env.ALLOWED_ORIGINS?.split(',').map((o) => o.trim()).filter(Boolean) || ['http://localhost:5173'];

app.use(cors({
    origin: corsOrigins,
    credentials: false,
}));

app.use(express.json({ limit: '1mb' }));

// Simple API key guard for public endpoints
app.use('/api/public/brain', (req, res, next) => {
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
        return res.status(500).json({ success: false, error: 'Server missing API key configuration' });
    }

    const auth = req.headers.authorization || '';
    const provided = auth.startsWith('Bearer ') ? auth.slice(7) : auth;

    if (provided !== apiKey) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    next();
});

// Routes
app.use('/api/public/brain', knowledgeRoutes);

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
