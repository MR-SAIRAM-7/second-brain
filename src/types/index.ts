// Second Brain - Core Types

export type KnowledgeType = 'note' | 'link' | 'insight' | 'article' | 'idea';

export interface KnowledgeItem {
  id: string;
  title: string;
  content: string;
  type: KnowledgeType;
  tags: string[];
  sourceUrl?: string;
  summary?: string;
  createdAt: Date;
  updatedAt: Date;
  userId: string;
  metadata?: {
    wordCount?: number;
    readingTime?: number;
    aiGenerated?: boolean;
  };
}

export interface AIQueryResult {
  answer: string;
  sources: KnowledgeItem[];
  confidence: number;
  suggestedTags?: string[];
}

export interface SearchFilters {
  type?: KnowledgeType | 'all';
  tags: string[];
  dateRange?: {
    start: Date;
    end: Date;
  };
  query: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  preferences: {
    theme: 'dark' | 'light';
    autoSummarize: boolean;
    defaultTags: string[];
  };
}

export interface CreateKnowledgeInput {
  title: string;
  content: string;
  type: KnowledgeType;
  tags?: string[];
  sourceUrl?: string;
}

export interface UpdateKnowledgeInput {
  title?: string;
  content?: string;
  type?: KnowledgeType;
  tags?: string[];
  sourceUrl?: string;
  summary?: string;
}

export interface PublicAPIResponse {
  success: boolean;
  data?: unknown;
  error?: string;
  timestamp: string;
}

export interface ArchitectureDoc {
  title: string;
  description: string;
  principles: {
    name: string;
    description: string;
    implementation: string;
  }[];
  components: {
    name: string;
    type: string;
    description: string;
    swappable: boolean;
  }[];
}
