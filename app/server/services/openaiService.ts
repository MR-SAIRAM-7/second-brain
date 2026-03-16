import OpenAI from 'openai';
import dotenv from 'dotenv';
dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || 'dummy_key_to_prevent_crash_when_missing',
});

export async function processKnowledgeItemContent(content: string) {
  if (!process.env.OPENAI_API_KEY) {
      console.warn("OPENAI_API_KEY is not set. Returning mock data.");
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
      model: 'gpt-3.5-turbo',
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
      summary: "Failed to generate AI summary.",
      tags: ["error"]
    };
  }
}
