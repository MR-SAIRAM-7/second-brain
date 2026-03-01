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

    // Generate a concise mind map in markdown bullets (3-level tree)
    mindMap: async (title: string, content: string): Promise<string> => {
        const prompt = `You are a note-to-mindmap generator.
Return a clear bullet hierarchy (markdown) with up to 3 levels based on the note title and content.
Guidelines:
- Root: the title.
- 4-8 main branches with short phrases.
- Under each branch, 1-3 concise child bullets (no paragraphs).
- No extra prose before or after.

Title: ${title}
Content:
${content}

Mind map (markdown bullets):`;

        const result = await generateWithRetry(prompt);
        return result.response.text().trim();
    },

    // Generate a lightweight knowledge graph description
    knowledgeGraph: async (title: string, content: string): Promise<{ nodes: { id: string, label: string }[], edges: { source: string, target: string, label?: string }[], plainText: string }> => {
        const prompt = `You are a knowledge graph extractor.
Return JSON with nodes and edges extracted from the note. Keep it small (<=15 nodes).
Schema: {"nodes":[{"id":"string","label":"string"}],"edges":[{"source":"string","target":"string","label":"string"}]}
Rules:
- Always include the note title as a node id "title" with label equal to the title text.
- Prefer concise labels; lowercase ids with dashes.
- Edges should capture relationships like topic -> subtopic, concept -> detail, tag -> title.
Provide ONLY the JSON.`;

        try {
            const result = await generateWithRetry(`${prompt}

Title: ${title}
Content:
${content}`);
            const text = result.response.text();
            const jsonStart = text.indexOf('{');
            const jsonEnd = text.lastIndexOf('}');
            if (jsonStart >= 0 && jsonEnd > jsonStart) {
                const parsed = JSON.parse(text.slice(jsonStart, jsonEnd + 1));
                const nodes = Array.isArray(parsed.nodes) ? parsed.nodes : [];
                const edges = Array.isArray(parsed.edges) ? parsed.edges : [];
                return {
                    nodes: nodes.map((n: any, idx: number) => ({
                        id: typeof n.id === 'string' ? n.id : `n-${idx}`,
                        label: typeof n.label === 'string' ? n.label : (typeof n.id === 'string' ? n.id : `Node ${idx + 1}`),
                    })),
                    edges: edges.map((e: any, idx: number) => ({
                        source: typeof e.source === 'string' ? e.source : 'title',
                        target: typeof e.target === 'string' ? e.target : 'title',
                        label: typeof e.label === 'string' ? e.label : undefined,
                    })),
                    plainText: text.trim(),
                };
            }
            return {
                nodes: [],
                edges: [],
                plainText: text.trim(),
            };
        } catch (error) {
            console.error('Error generating knowledge graph:', error);
            return {
                nodes: [],
                edges: [],
                plainText: 'Could not generate graph.',
            };
        }
    },
};
