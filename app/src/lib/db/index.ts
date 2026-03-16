// Mock Database Layer - Simulates PostgreSQL/MongoDB operations
// In production, this would connect to your actual database

import type { KnowledgeItem, KnowledgeType, CreateKnowledgeInput, UpdateKnowledgeInput, User } from '@/types';

// Mock data store
let knowledgeItems: KnowledgeItem[] = [
  {
    id: '1',
    title: 'The Power of Compound Knowledge',
    content: 'Just like compound interest grows your money, compound knowledge grows your understanding. Small insights accumulated over time lead to breakthrough moments. The key is consistent capture and regular review.',
    type: 'insight',
    tags: ['productivity', 'learning', 'knowledge-management'],
    summary: 'Knowledge compounds over time through consistent capture and review.',
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-15'),
    userId: 'user1',
    metadata: {
      wordCount: 42,
      readingTime: 1,
      aiGenerated: false,
    },
  },
  {
    id: '2',
    title: 'Building a Second Brain - Tiago Forte',
    content: 'A comprehensive methodology for saving and systematically reminding us of the ideas, insights, and connections we gain from our experiences. The CODE methodology: Capture, Organize, Distill, Express.',
    type: 'article',
    sourceUrl: 'https://fortelabs.com/blog/basb/',
    tags: ['second-brain', 'productivity', 'organization'],
    summary: 'The CODE methodology: Capture, Organize, Distill, Express for knowledge management.',
    createdAt: new Date('2024-01-20'),
    updatedAt: new Date('2024-01-20'),
    userId: 'user1',
    metadata: {
      wordCount: 35,
      readingTime: 1,
      aiGenerated: true,
    },
  },
  {
    id: '3',
    title: 'Zettelkasten Method',
    content: 'A note-taking and knowledge management system developed by Niklas Luhmann. It emphasizes creating atomic notes that are linked together, forming a web of knowledge that can be navigated and discovered.',
    type: 'note',
    tags: ['note-taking', 'zettelkasten', 'research'],
    summary: 'Atomic notes linked together form a discoverable web of knowledge.',
    createdAt: new Date('2024-02-01'),
    updatedAt: new Date('2024-02-05'),
    userId: 'user1',
    metadata: {
      wordCount: 38,
      readingTime: 1,
      aiGenerated: true,
    },
  },
  {
    id: '4',
    title: 'The Feynman Technique',
    content: 'A learning method named after Richard Feynman. The process: 1) Choose a concept 2) Teach it to a child 3) Identify gaps in understanding 4) Review and simplify 5) Use analogies.',
    type: 'insight',
    tags: ['learning', 'education', 'technique'],
    summary: 'Learn by teaching - identify gaps and simplify complex concepts.',
    createdAt: new Date('2024-02-10'),
    updatedAt: new Date('2024-02-10'),
    userId: 'user1',
    metadata: {
      wordCount: 45,
      readingTime: 1,
      aiGenerated: true,
    },
  },
  {
    id: '5',
    title: 'Spaced Repetition for Long-term Memory',
    content: 'Spaced repetition is a learning technique that incorporates increasing intervals of time between subsequent review of previously learned material. Tools like Anki and SuperMemo implement this algorithm.',
    type: 'article',
    sourceUrl: 'https://en.wikipedia.org/wiki/Spaced_repetition',
    tags: ['memory', 'learning', 'spaced-repetition'],
    summary: 'Review material at increasing intervals for optimal long-term retention.',
    createdAt: new Date('2024-02-15'),
    updatedAt: new Date('2024-02-15'),
    userId: 'user1',
    metadata: {
      wordCount: 40,
      readingTime: 1,
      aiGenerated: true,
    },
  },
  {
    id: '6',
    title: 'Idea: AI-Powered Knowledge Graph',
    content: 'What if we could automatically visualize connections between notes using AI? The system would analyze content, extract entities and relationships, and build an interactive graph. Users could explore their knowledge like a map.',
    type: 'idea',
    tags: ['ai', 'visualization', 'knowledge-graph', 'idea'],
    summary: 'Auto-generate knowledge graphs from notes using AI entity extraction.',
    createdAt: new Date('2024-02-20'),
    updatedAt: new Date('2024-02-20'),
    userId: 'user1',
    metadata: {
      wordCount: 48,
      readingTime: 1,
      aiGenerated: false,
    },
  },
  {
    id: '7',
    title: 'Progressive Summarization',
    content: 'A technique for distilling notes down to their most important points. Layer 1: Capture raw notes. Layer 2: Bold key passages. Layer 3: Highlight top highlights. Layer 4: Write a mini-summary. Layer 5: Remix into new content.',
    type: 'note',
    tags: ['summarization', 'productivity', 'writing'],
    summary: 'Five layers of progressive note distillation for maximum value.',
    createdAt: new Date('2024-02-25'),
    updatedAt: new Date('2024-02-25'),
    userId: 'user1',
    metadata: {
      wordCount: 52,
      readingTime: 1,
      aiGenerated: true,
    },
  },
  {
    id: '8',
    title: 'The PARA Method',
    content: 'Projects, Areas, Resources, Archives. A simple organizational system: Projects (goals with deadlines), Areas (ongoing responsibilities), Resources (reference material), Archives (inactive items).',
    type: 'insight',
    tags: ['organization', 'para', 'productivity'],
    summary: 'Organize by Projects, Areas, Resources, and Archives.',
    createdAt: new Date('2024-03-01'),
    updatedAt: new Date('2024-03-01'),
    userId: 'user1',
    metadata: {
      wordCount: 36,
      readingTime: 1,
      aiGenerated: true,
    },
  },
];

// Mock current user
const currentUser: User = {
  id: 'user1',
  email: 'thinker@secondbrain.app',
  name: 'Knowledge Seeker',
  preferences: {
    theme: 'dark',
    autoSummarize: true,
    defaultTags: ['inbox'],
  },
};

// Database Operations
export const db = {
  // Knowledge Items
  knowledge: {
    getAll: async (): Promise<KnowledgeItem[]> => {
      return [...knowledgeItems].sort((a, b) => 
        b.createdAt.getTime() - a.createdAt.getTime()
      );
    },

    getById: async (id: string): Promise<KnowledgeItem | null> => {
      return knowledgeItems.find(item => item.id === id) || null;
    },

    create: async (input: CreateKnowledgeInput): Promise<KnowledgeItem> => {
      const newItem: KnowledgeItem = {
        id: Math.random().toString(36).substr(2, 9),
        ...input,
        tags: input.tags || [],
        createdAt: new Date(),
        updatedAt: new Date(),
        userId: currentUser.id,
        metadata: {
          wordCount: input.content.split(/\s+/).length,
          readingTime: Math.ceil(input.content.split(/\s+/).length / 200),
          aiGenerated: false,
        },
      };
      knowledgeItems.unshift(newItem);
      return newItem;
    },

    update: async (id: string, input: UpdateKnowledgeInput): Promise<KnowledgeItem | null> => {
      const index = knowledgeItems.findIndex(item => item.id === id);
      if (index === -1) return null;

      const updated = {
        ...knowledgeItems[index],
        ...input,
        tags: input.tags || knowledgeItems[index].tags,
        updatedAt: new Date(),
      };
      
      if (input.content) {
        updated.metadata = {
          ...updated.metadata,
          wordCount: input.content.split(/\s+/).length,
          readingTime: Math.ceil(input.content.split(/\s+/).length / 200),
        };
      }

      knowledgeItems[index] = updated;
      return updated;
    },

    delete: async (id: string): Promise<boolean> => {
      const index = knowledgeItems.findIndex(item => item.id === id);
      if (index === -1) return false;
      knowledgeItems.splice(index, 1);
      return true;
    },

    search: async (query: string, filters?: { type?: string; tags?: string[] }): Promise<KnowledgeItem[]> => {
      let results = knowledgeItems;

      if (query) {
        const lowerQuery = query.toLowerCase();
        results = results.filter(item =>
          item.title.toLowerCase().includes(lowerQuery) ||
          item.content.toLowerCase().includes(lowerQuery) ||
          item.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
        );
      }

      if (filters?.type && filters.type !== 'all') {
        results = results.filter(item => item.type === filters.type);
      }

      if (filters?.tags && filters.tags.length > 0) {
        results = results.filter(item =>
          filters.tags!.some(tag => item.tags.includes(tag))
        );
      }

      return results;
    },

    getByType: async (type: KnowledgeType): Promise<KnowledgeItem[]> => {
      return knowledgeItems.filter(item => item.type === type);
    },

    getAllTags: async (): Promise<string[]> => {
      const tags = new Set<string>();
      knowledgeItems.forEach(item => {
        item.tags.forEach(tag => tags.add(tag));
      });
      return Array.from(tags).sort();
    },
  },

  // User
  user: {
    getCurrent: async (): Promise<User> => {
      return currentUser;
    },
  },
};

export default db;
