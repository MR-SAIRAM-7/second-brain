import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import knowledgeRoutes from './routes/knowledge';
import authRoutes from './routes/auth';

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;
const isProd = process.env.NODE_ENV === 'production';

// Ensure we always have a JWT secret so local/dev does not crash. In production this must be set explicitly.
if (!process.env.JWT_SECRET && !isProd) {
    // Using a dev-only fallback avoids boot crashes while keeping a loud warning.
    process.env.JWT_SECRET = 'dev-insecure-jwt-secret-change-me';
    console.warn('[startup] JWT_SECRET not set; using insecure dev fallback. Set JWT_SECRET for production.');
}

const requiredEnv = ['MONGODB_URI', 'GEMINI_API_KEY', 'API_KEY', 'JWT_SECRET'];
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

app.use('/api/auth', authRoutes);

// Simple API key guard for public endpoints
app.use('/api/public/brain', (req, res, next) => {
    const apiKey = process.env.API_KEY;
    const jwtSecret = process.env.JWT_SECRET;

    const auth = req.headers.authorization || '';
    const provided = auth.startsWith('Bearer ') ? auth.slice(7) : auth;

    if (jwtSecret && provided) {
        try {
            const decoded = jwt.verify(provided, jwtSecret) as { sub?: string };
            if (decoded?.sub) {
                (req as any).userId = decoded.sub;
                return next();
            }
        } catch (error) {
            // Fall through and try API key
        }
    }

    if (apiKey && provided === apiKey) {
        (req as any).userId = 'public';
        return next();
    }

    if (!apiKey) {
        return res.status(500).json({ success: false, error: 'Server missing API key configuration' });
    }

    return res.status(401).json({ success: false, error: 'Unauthorized' });
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
