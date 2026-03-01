import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize the Gemini API client lazily so missing keys fail gracefully
let workingModelId: string | undefined;

const generateWithRetry = async (prompt: string) => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        throw new Error('GEMINI_API_KEY is not configured');
    }
    const genAI = new GoogleGenerativeAI(apiKey);

    const candidates = [
        'gemini-3-flash-preview'
    ];

    if (workingModelId) {
        candidates.unshift(workingModelId);
    }

    const uniqueCandidates = [...new Set(candidates)];

    let lastError: any;
    for (const modelId of uniqueCandidates) {
        try {
            // Using v1beta for preview models as they are not available on v1
            const model = genAI.getGenerativeModel(
                { model: modelId },
                { apiVersion: 'v1beta' }
            );
            const result = await model.generateContent(prompt);
            workingModelId = modelId;
            return result;
        } catch (err: any) {
            lastError = err;
            if (err?.status === 404 || err?.message?.includes('not found') || err?.message?.includes('not supported') || err?.message?.includes('API version v1')) {
                console.warn(`[ai] model ${modelId} not available, trying next`);
                continue;
            }
            throw err;
        }
    }

    throw lastError ?? new Error('No available Gemini model IDs worked');
};

export const aiService = {
    // Generate a concise summary of content
    summarize: async (content: string): Promise<string> => {
        try {
            const prompt = `Please provide a concise summary (max 2-3 sentences) of the following content:\n\n${content}`;
            const result = await generateWithRetry(prompt);
            return result.response.text().trim();
        } catch (error) {
            console.error('Error generating summary:', error);
            return content.slice(0, 150) + '...';
        }
    },

    // Auto-generate tags based on content
    autoTag: async (content: string, title: string): Promise<string[]> => {
        try {
            const prompt = `Analyze the following content and title, and provide up to 5 relevant tags or keywords. Return the tags as a comma-separated list without any other text or formatting.\n\nTitle: ${title}\nContent: ${content}`;
            const result = await generateWithRetry(prompt);
            const text = result.response.text();
            return text.split(',').map(tag => tag.trim().toLowerCase().replace(/[^a-z0-9-]/g, '')).filter(Boolean);
        } catch (error) {
            console.error('Error generating tags:', error);
            return ['note'];
        }
    },

    // Conversational query - answer questions based on knowledge base
    query: async (question: string, contextItems: { title: string, content: string }[]): Promise<{ answer: string, confidence: number }> => {
        try {
            const contextText = contextItems.map(item => `Title: ${item.title}\nContent: ${item.content}`).join('\n\n---\n\n');
            const prompt = `You are a helpful AI assistant for a "Second Brain" knowledge management application.
Answer the user's question based ONLY on the provided context notes from their knowledge base.
If the answer is not contained in the notes, say that you cannot find the answer in their knowledge base.

Context Notes:
${contextText}

Question:
${question}

Answer:`;
            const result = await generateWithRetry(prompt);
            return {
                answer: result.response.text().trim(),
                confidence: 0.85
            };
        } catch (error) {
            console.error('Error querying AI:', error);
            return {
                answer: 'Sorry, I encountered an error while processing your request.',
                confidence: 0
            };
        }
    },
};
