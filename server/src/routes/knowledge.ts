import { Router } from 'express';
import { z } from 'zod';
import { ObjectId } from 'mongodb';
import { aiService } from '../services/ai.service';
import { getKnowledgeCollection, toItem } from '../services/db.service';

const router = Router();

const knowledgeTypes = ['note', 'article', 'insight', 'link', 'idea'] as const;

const createItemSchema = z.object({
    title: z.string().min(1),
    content: z.string().min(1),
    type: z.enum(knowledgeTypes).default('note'),
    tags: z.array(z.string()).optional(),
    sourceUrl: z.string().url().optional(),
});

const updateItemSchema = z.object({
    title: z.string().min(1).optional(),
    content: z.string().min(1).optional(),
    type: z.enum(knowledgeTypes).optional(),
    tags: z.array(z.string()).optional(),
    sourceUrl: z.string().url().optional(),
    summary: z.string().optional(),
});

const querySchema = z.object({
    q: z.string().min(1),
    limit: z.coerce.number().int().min(1).max(20).optional(),
});

const summarizeSchema = z.object({
    content: z.string().min(10),
    maxLength: z.coerce.number().int().min(50).max(800).optional(),
});

const withTimestamp = (payload: unknown) => ({
    success: true,
    data: payload,
    timestamp: new Date().toISOString(),
});

const parseId = (id: string) => {
    try {
        return new ObjectId(id);
    } catch {
        return null;
    }
};

// GET all items
router.get('/items', async (req, res) => {
    try {
        const col = await getKnowledgeCollection();
        const { type, tag, search } = req.query;
        const where: Record<string, unknown> = {};

        if (type && type !== 'all') {
            where.type = String(type);
        }

        if (tag) {
            where.tags = { $in: [String(tag).toLowerCase()] };
        }

        if (search) {
            const regex = new RegExp(String(search), 'i');
            where.$or = [{ title: regex }, { content: regex }, { tags: regex }];
        }

        const docs = await col.find(where).sort({ createdAt: -1 }).toArray();
        const items = docs.map(toItem);

        res.json(withTimestamp({ items, total: items.length }));
    } catch (error) {
        console.error('Error fetching items:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

// GET tags
router.get('/tags', async (_req, res) => {
    try {
        const col = await getKnowledgeCollection();
        const docs = await col.find({}, { projection: { tags: 1 } }).toArray();
        const allTags = new Set<string>();
        docs.forEach((item) => item.tags?.forEach((tag) => allTags.add(tag)));

        res.json(withTimestamp(Array.from(allTags).sort()));
    } catch (error) {
        console.error('Error fetching tags:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

// POST new item
router.post('/items', async (req, res) => {
    try {
        const col = await getKnowledgeCollection();
        const parsed = createItemSchema.safeParse(req.body);
        if (!parsed.success) {
            return res.status(400).json({ success: false, error: parsed.error.flatten() });
        }

        const { title, content, type, tags, sourceUrl } = parsed.data;

        let summary = '';
        if (content.length > 100) {
            summary = await aiService.summarize(content);
        }

        let finalTags = tags || [];
        if (finalTags.length === 0) {
            finalTags = await aiService.autoTag(content, title);
        }

        const wordCount = content.split(/\s+/).length;

        const now = new Date();
        const doc = {
            title,
            content,
            type,
            tags: finalTags.map((t) => t.toLowerCase()),
            sourceUrl,
            summary,
            createdAt: now,
            updatedAt: now,
            userId: 'user1',
            metadata: {
                wordCount,
                readingTime: Math.ceil(wordCount / 200),
                aiGenerated: false,
            },
        };

        const result = await col.insertOne(doc);
        const created = toItem({ ...doc, _id: result.insertedId });

        res.json(withTimestamp(created));
    } catch (error) {
        console.error('Error creating item:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

// Update item (partial)
router.put('/items/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const col = await getKnowledgeCollection();
        const parsed = updateItemSchema.safeParse(req.body);
        if (!parsed.success) {
            return res.status(400).json({ success: false, error: parsed.error.flatten() });
        }

        const data = parsed.data;
        if (data.tags) {
            data.tags = data.tags.map((t) => t.toLowerCase());
        }

        const oid = parseId(id);
        if (!oid) {
            return res.status(400).json({ success: false, error: 'Invalid id' });
        }

        const updateDoc = {
            ...data,
            updatedAt: new Date(),
        };

        const result = await col.findOneAndUpdate(
            { _id: oid },
            { $set: updateDoc },
            { returnDocument: 'after' }
        );

        if (!result.value) {
            return res.status(404).json({ success: false, error: 'Not found' });
        }

        const updated = toItem(result.value);

        res.json(withTimestamp(updated));
    } catch (error) {
        console.error('Error updating item:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

// DELETE item
router.delete('/items/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const col = await getKnowledgeCollection();
        const oid = parseId(id);
        if (!oid) {
            return res.status(400).json({ success: false, error: 'Invalid id' });
        }

        await col.deleteOne({ _id: oid });
        res.json(withTimestamp({ deleted: true }));
    } catch (error) {
        console.error('Error deleting item:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

const runQuery = async (q: string, limit: number) => {
    const col = await getKnowledgeCollection();
    const regex = new RegExp(q, 'i');
    const docs = await col
        .find({
            $or: [{ title: regex }, { content: regex }, { tags: regex }],
        })
        .limit(limit)
        .toArray();

    let contextItems = docs.map(toItem);

    if (contextItems.length === 0) {
        const fallback = await col.find({}).sort({ createdAt: -1 }).limit(limit).toArray();
        contextItems = fallback.map(toItem);
    }

    const aiResponse = await aiService.query(q, contextItems);

    return {
        answer: aiResponse.answer,
        sources: contextItems,
        confidence: aiResponse.confidence,
    };
};

// POST semantic query / RAG
router.post('/query', async (req, res) => {
    try {
        const parsed = querySchema.safeParse(req.body);
        if (!parsed.success) {
            return res.status(400).json({ success: false, error: parsed.error.flatten() });
        }

        const { q, limit = 5 } = parsed.data;
        const data = await runQuery(q, limit);

        res.json(withTimestamp(data));
    } catch (error) {
        console.error('Error querying brain (POST):', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

// GET semantic query (matches docs)
router.get('/query', async (req, res) => {
    try {
        const parsed = querySchema.safeParse({
            q: req.query.q,
            limit: req.query.limit,
        });
        if (!parsed.success) {
            return res.status(400).json({ success: false, error: parsed.error.flatten() });
        }

        const { q, limit = 5 } = parsed.data;
        const data = await runQuery(q, limit);

        res.json(withTimestamp(data));
    } catch (error) {
        console.error('Error querying brain (GET):', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

// Summarize standalone content
router.post('/summarize', async (req, res) => {
    try {
        const parsed = summarizeSchema.safeParse(req.body);
        if (!parsed.success) {
            return res.status(400).json({ success: false, error: parsed.error.flatten() });
        }

        const { content, maxLength = 400 } = parsed.data;
        const summary = await aiService.summarize(content.slice(0, maxLength * 4));
        res.json(withTimestamp({ summary }));
    } catch (error) {
        console.error('Error summarizing content:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

export default router;
