import express from 'express';
import KnowledgeItem from '../models/KnowledgeItem';
import { answerKnowledgeQuery, summarizeFreeformContent } from '../services/openaiService';

const router = express.Router();

const PUBLIC_API_KEY = (process.env.PUBLIC_API_KEY || '').trim();

const requirePublicApiKey = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (!PUBLIC_API_KEY) {
    next();
    return;
  }

  const authHeader = req.headers.authorization || '';
  const bearer = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';

  if (bearer !== PUBLIC_API_KEY) {
    res.status(401).json({
      success: false,
      error: 'Unauthorized: missing or invalid API key',
      timestamp: new Date().toISOString(),
    });
    return;
  }

  next();
};

router.use(requirePublicApiKey);

const sanitizeForPublic = (item: any) => ({
  id: String(item._id),
  title: item.title,
  summary: item.summary || item.content.substring(0, 180) + '...',
  contentPreview: item.content.substring(0, 320),
  url: item.url || item.fileUrl || null,
  tags: item.tags || [],
  type: item.type,
  createdAt: item.createdAt,
});

const SEARCH_STOP_WORDS = new Set([
  'a',
  'an',
  'the',
  'is',
  'are',
  'was',
  'were',
  'what',
  'when',
  'where',
  'who',
  'why',
  'how',
  'of',
  'to',
  'for',
  'in',
  'on',
  'at',
  'and',
  'or',
  'about',
  'my',
  'me',
  'your',
  'our',
  'their',
  'with',
  'from',
  'by',
  'it',
  'this',
  'that',
  'these',
  'those',
]);

const escapeRegex = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const extractSearchTokens = (query: string): string[] => {
  const rawTokens = query
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .map((token) => token.trim())
    .filter(Boolean);

  const uniqueTokens: string[] = [];
  for (const token of rawTokens) {
    if (token.length < 3 || SEARCH_STOP_WORDS.has(token)) continue;
    if (uniqueTokens.includes(token)) continue;
    uniqueTokens.push(token);
    if (uniqueTokens.length >= 8) break;
  }

  return uniqueTokens;
};

const getRelevanceScore = (item: any, originalQuery: string, tokens: string[]): number => {
  const title = String(item.title || '').toLowerCase();
  const content = String(item.content || '').toLowerCase();
  const summary = String(item.summary || '').toLowerCase();
  const tags = Array.isArray(item.tags) ? item.tags.map((tag: string) => tag.toLowerCase()) : [];

  const normalizedQuery = originalQuery.toLowerCase();
  let score = 0;

  if (title.includes(normalizedQuery)) score += 16;
  if (summary.includes(normalizedQuery)) score += 12;
  if (content.includes(normalizedQuery)) score += 8;

  for (const token of tokens) {
    if (title.includes(token)) score += 5;
    if (summary.includes(token)) score += 4;
    if (content.includes(token)) score += 2;
    if (tags.some((tag: string) => tag.includes(token))) score += 3;
  }

  return score;
};

// GET /api/public/brain/query
router.get('/query', async (req, res) => {
  try {
    const { q, limit } = req.query;
    
    if (!q) {
      return res.status(400).json({
        success: false,
        error: "Missing query parameter 'q'",
        timestamp: new Date().toISOString(),
      });
    }

    const searchQuery = String(q);
    const searchTokens = extractSearchTokens(searchQuery);
    const parsedLimit = Number(limit);
    const resultLimit = Number.isFinite(parsedLimit)
      ? Math.min(Math.max(Math.floor(parsedLimit), 1), 20)
      : 8;

    const fullQueryRegex = { $regex: escapeRegex(searchQuery), $options: 'i' };

    let results = await KnowledgeItem.find({
      $or: [
        { title: fullQueryRegex },
        { content: fullQueryRegex },
        { summary: fullQueryRegex },
        { tags: fullQueryRegex },
      ],
    })
      .limit(resultLimit)
      .sort({ createdAt: -1 });

    if (results.length === 0 && searchTokens.length > 0) {
      const tokenPatterns = searchTokens.map((token) => ({ $regex: escapeRegex(token), $options: 'i' }));

      const tokenOrClauses = tokenPatterns.flatMap((pattern) => [
        { title: pattern },
        { content: pattern },
        { summary: pattern },
        { tags: pattern },
      ]);

      // Pull a larger candidate set, then score and trim for better natural-language relevance.
      const candidateResults = await KnowledgeItem.find({ $or: tokenOrClauses })
        .limit(Math.max(resultLimit * 4, 24))
        .sort({ createdAt: -1 });

      results = candidateResults
        .sort((a: any, b: any) => {
          const scoreDelta = getRelevanceScore(b, searchQuery, searchTokens) - getRelevanceScore(a, searchQuery, searchTokens);
          if (scoreDelta !== 0) return scoreDelta;
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        })
        .slice(0, resultLimit);
    }

    const contextualSources = results.map((item) => ({
      id: String(item._id),
      title: item.title,
      content: item.content,
      summary: item.summary,
      tags: item.tags,
      createdAt: item.createdAt,
      url: item.url,
      fileUrl: item.fileUrl,
    }));

    const aiAnswer = await answerKnowledgeQuery(searchQuery, contextualSources);
    const sourceSet = new Set(aiAnswer.sourceIds);
    const sources = results
      .filter((item) => sourceSet.has(String(item._id)))
      .map(sanitizeForPublic);

    const fallbackSources = sources.length > 0 ? sources : results.slice(0, 3).map(sanitizeForPublic);

    res.json({
      success: true,
      data: {
        query: searchQuery,
        count: results.length,
        answer: aiAnswer.answer,
        confidence: aiAnswer.confidence,
        sources: fallbackSources,
      },
      // Legacy compatibility for existing clients
      query: searchQuery,
      count: results.length,
      answers: fallbackSources,
      sources: fallbackSources.map((r) => r.url).filter(Boolean),
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error("Public query error:", error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      timestamp: new Date().toISOString(),
    });
  }
});

// GET /api/public/brain/items
router.get('/items', async (req, res) => {
  try {
    const { type, tag, search, limit } = req.query;
    const parsedLimit = Number(limit);
    const resultLimit = Number.isFinite(parsedLimit)
      ? Math.min(Math.max(Math.floor(parsedLimit), 1), 100)
      : 25;

    const query: Record<string, any> = {};

    if (type && String(type) !== 'all') {
      query.type = String(type).toLowerCase();
    }

    if (tag) {
      query.tags = { $in: [String(tag)] };
    }

    if (search) {
      query.$or = [
        { title: { $regex: String(search), $options: 'i' } },
        { content: { $regex: String(search), $options: 'i' } },
        { summary: { $regex: String(search), $options: 'i' } },
      ];
    }

    const items = await KnowledgeItem.find(query).sort({ createdAt: -1 }).limit(resultLimit);

    res.json({
      success: true,
      data: {
        items: items.map(sanitizeForPublic),
        total: items.length,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Public items error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      timestamp: new Date().toISOString(),
    });
  }
});

// POST /api/public/brain/summarize
router.post('/summarize', async (req, res) => {
  try {
    const { content, maxLength } = req.body || {};

    if (!content || typeof content !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Missing required field: content',
        timestamp: new Date().toISOString(),
      });
    }

    const maxSentences = typeof maxLength === 'number' ? Math.max(1, Math.min(maxLength, 5)) : 2;
    const summary = await summarizeFreeformContent(content, maxSentences);

    res.json({
      success: true,
      data: {
        summary,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Public summarize error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      timestamp: new Date().toISOString(),
    });
  }
});

// GET /api/public/brain/widget
router.get('/widget', async (_req, res) => {
  const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Second Brain Widget</title>
    <style>
      :root {
        color-scheme: dark;
        --bg: #05070d;
        --panel: #0b1220;
        --border: #1f2a44;
        --text: #e2e8f0;
        --muted: #94a3b8;
        --accent: #22d3ee;
      }
      body {
        margin: 0;
        background: radial-gradient(circle at top right, #0f172a 0%, var(--bg) 55%);
        color: var(--text);
        font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial;
      }
      .wrap {
        max-width: 820px;
        margin: 0 auto;
        padding: 16px;
      }
      .card {
        border: 1px solid var(--border);
        background: color-mix(in oklab, var(--panel) 88%, #0f172a 12%);
        border-radius: 12px;
        padding: 14px;
      }
      .row {
        display: flex;
        gap: 8px;
      }
      input, button {
        border-radius: 10px;
        border: 1px solid var(--border);
        background: #0b1325;
        color: var(--text);
        padding: 10px 12px;
      }
      input { flex: 1; }
      button {
        cursor: pointer;
        border-color: color-mix(in oklab, var(--accent) 70%, var(--border) 30%);
      }
      button:hover { filter: brightness(1.08); }
      .answer {
        margin-top: 12px;
        line-height: 1.5;
        color: #cbd5e1;
      }
      .source {
        margin-top: 10px;
        padding: 10px;
        border: 1px solid var(--border);
        border-radius: 10px;
        background: #0b1320;
      }
      .source h4 {
        margin: 0 0 6px;
        font-size: 14px;
      }
      .meta {
        font-size: 12px;
        color: var(--muted);
      }
    </style>
  </head>
  <body>
    <div class="wrap">
      <div class="card">
        <div class="row">
          <input id="q" placeholder="Ask this second brain anything..." />
          <button id="submit">Ask</button>
        </div>
        <div id="answer" class="answer">Try: \"What do my notes say about productivity?\"</div>
        <div id="sources"></div>
      </div>
    </div>

    <script>
      const q = document.getElementById('q');
      const submit = document.getElementById('submit');
      const answerEl = document.getElementById('answer');
      const sourcesEl = document.getElementById('sources');

      async function runQuery() {
        const value = q.value.trim();
        if (!value) return;
        answerEl.textContent = 'Searching...';
        sourcesEl.innerHTML = '';

        try {
          const response = await fetch('/api/public/brain/query?q=' + encodeURIComponent(value));
          const payload = await response.json();

          if (!response.ok || payload.success === false) {
            throw new Error(payload.error || 'Request failed');
          }

          const data = payload.data || payload;
          answerEl.textContent = data.answer || 'No answer available.';

          const sources = data.sources || [];
          sourcesEl.innerHTML = sources
            .map(
              (s) =>
                '<div class="source">' +
                '<h4>' + (s.title || 'Untitled') + '</h4>' +
                '<div class="meta">' + (s.type || 'note') + '</div>' +
                '<div class="meta">' + (s.summary || '') + '</div>' +
                (s.url ? '<div class="meta"><a href="' + s.url + '" target="_blank" rel="noreferrer">Open source</a></div>' : '') +
                '</div>'
            )
            .join('');
        } catch (err) {
          answerEl.textContent = err instanceof Error ? err.message : 'Could not query this brain right now.';
        }
      }

      submit.addEventListener('click', runQuery);
      q.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') runQuery();
      });
    </script>
  </body>
</html>`;

  res.type('html').send(html);
});

export default router;
