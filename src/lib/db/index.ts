import type { KnowledgeItem, KnowledgeType, CreateKnowledgeInput, UpdateKnowledgeInput, User } from '@/types';

const API_BASE = '/api/public/brain';
const API_KEY = import.meta.env.VITE_API_KEY;
const AUTH_TOKEN_KEY = 'sb_jwt';

const getAuthToken = () => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(AUTH_TOKEN_KEY);
};

const setAuthToken = (token: string | null) => {
  if (typeof window === 'undefined') return;
  if (token) {
    localStorage.setItem(AUTH_TOKEN_KEY, token);
  } else {
    localStorage.removeItem(AUTH_TOKEN_KEY);
  }
};

const authHeader = () => {
  const token = getAuthToken();
  if (token) return `Bearer ${token}`;
  if (API_KEY) return `Bearer ${API_KEY}`;
  return undefined;
};

const jsonHeaders = () => {
  const auth = authHeader();
  return {
    'Content-Type': 'application/json',
    ...(auth ? { Authorization: auth } : {}),
  };
};

const formHeaders = () => {
  const auth = authHeader();
  return auth ? { Authorization: auth } : undefined;
};

export const db = {
  knowledge: {
    getAll: async (): Promise<KnowledgeItem[]> => {
      const res = await fetch(`${API_BASE}/items`, { headers: jsonHeaders() });
      if (!res.ok) {
        throw new Error('Unable to load knowledge items');
      }
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
        headers: jsonHeaders(),
        body: JSON.stringify(input),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to create item');
      }
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
        headers: jsonHeaders(),
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
      await fetch(`${API_BASE}/items/${id}`, { method: 'DELETE', headers: jsonHeaders() });
      return true;
    },

    search: async (_query: string, _filters?: { type?: string; tags?: string[] }): Promise<KnowledgeItem[]> => {
      return [];
    },

    getByType: async (_type: KnowledgeType): Promise<KnowledgeItem[]> => {
      return [];
    },

    getAllTags: async (): Promise<string[]> => {
      const res = await fetch(`${API_BASE}/tags`, { headers: jsonHeaders() });
      if (!res.ok) {
        throw new Error('Unable to load tags');
      }
      const data = await res.json();
      return data.data || [];
    },

    upload: async (file: File): Promise<KnowledgeItem> => {
      const form = new FormData();
      form.append('file', file);

      const res = await fetch(`${API_BASE}/upload`, {
        method: 'POST',
        headers: formHeaders(),
        body: form,
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to upload file');
      }
      const data = await res.json();
      return {
        ...data.data,
        createdAt: new Date(data.data.createdAt),
        updatedAt: new Date(data.data.updatedAt),
      };
    },
  },
  user: {
    getCurrent: async (): Promise<User> => {
      const res = await fetch('/api/auth/me', { headers: jsonHeaders() });
      if (!res.ok) {
        throw new Error('Unable to fetch current user');
      }
      const data = await res.json();
      const user = data.data?.user;
      return {
        ...user,
        createdAt: user?.createdAt ? new Date(user.createdAt) : undefined,
        updatedAt: user?.updatedAt ? new Date(user.updatedAt) : undefined,
      };
    },
  },
  auth: {
    login: async (email: string, password: string) => {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Login failed');
      }
      const token = data.data?.token as string;
      const user = data.data?.user as User;
      setAuthToken(token);
      return { token, user };
    },
    register: async (name: string, email: string, password: string) => {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Registration failed');
      }
      const token = data.data?.token as string;
      const user = data.data?.user as User;
      setAuthToken(token);
      return { token, user };
    },
    logout: () => setAuthToken(null),
  },
};

export default db;
