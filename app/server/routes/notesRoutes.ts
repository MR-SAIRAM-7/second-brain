import express from 'express';
import KnowledgeItem from '../models/KnowledgeItem';
import { upload } from '../config/cloudinary';
import { answerKnowledgeQuery, processKnowledgeItemContent } from '../services/openaiService';
import { extractTextFromUploadedFile, normalizeUploadedFileUrl } from '../services/documentTextService';
import { buildCloudinaryDeliveryUrl, buildCloudinaryFetchCandidates } from '../services/fileDeliveryService';

const router = express.Router();

const getPlainText = (value: string): string => value.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();

const withResolvedFileUrl = (item: any) => {
  const plain = typeof item?.toObject === 'function' ? item.toObject() : item;
  if (!plain) return plain;

  if (plain.fileUrl || plain.filePublicId) {
    plain.fileUrl = buildCloudinaryDeliveryUrl(plain);
  }

  return plain;
};

const toPublicSource = (item: any) => {
  const resolved = withResolvedFileUrl(item);
  return {
    id: String(resolved._id || resolved.id || ''),
    title: resolved.title,
    summary: resolved.summary || '',
    url: resolved.url || resolved.fileUrl || null,
    fileUrl: resolved.fileUrl || null,
    tags: resolved.tags || [],
    type: resolved.type,
  };
};

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
        { content: { $regex: search, $options: 'i' } },
        { summary: { $regex: search, $options: 'i' } },
        { extractedText: { $regex: search, $options: 'i' } },
      ];
    }

    if (tags) {
      const tagArray = (tags as string).split(',');
      query.tags = { $in: tagArray };
    }

    const notes = await KnowledgeItem.find(query).sort({ createdAt: -1 }).select('-extractedText');
    res.json(notes.map(withResolvedFileUrl));
  } catch (error) {
    console.error('Error fetching notes:', error);
    res.status(500).json({ error: 'Failed to fetch notes' });
  }
});

// POST a new note with optional file upload
router.post('/', upload.single('file'), async (req, res) => {
  try {
    const title = String(req.body.title || '').trim();
    const content = String(req.body.content || '');
    const incomingType = String(req.body.type || 'note').toLowerCase();
    const normalizedType = incomingType === 'document' ? 'article' : incomingType;
    const url = req.body.sourceUrl || req.body.url;

    const allowedTypes = new Set(['note', 'link', 'insight', 'article', 'idea']);

    if (!allowedTypes.has(normalizedType)) {
      return res.status(400).json({ error: `Invalid type: ${incomingType}` });
    }

    const uploadedFile = req.file as
      | (Express.Multer.File & {
          filename?: string;
          secure_url?: string;
          resource_type?: string;
          format?: string;
        })
      | undefined;

    let fileUrl = '';
    let filePublicId = '';
    let fileMimeType = '';
    let fileFormat = '';
    let fileResourceType = '';
    let extractedText = '';

    if (uploadedFile) {
      fileUrl = normalizeUploadedFileUrl(uploadedFile);
      filePublicId = String(uploadedFile.filename || '').trim();
      fileMimeType = String(uploadedFile.mimetype || '').trim();
      fileFormat = String(uploadedFile.format || '').trim();
      fileResourceType = String(uploadedFile.resource_type || '').trim() || (fileMimeType.includes('pdf') ? 'raw' : 'auto');
      fileUrl = buildCloudinaryDeliveryUrl({
        fileUrl,
        filePublicId,
        fileMimeType,
        fileFormat,
        fileResourceType,
      });
      extractedText = await extractTextFromUploadedFile(uploadedFile);
    }

    const hasMeaningfulContent = getPlainText(content).length > 0;
    if (!title || (!hasMeaningfulContent && !extractedText)) {
      return res.status(400).json({ error: 'A title and either note content or an extractable document are required' });
    }

    const storedContent = hasMeaningfulContent
      ? content
      : '<p>Document uploaded. Content extracted for search and AI answers.</p>';

    // Process content with OpenAI for summary and auto-tagging
    // We append the URL or file indication so the AI knows
    const extractedSnippet = extractedText ? `\nExtracted document text:\n${extractedText.slice(0, 6000)}` : '';
    const contentToProcess = `${storedContent}\n${url ? 'Source URL: ' + url : ''}\n${fileUrl ? 'Uploaded file URL: ' + fileUrl : ''}${extractedSnippet}`;
    
    // We perform the AI processing asynchronously but wait for it so we can save it directly
    // In a very high traffic app, we might save first and update later via a worker cue.
    const aiResult = await processKnowledgeItemContent(contentToProcess);
    
    // Merge user tags with AI tags if the frontend sends them (assuming frontend sends them as comma-separated string)
    const rawTags = req.body.tags;
    let finalTags: string[] = [];

    if (Array.isArray(rawTags)) {
      finalTags = rawTags.map((t) => String(t).trim()).filter(Boolean);
    } else if (typeof rawTags === 'string' && rawTags.trim()) {
      finalTags = rawTags.split(',').map((t: string) => t.trim()).filter(Boolean);
    }
    
    // Add unique AI tags
    aiResult.tags.forEach((tag: string) => {
       if (!finalTags.includes(tag)) finalTags.push(tag);
    });

    const newItem = new KnowledgeItem({
      title,
      content: storedContent,
      type: normalizedType,
      url,
      fileUrl,
      filePublicId,
      fileMimeType,
      fileFormat,
      fileResourceType,
      extractedText,
      summary: aiResult.summary,
      tags: finalTags
    });

    const savedItem = await newItem.save();
    res.status(201).json(withResolvedFileUrl(savedItem));

  } catch (error) {
    console.error('Error creating note:', error);
    res.status(500).json({ error: 'Failed to create note' });
  }
});

// GET a single note
router.get('/:id', async (req, res) => {
  try {
    const note = await KnowledgeItem.findById(req.params.id).select('-extractedText');
    if (!note) return res.status(404).json({ error: 'Note not found' });
    res.json(withResolvedFileUrl(note));
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch note' });
  }
});

// POST a note-specific AI query
router.post('/:id/query', async (req, res) => {
  try {
    const question = String(req.body?.question || req.body?.q || '').trim();
    if (!question) {
      return res.status(400).json({ error: 'Question is required' });
    }

    const note = await KnowledgeItem.findById(req.params.id);
    if (!note) {
      return res.status(404).json({ error: 'Note not found' });
    }

    const resolved = withResolvedFileUrl(note);
    const aiResult = await answerKnowledgeQuery(question, [
      {
        id: String(resolved._id),
        title: resolved.title,
        content: resolved.content,
        extractedText: resolved.extractedText,
        summary: resolved.summary,
        tags: resolved.tags,
        createdAt: resolved.createdAt,
        url: resolved.url,
        fileUrl: resolved.fileUrl,
      },
    ]);

    res.json({
      success: true,
      data: {
        noteId: String(resolved._id),
        query: question,
        answer: aiResult.answer,
        confidence: aiResult.confidence,
        sources: [toPublicSource(resolved)],
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error answering note-specific query:', error);
    res.status(500).json({ error: 'Failed to answer note query' });
  }
});

// GET attachment stream for reliable in-app preview
router.get('/:id/attachment', async (req, res) => {
  try {
    const note = await KnowledgeItem.findById(req.params.id);
    if (!note) {
      return res.status(404).json({ error: 'Note not found' });
    }

    if (!note.fileUrl && !note.filePublicId) {
      return res.status(404).json({ error: 'No attachment found for this note' });
    }

    const fetchCandidates = buildCloudinaryFetchCandidates({
      fileUrl: note.fileUrl,
      filePublicId: note.filePublicId,
      fileMimeType: note.fileMimeType,
      fileFormat: note.fileFormat,
      fileResourceType: note.fileResourceType,
    });

    let upstreamResponse: Response | null = null;
    for (const candidate of fetchCandidates) {
      try {
        const current = await fetch(candidate);
        if (current.ok) {
          upstreamResponse = current;
          break;
        }
      } catch {
        // Continue to next candidate URL.
      }
    }

    if (!upstreamResponse || !upstreamResponse.ok) {
      return res.status(502).json({ error: 'Unable to retrieve file from Cloudinary' });
    }

    const data = Buffer.from(await upstreamResponse.arrayBuffer());
    const resolvedMimeType = String(note.fileMimeType || '').trim() || upstreamResponse.headers.get('content-type') || 'application/octet-stream';
    const filename = String(note.title || 'attachment').trim().replace(/[^a-zA-Z0-9._-]+/g, '_') || 'attachment';

    res.setHeader('Content-Type', resolvedMimeType.includes('pdf') ? 'application/pdf' : resolvedMimeType);
    res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
    res.send(data);
  } catch (error) {
    console.error('Error streaming attachment:', error);
    res.status(500).json({ error: 'Failed to stream attachment' });
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
