"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const db_service_1 = require("../services/db.service");
const ai_service_1 = require("../services/ai.service");
const router = (0, express_1.Router)();
// GET all items
router.get('/items', async (req, res) => {
    try {
        const { type, tag, search } = req.query;
        let where = {};
        if (type && type !== 'all') {
            where.type = String(type);
        }
        // For arrays, Prisma has `has` or string filtering
        if (tag) {
            where.tags = {
                has: String(tag)
            };
        }
        if (search) {
            where.OR = [
                { title: { contains: String(search), mode: 'insensitive' } },
                { content: { contains: String(search), mode: 'insensitive' } }
            ];
        }
        const items = await db_service_1.prisma.knowledgeItem.findMany({
            where,
            orderBy: { createdAt: 'desc' }
        });
        res.json({ success: true, data: { items, total: items.length } });
    }
    catch (error) {
        console.error('Error fetching items:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});
// GET tags
router.get('/tags', async (req, res) => {
    try {
        const items = await db_service_1.prisma.knowledgeItem.findMany({
            select: { tags: true }
        });
        const allTags = new Set();
        items.forEach((item) => item.tags.forEach((tag) => allTags.add(tag)));
        res.json({ success: true, data: Array.from(allTags).sort() });
    }
    catch (error) {
        console.error('Error fetching tags:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});
// POST new item
router.post('/items', async (req, res) => {
    try {
        const { title, content, type, tags, sourceUrl } = req.body;
        // Attempt auto-summarize
        let summary = '';
        if (content.length > 100) {
            summary = await ai_service_1.aiService.summarize(content);
        }
        // Attempt auto-tag if none provided
        let finalTags = tags || [];
        if (finalTags.length === 0) {
            finalTags = await ai_service_1.aiService.autoTag(content, title);
        }
        const item = await db_service_1.prisma.knowledgeItem.create({
            data: {
                title,
                content,
                type: type || 'note',
                tags: finalTags,
                sourceUrl,
                summary,
                metadata: {
                    wordCount: content.split(/\s+/).length,
                    readingTime: Math.ceil(content.split(/\s+/).length / 200),
                    aiGenerated: false
                }
            }
        });
        res.json({ success: true, data: item });
    }
    catch (error) {
        console.error('Error creating item:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});
// DELETE item
router.delete('/items/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await db_service_1.prisma.knowledgeItem.delete({
            where: { id }
        });
        res.json({ success: true });
    }
    catch (error) {
        console.error('Error deleting item:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});
// POST semantic query / RAG
router.post('/query', async (req, res) => {
    try {
        const { q, limit = 5 } = req.body;
        // For now, doing a naive text search to get context items.
        // In a fully vector-enabled environment, this would use pgvector.
        const contextItems = await db_service_1.prisma.knowledgeItem.findMany({
            where: {
                OR: [
                    { title: { contains: q, mode: 'insensitive' } },
                    { content: { contains: q, mode: 'insensitive' } },
                    { tags: { has: q.toLowerCase() } }
                ]
            },
            take: Number(limit) || 5
        });
        if (contextItems.length === 0) {
            // If naive search yields nothing, just try the first 5 notes as a fallback context
            const fallback = await db_service_1.prisma.knowledgeItem.findMany({
                take: 5,
                orderBy: { createdAt: 'desc' }
            });
            contextItems.push(...fallback);
        }
        const aiResponse = await ai_service_1.aiService.query(q, contextItems);
        res.json({
            success: true,
            data: {
                answer: aiResponse.answer,
                sources: contextItems,
                confidence: aiResponse.confidence
            }
        });
    }
    catch (error) {
        console.error('Error querying brain:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});
exports.default = router;
