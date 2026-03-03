import type { KnowledgeItem, AIQueryResult, KnowledgeType } from '@/types';
import type { GraphResult, MindMapResult } from '@/types/ai';

const API_BASE = '/api/public/brain';
const API_KEY = import.meta.env.VITE_API_KEY;
const AUTH_TOKEN_KEY = 'sb_jwt';

const getAuthToken = () => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(AUTH_TOKEN_KEY);
};

const authHeader = () => {
  const token = getAuthToken();
  if (token) return `Bearer ${token}`;
  if (API_KEY) return `Bearer ${API_KEY}`;
  return undefined;
};

const headers = () => {
  const auth = authHeader();
  return {
    'Content-Type': 'application/json',
    ...(auth ? { Authorization: auth } : {}),
  };
};

const jsonHeaders = headers;

export const aiService = {
  summarize: async (content: string): Promise<string> => {
    const res = await fetch(`${API_BASE}/summarize`, {
      method: 'POST',
      headers: jsonHeaders(),
      body: JSON.stringify({ content, maxLength: 400 }),
    });
    if (!res.ok) return content;
    const data = await res.json();
    return data.data?.summary || content;
  },

  autoTag: async (content: string, title: string): Promise<string[]> => {
    const res = await fetch(`${API_BASE}/autotag`, {
      method: 'POST',
      headers: jsonHeaders(),
      body: JSON.stringify({ content, title }),
    });
    if (!res.ok) return [];
    const data = await res.json();
    return data.data?.tags || [];
  },

  query: async (question: string, _knowledgeBase: KnowledgeItem[]): Promise<AIQueryResult> => {
    const res = await fetch(`${API_BASE}/query`, {
      method: 'POST',
      headers: jsonHeaders(),
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
      headers: jsonHeaders(),
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
      headers: jsonHeaders(),
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
