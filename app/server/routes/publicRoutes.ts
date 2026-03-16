import express from 'express';
import KnowledgeItem from '../models/KnowledgeItem';

const router = express.Router();

// GET /api/public/brain/query
// A simple conversational or text-match query endpoint
router.get('/query', async (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q) {
      return res.status(400).json({ error: "Missing query parameter 'q'" });
    }

    const searchQuery = String(q);

    // Simple text search across title, content, summary, and tags
    const results = await KnowledgeItem.find({
      $or: [
        { title: { $regex: searchQuery, $options: 'i' } },
        { content: { $regex: searchQuery, $options: 'i' } },
        { summary: { $regex: searchQuery, $options: 'i' } },
        { tags: { $regex: searchQuery, $options: 'i' } }
      ]
    }).limit(10).sort({ createdAt: -1 });

    // Format for public consumption
    const formattedResults = results.map(item => ({
      id: item._id,
      title: item.title,
      summary: item.summary || item.content.substring(0, 150) + '...',
      url: item.url || item.fileUrl || null,
      tags: item.tags,
      type: item.type
    }));

    res.json({
      query: searchQuery,
      count: formattedResults.length,
      answers: formattedResults,
      sources: formattedResults.map(r => r.url).filter(Boolean)
    });

  } catch (error) {
    console.error("Public query error:", error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

export default router;
