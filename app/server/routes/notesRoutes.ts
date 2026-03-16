import express from 'express';
import KnowledgeItem from '../models/KnowledgeItem';
import { upload } from '../config/cloudinary';
import { processKnowledgeItemContent } from '../services/openaiService';

const router = express.Router();

// GET all notes with optional filtering
router.get('/', async (req, res) => {
  try {
    const { type, search, tags } = req.query;
    let query: any = {};

    if (type && type !== 'all') {
      query.type = type;
    }

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } }
      ];
    }

    if (tags) {
      const tagArray = (tags as string).split(',');
      query.tags = { $in: tagArray };
    }

    const notes = await KnowledgeItem.find(query).sort({ createdAt: -1 });
    res.json(notes);
  } catch (error) {
    console.error('Error fetching notes:', error);
    res.status(500).json({ error: 'Failed to fetch notes' });
  }
});

// POST a new note with optional file upload
router.post('/', upload.single('file'), async (req, res) => {
  try {
    const { title, content, type, url } = req.body;
    let fileUrl = '';

    if (req.file) {
      fileUrl = req.file.path; // Cloudinary URL
    }

    // Process content with OpenAI for summary and auto-tagging
    // We append the URL or file indication so the AI knows
    const contentToProcess = `${content}\n${url ? 'Source URL: ' + url : ''}\n${fileUrl ? 'Includes uploaded file' : ''}`;
    
    // We perform the AI processing asynchronously but wait for it so we can save it directly
    // In a very high traffic app, we might save first and update later via a worker cue.
    const aiResult = await processKnowledgeItemContent(contentToProcess);
    
    // Merge user tags with AI tags if the frontend sends them (assuming frontend sends them as comma-separated string)
    let finalTagsStr = req.body.tags || '';
    let finalTags = finalTagsStr ? finalTagsStr.split(',').map((t: string) => t.trim()) : [];
    
    // Add unique AI tags
    aiResult.tags.forEach((tag: string) => {
       if (!finalTags.includes(tag)) finalTags.push(tag);
    });

    const newItem = new KnowledgeItem({
      title,
      content,
      type,
      url,
      fileUrl,
      summary: aiResult.summary,
      tags: finalTags
    });

    const savedItem = await newItem.save();
    res.status(201).json(savedItem);

  } catch (error) {
    console.error('Error creating note:', error);
    res.status(500).json({ error: 'Failed to create note' });
  }
});

// GET a single note
router.get('/:id', async (req, res) => {
  try {
    const note = await KnowledgeItem.findById(req.params.id);
    if (!note) return res.status(404).json({ error: 'Note not found' });
    res.json(note);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch note' });
  }
});

// DELETE a note
router.delete('/:id', async (req, res) => {
  try {
    const note = await KnowledgeItem.findByIdAndDelete(req.params.id);
    if (!note) return res.status(404).json({ error: 'Note not found' });
    res.json({ message: 'Note deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete note' });
  }
});

export default router;
