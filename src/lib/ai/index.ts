import type { KnowledgeItem, AIQueryResult, KnowledgeType } from '@/types';
import type { GraphResult, MindMapResult } from '@/types/ai';

const API_BASE = '/api/public/brain';
const API_KEY = import.meta.env.VITE_API_KEY || 'dev-key';

const headers = () => ({
  'Content-Type': 'application/json',
  ...(API_KEY ? { Authorization: `Bearer ${API_KEY}` } : {}),
});

export const aiService = {
  summarize: async (content: string): Promise<string> => {
    const res = await fetch(`${API_BASE}/summarize`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify({ content, maxLength: 400 }),
    });
    if (!res.ok) return content;
    const data = await res.json();
    return data.data?.summary || content;
  },

  autoTag: async (_content: string, _title: string): Promise<string[]> => {
    return [];
  },

  query: async (question: string, _knowledgeBase: KnowledgeItem[]): Promise<AIQueryResult> => {
    const res = await fetch(`${API_BASE}/query`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify({ q: question, limit: 5 }),
    });
    const data = await res.json();
    return {
      answer: data.data.answer,
      sources: data.data.sources.map((item: any) => ({
        ...item,
        createdAt: new Date(item.createdAt),
        updatedAt: new Date(item.updatedAt),
      })),
      confidence: data.data.confidence,
    };
  },

  suggestRelated: async (_item: KnowledgeItem, _knowledgeBase: KnowledgeItem[]): Promise<KnowledgeItem[]> => {
    return [];
  },

  extractInsights: async (_content: string): Promise<string[]> => {
    return [];
  },

  classifyType: async (_content: string, _title: string): Promise<KnowledgeType> => {
    return 'note';
  },

  mindMap: async (title: string, content: string): Promise<MindMapResult> => {
    const res = await fetch(`${API_BASE}/mindmap`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify({ title, content }),
    });
    if (!res.ok) {
      return { map: 'Mind map generation failed.' };
    }
    const data = await res.json();
    return { map: data.data?.map || 'No map generated.' };
  },

  knowledgeGraph: async (title: string, content: string): Promise<GraphResult> => {
    const res = await fetch(`${API_BASE}/graph`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify({ title, content }),
    });
    if (!res.ok) {
      return { nodes: [], edges: [], plainText: 'Graph generation failed.' };
    }
    const data = await res.json();
    return {
      nodes: data.data?.nodes || [],
      edges: data.data?.edges || [],
      plainText: data.data?.plainText || 'No graph generated.',
    };
  },
};

export default aiService;
