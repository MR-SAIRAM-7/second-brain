import OpenAI from 'openai';
import dotenv from 'dotenv';
dotenv.config();

type QuerySource = {
  id: string;
  title: string;
  content: string;
  summary?: string;
  tags?: string[];
  createdAt?: Date | string;
  url?: string;
  fileUrl?: string;
};

const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini';
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '';

const isOpenAIConfigured = (): boolean => {
  const key = OPENAI_API_KEY.trim();
  if (!key) return false;

  const placeholderValues = new Set([
    'your_openai_api_key_here',
    'dummy_key_to_prevent_crash_when_missing',
    'changeme',
  ]);

  if (placeholderValues.has(key.toLowerCase())) {
    return false;
  }

  return key.startsWith('sk-');
};

const openai = new OpenAI({
  apiKey: OPENAI_API_KEY || 'dummy_key_to_prevent_crash_when_missing',
});

export async function processKnowledgeItemContent(content: string) {
  if (!isOpenAIConfigured()) {
      console.warn("OPENAI_API_KEY is missing or placeholder. Returning mock data.");
      return {
          summary: "This is a mock summary because OpenAI API Key is missing. Connect your key to get accurate AI summaries.",
          tags: ["mock-tag", "setup-required"],
      };
  }

  try {
    const prompt = `
      You are an AI assistant helping to categorize and summarize knowledge items for a "Second Brain" system.
      Read the following content and provide:
      1. A concise 1-2 sentence summary.
      2. 2-5 relevant tags (comma separated).

      Output ONLY valid JSON in the following format:
      {
        "summary": "Your 1-2 sentence summary here.",
        "tags": ["tag1", "tag2", "tag3"]
      }

      Content:
      "${content}"
    `;

    const response = await openai.chat.completions.create({
      model: OPENAI_MODEL,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      response_format: { type: "json_object" }
    });

    const resultString = response.choices[0].message.content;
    if (!resultString) throw new Error("No response from OpenAI");
    
    const result = JSON.parse(resultString);
    return {
      summary: result.summary,
      tags: result.tags
    };

  } catch (error) {
    console.error("Error processing with OpenAI:", error);
    // Fallback if API fails
    return {
      summary: "AI summary is temporarily unavailable. Your note was saved successfully and can be summarized later.",
      tags: ["ai-unavailable", "saved"]
    };
  }
}

export async function summarizeFreeformContent(content: string, maxSentences = 2): Promise<string> {
  const cleaned = content.trim();
  if (!cleaned) return '';

  if (!isOpenAIConfigured()) {
    const naive = cleaned.replace(/\s+/g, ' ');
    const snippets = naive.split(/(?<=[.!?])\s+/).filter(Boolean).slice(0, Math.max(1, maxSentences));
    return snippets.join(' ');
  }

  try {
    const prompt = `You summarize text for a personal knowledge system.\nReturn a concise summary in at most ${Math.max(1, maxSentences)} sentence(s).\n\nText:\n${cleaned}`;

    const response = await openai.chat.completions.create({
      model: OPENAI_MODEL,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.2,
    });

    return response.choices[0]?.message?.content?.trim() || cleaned.slice(0, 220);
  } catch (error) {
    console.error('Error summarizing freeform content with OpenAI:', error);
    return cleaned.slice(0, 220);
  }
}

export async function answerKnowledgeQuery(question: string, sources: QuerySource[]) {
  const trimmedQuestion = question.trim();
  const normalizedSources = sources.slice(0, 8);

  if (!trimmedQuestion) {
    return {
      answer: 'Please provide a question so I can search your knowledge base.',
      confidence: 0,
      sourceIds: [] as string[],
    };
  }

  if (normalizedSources.length === 0) {
    return {
      answer: `I could not find matching notes for "${trimmedQuestion}" in your knowledge base yet.`,
      confidence: 0.2,
      sourceIds: [] as string[],
    };
  }

  const serializedContext = normalizedSources
    .map((item, index) => {
      const safeSummary = item.summary || item.content.slice(0, 240);
      const safeTags = item.tags?.join(', ') || 'none';
      return `${index + 1}. [${item.id}] ${item.title}\nSummary: ${safeSummary}\nTags: ${safeTags}`;
    })
    .join('\n\n');

  if (!isOpenAIConfigured()) {
    const fallbackBullets = normalizedSources
      .slice(0, 3)
      .map((item) => `- ${item.title}: ${(item.summary || item.content).slice(0, 140)}...`)
      .join('\n');

    return {
      answer:
        `I found relevant notes for "${trimmedQuestion}". Here are the strongest matches:\n\n${fallbackBullets}`,
      confidence: 0.55,
      sourceIds: normalizedSources.slice(0, 3).map((item) => item.id),
    };
  }

  try {
    const prompt = `You answer questions using a private knowledge base.\nUse ONLY the provided context. If context is not enough, say so clearly.\n\nQuestion:\n${trimmedQuestion}\n\nContext:\n${serializedContext}\n\nReturn strict JSON:\n{\n  "answer": "string",\n  "confidence": 0.0,\n  "sourceIds": ["id1", "id2"]\n}`;

    const response = await openai.chat.completions.create({
      model: OPENAI_MODEL,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.2,
      response_format: { type: 'json_object' },
    });

    const raw = response.choices[0]?.message?.content;
    if (!raw) throw new Error('No response from OpenAI for query answer');

    const parsed = JSON.parse(raw);
    const validSourceIds = new Set(normalizedSources.map((item) => item.id));
    const sourceIds = Array.isArray(parsed.sourceIds)
      ? parsed.sourceIds.filter((id: unknown) => typeof id === 'string' && validSourceIds.has(id))
      : normalizedSources.slice(0, 2).map((item) => item.id);

    return {
      answer: typeof parsed.answer === 'string' ? parsed.answer : 'I found relevant notes but could not generate a full answer.',
      confidence:
        typeof parsed.confidence === 'number' && parsed.confidence >= 0 && parsed.confidence <= 1
          ? parsed.confidence
          : 0.75,
      sourceIds,
    };
  } catch (error) {
    console.error('Error answering knowledge query with OpenAI:', error);
    return {
      answer:
        'I found relevant notes, but the AI answer service is temporarily unavailable. You can still inspect the matched sources below.',
      confidence: 0.4,
      sourceIds: normalizedSources.slice(0, 3).map((item) => item.id),
    };
  }
}
