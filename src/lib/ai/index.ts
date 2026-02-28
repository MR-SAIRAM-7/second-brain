import type { KnowledgeItem, AIQueryResult, KnowledgeType } from '@/types';

const API_BASE = '/api/public/brain';

export const aiService = {
  summarize: async (content: string): Promise<string> => {
    // Handled by backend on item creation
    return content;
  },

  autoTag: async (_content: string, _title: string): Promise<string[]> => {
    // Now handled by backend on creation, but if frontend needs it separately:
    // (In Dashboard.tsx it calls this directly before submit)
    // For now we return empty so it relies on backend fallback
    return [];
  },

  query: async (question: string, _knowledgeBase: KnowledgeItem[]): Promise<AIQueryResult> => {
    const res = await fetch(`${API_BASE}/query`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ q: question, limit: 5 })
    });
    const data = await res.json();
    return {
      answer: data.data.answer,
      sources: data.data.sources.map((item: any) => ({
        ...item,
        createdAt: new Date(item.createdAt),
        updatedAt: new Date(item.updatedAt)
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
};

export default aiService;
