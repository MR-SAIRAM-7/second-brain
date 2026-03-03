import { Router } from 'express';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { ObjectId } from 'mongodb';
import { getUsersCollection, toUser } from '../services/db.service';

const router = Router();

const registerSchema = z.object({
    email: z.string().email(),
    password: z.string().min(8).max(128),
    name: z.string().min(1).max(80),
});

const loginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(1),
});

const withTimestamp = (payload: unknown) => ({
    success: true,
    data: payload,
    timestamp: new Date().toISOString(),
});

const getJwtSecret = () => {
    const secret = process.env.JWT_SECRET;
    if (!secret) throw new Error('JWT_SECRET is not configured');
    return secret;
};

const buildToken = (userId: string) => {
    const secret = getJwtSecret();
    return jwt.sign({ sub: userId }, secret, { expiresIn: '7d' });
};

const parseBearer = (authHeader?: string) => {
    if (!authHeader) return '';
    return authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader;
};

router.post('/register', async (req, res) => {
    try {
        const parsed = registerSchema.safeParse(req.body);
        if (!parsed.success) {
            return res.status(400).json({ success: false, error: parsed.error.flatten() });
        }

        const { email, password, name } = parsed.data;
        const col = await getUsersCollection();
        const normalizedEmail = email.toLowerCase();
        const existing = await col.findOne({ email: normalizedEmail });
        if (existing) {
            return res.status(409).json({ success: false, error: 'Email already registered' });
        }

        const passwordHash = await bcrypt.hash(password, 10);
        const now = new Date();
        const doc = {
            email: normalizedEmail,
            passwordHash,
            name,
            createdAt: now,
            updatedAt: now,
            preferences: {
                theme: 'dark' as const,
                autoSummarize: true,
                defaultTags: [] as string[],
            },
        };

        const result = await col.insertOne(doc);
        const user = toUser({ ...doc, _id: result.insertedId });
        const token = buildToken(user.id);

        res.json(withTimestamp({ token, user }));
    } catch (error) {
        console.error('Error registering user:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

router.post('/login', async (req, res) => {
    try {
        const parsed = loginSchema.safeParse(req.body);
        if (!parsed.success) {
            return res.status(400).json({ success: false, error: parsed.error.flatten() });
        }

        const { email, password } = parsed.data;
        const col = await getUsersCollection();
        const normalizedEmail = email.toLowerCase();
        const user = await col.findOne({ email: normalizedEmail });
        if (!user) {
            return res.status(401).json({ success: false, error: 'Invalid credentials' });
        }

        const isValid = user.passwordHash ? await bcrypt.compare(password, user.passwordHash) : false;
        if (!isValid) {
            return res.status(401).json({ success: false, error: 'Invalid credentials' });
        }

        const token = buildToken(user._id?.toString() || '');
        res.json(withTimestamp({ token, user: toUser(user) }));
    } catch (error) {
        console.error('Error logging in:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

router.get('/me', async (req, res) => {
    try {
        const token = parseBearer(req.headers.authorization);
        if (!token) {
            return res.status(401).json({ success: false, error: 'Unauthorized' });
        }

        const secret = getJwtSecret();
        let decoded: { sub?: string } | null = null;
        try {
            decoded = jwt.verify(token, secret) as { sub?: string };
        } catch (err) {
            return res.status(401).json({ success: false, error: 'Unauthorized' });
        }

        if (!decoded?.sub) {
            return res.status(401).json({ success: false, error: 'Unauthorized' });
        }

        const col = await getUsersCollection();
        const user = await col.findOne({ _id: new ObjectId(decoded.sub) });
        if (!user) {
            return res.status(404).json({ success: false, error: 'User not found' });
        }

        res.json(withTimestamp({ user: toUser(user) }));
    } catch (error) {
        console.error('Error fetching current user:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

export default router;
