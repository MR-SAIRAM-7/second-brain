import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize the Gemini API client
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

export const aiService = {
    // Generate a concise summary of content
    summarize: async (content: string): Promise<string> => {
        try {
            const prompt = `Please provide a concise summary (max 2-3 sentences) of the following content:\n\n${content}`;
            const result = await model.generateContent(prompt);
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
            const result = await model.generateContent(prompt);
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
            const result = await model.generateContent(prompt);
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
