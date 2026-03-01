import type { KnowledgeItem, KnowledgeType, CreateKnowledgeInput, UpdateKnowledgeInput, User } from '@/types';

const API_BASE = '/api/public/brain';
const API_KEY = import.meta.env.VITE_API_KEY || 'dev-key';

const headers = () => ({
  'Content-Type': 'application/json',
  ...(API_KEY ? { Authorization: `Bearer ${API_KEY}` } : {}),
});

export const db = {
  knowledge: {
    getAll: async (): Promise<KnowledgeItem[]> => {
      const res = await fetch(`${API_BASE}/items`, { headers: headers() });
      const data = await res.json();
      return (data.data?.items || []).map((item: any) => ({
        ...item,
        createdAt: new Date(item.createdAt),
        updatedAt: new Date(item.updatedAt),
      }));
    },

    getById: async (_id: string): Promise<KnowledgeItem | null> => {
      return null;
    },

    create: async (input: CreateKnowledgeInput): Promise<KnowledgeItem> => {
      const res = await fetch(`${API_BASE}/items`, {
        method: 'POST',
        headers: headers(),
        body: JSON.stringify(input),
      });
      const data = await res.json();
      return {
        ...data.data,
        createdAt: new Date(data.data.createdAt),
        updatedAt: new Date(data.data.updatedAt),
      };
    },

    update: async (id: string, input: UpdateKnowledgeInput): Promise<KnowledgeItem | null> => {
      const res = await fetch(`${API_BASE}/items/${id}`, {
        method: 'PUT',
        headers: headers(),
        body: JSON.stringify(input),
      });
      if (!res.ok) return null;
      const data = await res.json();
      return {
        ...data.data,
        createdAt: new Date(data.data.createdAt),
        updatedAt: new Date(data.data.updatedAt),
      };
    },

    delete: async (id: string): Promise<boolean> => {
      await fetch(`${API_BASE}/items/${id}`, { method: 'DELETE', headers: headers() });
      return true;
    },

    search: async (_query: string, _filters?: { type?: string; tags?: string[] }): Promise<KnowledgeItem[]> => {
      return [];
    },

    getByType: async (_type: KnowledgeType): Promise<KnowledgeItem[]> => {
      return [];
    },

    getAllTags: async (): Promise<string[]> => {
      const res = await fetch(`${API_BASE}/tags`, { headers: headers() });
      const data = await res.json();
      return data.data || [];
    },
  },
  user: {
    getCurrent: async (): Promise<User> => {
      return {
        id: 'user1',
        email: 'user@example.com',
        name: 'User',
        preferences: { theme: 'dark', autoSummarize: true, defaultTags: [] },
      };
    },
  },
};

export default db;
