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

const PLACEHOLDER_SUMMARY_PATTERNS = [
  /mock summary because openai api key is missing/i,
  /connect your key to get accurate ai summaries/i,
  /ai summary is temporarily unavailable/i,
];

const toPlainText = (input: string): string =>
  input
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/\s+/g, ' ')
    .trim();

const firstSentences = (text: string, maxSentences = 2): string => {
  const compact = toPlainText(text);
  if (!compact) return '';
  const parts = compact.split(/(?<=[.!?])\s+/).filter(Boolean);
  return parts.slice(0, Math.max(1, maxSentences)).join(' ');
};

const isPlaceholderSummary = (summary?: string): boolean => {
  if (!summary) return false;
  const normalized = summary.trim();
  if (!normalized) return false;
  return PLACEHOLDER_SUMMARY_PATTERNS.some((pattern) => pattern.test(normalized));
};

const bestSourceSnippet = (item: QuerySource, maxSentences = 2): string => {
  const summary = item.summary?.trim() || '';
  if (summary && !isPlaceholderSummary(summary)) {
    const summaryText = firstSentences(summary, maxSentences);
    if (summaryText) return summaryText;
  }

  const contentText = firstSentences(item.content || '', maxSentences);
  if (contentText) return contentText;

  return summary ? firstSentences(summary, maxSentences) : '';
};

const extractAgeQuestionSubject = (question: string): string | null => {
  const cleaned = question.trim().replace(/[?]+$/g, '');
  if (!cleaned) return null;

  const ageOfMatch = cleaned.match(/age of\s+(.+)/i);
  if (ageOfMatch?.[1]) return ageOfMatch[1].trim();

  const howOldMatch = cleaned.match(/how old is\s+(.+)/i);
  if (howOldMatch?.[1]) return howOldMatch[1].trim();

  return null;
};

const hasSubjectMatch = (text: string, subject: string | null): boolean => {
  if (!subject) return true;
  const subjectTokens = subject
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((token) => token.length >= 3);

  if (subjectTokens.length === 0) return true;

  const normalizedText = text.toLowerCase();
  return subjectTokens.every((token) => normalizedText.includes(token));
};

const extractAgeFromText = (text: string): number | null => {
  const patterns = [
    /\bage(?:\s+of\s+[a-z\s'\-]+)?\s*(?:is|was|:)\s*(\d{1,3})\b/i,
    /\b(\d{1,3})\s*(?:years?|yrs?)\s*old\b/i,
    /\baged\s+(\d{1,3})\b/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (!match?.[1]) continue;
    const parsed = Number(match[1]);
    if (Number.isFinite(parsed) && parsed > 0 && parsed < 130) {
      return parsed;
    }
  }

  return null;
};

const toPossessive = (name: string): string => {
  const trimmed = name.trim();
  if (!trimmed) return 'The subject\'s';
  return trimmed.toLowerCase().endsWith('s') ? `${trimmed}'` : `${trimmed}'s`;
};

const answerFromLocalSources = (
  question: string,
  sources: QuerySource[]
): { answer: string; confidence: number; sourceIds: string[] } | null => {
  const isAgeQuestion = /\b(age|how old)\b/i.test(question);
  if (!isAgeQuestion) return null;

  const subject = extractAgeQuestionSubject(question);

  for (const item of sources) {
    const combinedText = toPlainText(`${item.title || ''} ${item.content || ''} ${item.summary || ''}`);
    if (!combinedText) continue;
    if (!hasSubjectMatch(combinedText, subject)) continue;

    const age = extractAgeFromText(combinedText);
    if (age === null) continue;

    const subjectName = item.title?.trim() || subject || 'the subject';
    return {
      answer: `Based on your notes, ${toPossessive(subjectName)} age is ${age}.`,
      confidence: 0.72,
      sourceIds: [item.id],
    };
  }

  return null;
};

const extractGeneralKnowledgeTopic = (question: string): string | null => {
  const normalized = question.trim().replace(/[?]+$/g, '');
  if (!normalized) return null;

  const privateContextHints = [' my ', ' our ', ' notes', ' knowledge base', ' project', ' app', ' document'];
  const padded = ` ${normalized.toLowerCase()} `;
  if (privateContextHints.some((hint) => padded.includes(hint))) {
    return null;
  }

  const directPatterns = [
    /(?:how old is|age of)\s+(.+)/i,
    /(?:who is|what is|where is|when is|tell me about|information about)\s+(.+)/i,
  ];

  for (const pattern of directPatterns) {
    const match = normalized.match(pattern);
    if (match?.[1]) {
      return match[1].trim();
    }
  }

  if (/^(who|what|where|when|how)\b/i.test(normalized)) {
    return normalized.replace(/^(who|what|where|when|how)\b\s*/i, '').trim() || null;
  }

  return normalized;
};

const deriveAgeFromExtract = (extract: string): number | null => {
  const compact = extract.replace(/\s+/g, ' ').trim();
  if (!compact) return null;

  const lifespanMatch = compact.match(/(\d{4})\s*[\u2013\-]\s*(\d{4}|present)/i);
  if (lifespanMatch) {
    const birthYear = Number(lifespanMatch[1]);
    const endYear = /present/i.test(lifespanMatch[2]) ? new Date().getFullYear() : Number(lifespanMatch[2]);
    if (Number.isFinite(birthYear) && Number.isFinite(endYear) && endYear >= birthYear) {
      return endYear - birthYear;
    }
  }

  const bornMatch = compact.match(/born[^\d]*(\d{4})/i);
  if (!bornMatch) return null;
  const birthYear = Number(bornMatch[1]);
  if (!Number.isFinite(birthYear)) return null;

  const diedMatch = compact.match(/died[^\d]*(\d{4})/i);
  const endYear = diedMatch ? Number(diedMatch[1]) : new Date().getFullYear();
  if (!Number.isFinite(endYear) || endYear < birthYear) return null;

  return endYear - birthYear;
};

async function answerFromPublicReference(question: string): Promise<{ answer: string; confidence: number } | null> {
  const topic = extractGeneralKnowledgeTopic(question);
  if (!topic) return null;

  try {
    const summaryResponse = await fetch(
      `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(topic)}`
    );

    if (!summaryResponse.ok) {
      return null;
    }

    const summaryPayload = (await summaryResponse.json()) as {
      title?: string;
      extract?: string;
      content_urls?: { desktop?: { page?: string } };
    };

    const extract = summaryPayload.extract?.trim();
    if (!extract) return null;

    const title = summaryPayload.title || topic;
    const isAgeQuestion = /\b(age|how old)\b/i.test(question);
    const computedAge = isAgeQuestion ? deriveAgeFromExtract(extract) : null;

    const answer = computedAge !== null
      ? `${title} is approximately ${computedAge} years old based on available public biographical data.`
      : firstSentences(extract, 2);

    const sourceUrl = summaryPayload.content_urls?.desktop?.page;
    const sourceSuffix = sourceUrl ? `\n\nReference: ${sourceUrl}` : '';

    return {
      answer:
        `${answer}\n\nNote: No matching notes were found in your knowledge base, so this answer uses public reference data.${sourceSuffix}`,
      confidence: computedAge !== null ? 0.62 : 0.5,
    };
  } catch (error) {
    console.error('Error building public-reference fallback answer:', error);
    return null;
  }
}

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
    if (isOpenAIConfigured()) {
      try {
        const prompt = `You are an assistant in a personal knowledge app.
No relevant user notes were found for the question below.
Answer from general knowledge in 1-3 concise sentences.
Do not claim to use notes.

Question:
${trimmedQuestion}

Return strict JSON:
{
  "answer": "string",
  "confidence": 0.0
}`;

        const response = await openai.chat.completions.create({
          model: OPENAI_MODEL,
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.2,
          response_format: { type: 'json_object' },
        });

        const raw = response.choices[0]?.message?.content;
        if (!raw) throw new Error('No response from OpenAI for general fallback answer');

        const parsed = JSON.parse(raw);
        const answerText = typeof parsed.answer === 'string' ? parsed.answer.trim() : '';
        const modelConfidence =
          typeof parsed.confidence === 'number' && parsed.confidence >= 0 && parsed.confidence <= 1
            ? parsed.confidence
            : 0.45;

        return {
          answer:
            (answerText || `I could not find matching notes for "${trimmedQuestion}", but here is a general answer based on model knowledge.`) +
            '\n\nNote: No matching notes were found in your knowledge base for this query.',
          confidence: Math.min(modelConfidence, 0.65),
          sourceIds: [] as string[],
        };
      } catch (error) {
        console.error('Error generating general fallback answer with OpenAI:', error);
      }
    }

    const referenceFallback = await answerFromPublicReference(trimmedQuestion);
    if (referenceFallback) {
      return {
        answer: referenceFallback.answer,
        confidence: referenceFallback.confidence,
        sourceIds: [] as string[],
      };
    }

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
    const localAnswer = answerFromLocalSources(trimmedQuestion, normalizedSources);
    if (localAnswer) {
      return localAnswer;
    }

    const fallbackBullets = normalizedSources
      .slice(0, 3)
      .map((item) => {
        const snippet = bestSourceSnippet(item, 2) || 'No preview available.';
        return `- ${item.title}: ${snippet}`;
      })
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

    const localAnswer = answerFromLocalSources(trimmedQuestion, normalizedSources);
    if (localAnswer) {
      return localAnswer;
    }

    const fallbackBullets = normalizedSources
      .slice(0, 3)
      .map((item) => {
        const snippet = bestSourceSnippet(item, 2) || 'No preview available.';
        return `- ${item.title}: ${snippet}`;
      })
      .join('\n');

    return {
      answer:
        `I found relevant notes for "${trimmedQuestion}". The AI answer service is temporarily unavailable, so here are the strongest matches:\n\n${fallbackBullets}`,
      confidence: 0.5,
      sourceIds: normalizedSources.slice(0, 3).map((item) => item.id),
    };
  }
}
