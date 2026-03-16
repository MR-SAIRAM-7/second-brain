import OpenAI from 'openai';
import dotenv from 'dotenv';
dotenv.config();

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
