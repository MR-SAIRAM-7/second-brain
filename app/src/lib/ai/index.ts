// AI Service Layer - Simulates OpenAI/Claude/Gemini API calls
// In production, these would be server-side API calls to LLM providers

import type { KnowledgeItem, AIQueryResult, KnowledgeType } from '@/types';

// Simulated AI processing with realistic delays
const simulateDelay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Tag extraction patterns for auto-tagging
const tagPatterns: Record<string, string[]> = {
  'productivity': ['productivity', 'efficiency', 'workflow', 'time management', 'focus', 'habit'],
  'learning': ['learning', 'education', 'study', 'memory', 'understanding', 'comprehension'],
  'ai': ['ai', 'artificial intelligence', 'machine learning', 'llm', 'gpt', 'neural network'],
  'writing': ['writing', 'content', 'blog', 'article', 'draft', 'edit'],
  'research': ['research', 'study', 'analysis', 'data', 'experiment', 'paper'],
  'creativity': ['creative', 'idea', 'innovation', 'design', 'brainstorm', 'inspiration'],
  'technology': ['tech', 'software', 'code', 'programming', 'development', 'app'],
  'business': ['business', 'startup', 'entrepreneur', 'strategy', 'growth', 'revenue'],
  'psychology': ['psychology', 'mindset', 'behavior', 'cognitive', 'mental', 'emotion'],
  'philosophy': ['philosophy', 'thinking', 'wisdom', 'existential', 'meaning', 'purpose'],
};

export const aiService = {
  // Generate a concise summary of content
  summarize: async (content: string): Promise<string> => {
    await simulateDelay(800); // Simulate API latency
    
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
    
    if (sentences.length <= 2) {
      return content.trim();
    }

    // Extract key sentences (first and longest)
    const firstSentence = sentences[0].trim();
    const longestSentence = sentences.reduce((a, b) => a.length > b.length ? a : b).trim();
    
    if (content.toLowerCase().includes('method') || content.toLowerCase().includes('technique')) {
      return `A methodology for ${firstSentence.toLowerCase()}. ${longestSentence}.`;
    }
    
    if (content.toLowerCase().includes('idea') || content.toLowerCase().includes('concept')) {
      return `Concept: ${firstSentence}. Key insight: ${longestSentence}.`;
    }

    return `${firstSentence}. ${longestSentence.split(' ').slice(0, 15).join(' ')}...`;
  },

  // Auto-generate tags based on content
  autoTag: async (content: string, title: string): Promise<string[]> => {
    await simulateDelay(600);
    
    const text = `${title} ${content}`.toLowerCase();
    const suggestedTags: string[] = [];

    // Match against tag patterns
    for (const [tag, keywords] of Object.entries(tagPatterns)) {
      if (keywords.some(keyword => text.includes(keyword))) {
        suggestedTags.push(tag);
      }
    }

    // Extract potential tags from common phrases
    if (text.includes('second brain')) suggestedTags.push('second-brain');
    if (text.includes('knowledge')) suggestedTags.push('knowledge-management');
    if (text.includes('note')) suggestedTags.push('note-taking');
    if (text.includes('zettelkasten')) suggestedTags.push('zettelkasten');
    if (text.includes('para')) suggestedTags.push('para');

    // Remove duplicates and limit to 5 tags
    return [...new Set(suggestedTags)].slice(0, 5);
  },

  // Conversational query - answer questions based on knowledge base
  query: async (question: string, knowledgeBase: KnowledgeItem[]): Promise<AIQueryResult> => {
    await simulateDelay(1200);

    const lowerQuestion = question.toLowerCase();
    
    // Find relevant items based on keyword matching
    const relevantItems = knowledgeBase.filter(item => {
      const text = `${item.title} ${item.content} ${item.tags.join(' ')}`.toLowerCase();
      const keywords = lowerQuestion.split(/\s+/).filter(w => w.length > 3);
      return keywords.some(kw => text.includes(kw));
    }).slice(0, 3);

    // Generate answer based on question type and relevant items
    let answer = '';
    let confidence = 0.7;

    if (lowerQuestion.includes('what is') || lowerQuestion.includes('what are')) {
      if (relevantItems.length > 0) {
        const item = relevantItems[0];
        answer = `Based on your note "${item.title}": ${item.summary || item.content.slice(0, 200)}...`;
        confidence = 0.85;
      } else {
        answer = "I couldn't find specific information about that in your knowledge base. Try adding a note about this topic!";
        confidence = 0.3;
      }
    } else if (lowerQuestion.includes('how to') || lowerQuestion.includes('how do')) {
      const methods = relevantItems.filter(i => 
        i.content.toLowerCase().includes('step') || 
        i.content.toLowerCase().includes('method') ||
        i.content.toLowerCase().includes('technique')
      );
      
      if (methods.length > 0) {
        answer = `Here are some methods from your notes:\n\n${methods.map(m => `• ${m.title}: ${m.summary || m.content.slice(0, 100)}...`).join('\n\n')}`;
        confidence = 0.8;
      } else {
        answer = "I found some related notes but no specific methods. Would you like me to help you create a process note?";
        confidence = 0.5;
      }
    } else if (lowerQuestion.includes('summarize') || lowerQuestion.includes('overview')) {
      const topics = [...new Set(relevantItems.flatMap(i => i.tags))].slice(0, 5);
      answer = `Based on ${relevantItems.length} relevant notes, here are the key themes: ${topics.join(', ')}. The main concepts include: ${relevantItems.map(i => i.title).join(', ')}.`;
      confidence = 0.75;
    } else {
      // General query
      if (relevantItems.length > 0) {
        answer = `I found ${relevantItems.length} relevant items in your knowledge base. The most relevant is "${relevantItems[0].title}" which discusses: ${relevantItems[0].summary || relevantItems[0].content.slice(0, 150)}...`;
        confidence = 0.7;
      } else {
        answer = "I don't have enough information in your knowledge base to answer that question accurately. Try capturing more content about this topic!";
        confidence = 0.2;
      }
    }

    return {
      answer,
      sources: relevantItems,
      confidence,
      suggestedTags: relevantItems.length > 0 ? relevantItems[0].tags.slice(0, 3) : undefined,
    };
  },

  // Suggest related items based on content similarity
  suggestRelated: async (item: KnowledgeItem, knowledgeBase: KnowledgeItem[]): Promise<KnowledgeItem[]> => {
    await simulateDelay(500);

    const itemText = `${item.title} ${item.content} ${item.tags.join(' ')}`.toLowerCase();
    
    return knowledgeBase
      .filter(other => other.id !== item.id)
      .map(other => {
        const otherText = `${other.title} ${other.content} ${other.tags.join(' ')}`.toLowerCase();
        const commonTags = item.tags.filter(tag => other.tags.includes(tag)).length;
        const commonWords = itemText.split(/\s+/).filter(word => 
          word.length > 4 && otherText.includes(word)
        ).length;
        return { item: other, score: commonTags * 2 + commonWords };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
      .map(result => result.item);
  },

  // Extract key insights from content
  extractInsights: async (content: string): Promise<string[]> => {
    await simulateDelay(700);

    const insights: string[] = [];
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 20);

    // Look for insight patterns
    for (const sentence of sentences) {
      const lower = sentence.toLowerCase();
      if (
        lower.includes('important') ||
        lower.includes('key') ||
        lower.includes('essential') ||
        lower.includes('critical') ||
        lower.includes('fundamental') ||
        lower.includes('crucial') ||
        lower.includes('significant')
      ) {
        insights.push(sentence.trim());
      }
    }

    // If no explicit insights found, take the first substantial sentence
    if (insights.length === 0 && sentences.length > 0) {
      insights.push(sentences[0].trim());
    }

    return insights.slice(0, 3);
  },

  // Classify content type
  classifyType: async (content: string, title: string): Promise<KnowledgeType> => {
    await simulateDelay(400);

    const text = `${title} ${content}`.toLowerCase();

    if (text.includes('http') || text.includes('www') || text.includes('article') || text.includes('blog')) {
      return 'article';
    }
    if (text.includes('idea') || text.includes('concept') || text.includes('what if')) {
      return 'idea';
    }
    if (text.includes('insight') || text.includes('realization') || text.includes('discovered')) {
      return 'insight';
    }
    if (text.includes('note') || text.includes('summary') || text.includes('key points')) {
      return 'note';
    }

    return 'note';
  },
};

export default aiService;
