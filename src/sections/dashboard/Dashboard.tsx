import { useState, useEffect } from 'react';
import { 
  Brain, 
  Search, 
  Plus, 
  Filter, 
  Grid3X3, 
  List, 
  Sparkles, 
  MessageSquare, 
  X,
  ArrowLeft,
  BookOpen,
  FileText,
  Lightbulb,
  Link2,
  Tag,
  MoreVertical,
  Trash2,
  Bot,
  Command
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { db } from '@/lib/db';
import { aiService } from '@/lib/ai';
import type { KnowledgeItem, KnowledgeType, CreateKnowledgeInput } from '@/types';
import GlassCard from '@/components/animations/GlassCard';

interface DashboardProps {
  onBack: () => void;
  onViewDocs: () => void;
}

export default function Dashboard({ onBack, onViewDocs }: DashboardProps) {
  const [items, setItems] = useState<KnowledgeItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<KnowledgeItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<KnowledgeType | 'all'>('all');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [allTags, setAllTags] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isAIChatOpen, setIsAIChatOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Load data
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      const [knowledgeItems, tags] = await Promise.all([
        db.knowledge.getAll(),
        db.knowledge.getAllTags(),
      ]);
      setItems(knowledgeItems);
      setFilteredItems(knowledgeItems);
      setAllTags(tags);
      setIsLoading(false);
    };

    loadData();
  }, []);

  // Filter items
  useEffect(() => {
    let filtered = items;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (item) =>
          item.title.toLowerCase().includes(query) ||
          item.content.toLowerCase().includes(query) ||
          item.tags.some((tag) => tag.toLowerCase().includes(query))
      );
    }

    if (selectedType !== 'all') {
      filtered = filtered.filter((item) => item.type === selectedType);
    }

    if (selectedTags.length > 0) {
      filtered = filtered.filter((item) =>
        selectedTags.some((tag) => item.tags.includes(tag))
      );
    }

    setFilteredItems(filtered);
  }, [items, searchQuery, selectedType, selectedTags]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + K - Command palette
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen(true);
      }
      // Cmd/Ctrl + N - New note
      if ((e.metaKey || e.ctrlKey) && e.key === 'n') {
        e.preventDefault();
        setIsCreateModalOpen(true);
      }
      // Cmd/Ctrl + / - AI Chat
      if ((e.metaKey || e.ctrlKey) && e.key === '/') {
        e.preventDefault();
        setIsAIChatOpen(true);
      }
      // Escape - Close modals
      if (e.key === 'Escape') {
        setIsCreateModalOpen(false);
        setIsAIChatOpen(false);
        setIsCommandPaletteOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleCreateItem = async (input: CreateKnowledgeInput) => {
    const newItem = await db.knowledge.create(input);
    setItems([newItem, ...items]);
    setIsCreateModalOpen(false);

    // Auto-summarize if enabled
    if (input.content.length > 100) {
      const summary = await aiService.summarize(input.content);
      await db.knowledge.update(newItem.id, { summary });
      setItems((prev) =>
        prev.map((item) =>
          item.id === newItem.id ? { ...item, summary } : item
        )
      );
    }
  };

  const handleDeleteItem = async (id: string) => {
    await db.knowledge.delete(id);
    setItems(items.filter((item) => item.id !== id));
  };

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-black/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Left */}
            <div className="flex items-center gap-4">
              <button
                onClick={onBack}
                className="p-2 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-500 flex items-center justify-center">
                  <Brain className="w-5 h-5 text-white" />
                </div>
                <span className="font-semibold text-white">Second Brain</span>
              </div>
            </div>

            {/* Center - Search */}
            <div className="hidden md:flex flex-1 max-w-md mx-8">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="text"
                  placeholder="Search your knowledge... (Cmd+K)"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500/50 transition-colors"
                />
              </div>
            </div>

            {/* Right */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsAIChatOpen(true)}
                className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-lg bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 transition-colors"
              >
                <Bot className="w-4 h-4" />
                <span className="text-sm">Ask AI</span>
              </button>
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-500 transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline text-sm">New</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          {/* Type filters */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
            {[
              { value: 'all', label: 'All', icon: null },
              { value: 'note', label: 'Notes', icon: FileText },
              { value: 'article', label: 'Articles', icon: BookOpen },
              { value: 'insight', label: 'Insights', icon: Lightbulb },
              { value: 'link', label: 'Links', icon: Link2 },
            ].map((type) => {
              const Icon = type.icon;
              return (
                <button
                  key={type.value}
                  onClick={() => setSelectedType(type.value as KnowledgeType | 'all')}
                  className={cn(
                    'flex items-center gap-2 px-4 py-2 rounded-lg text-sm whitespace-nowrap transition-colors',
                    selectedType === type.value
                      ? 'bg-indigo-500 text-white'
                      : 'bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white'
                  )}
                >
                  {Icon && <Icon className="w-4 h-4" />}
                  {type.label}
                </button>
              );
            })}
          </div>

          {/* View toggle */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode('grid')}
              className={cn(
                'p-2 rounded-lg transition-colors',
                viewMode === 'grid'
                  ? 'bg-white/10 text-white'
                  : 'text-gray-500 hover:text-white'
              )}
            >
              <Grid3X3 className="w-5 h-5" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={cn(
                'p-2 rounded-lg transition-colors',
                viewMode === 'list'
                  ? 'bg-white/10 text-white'
                  : 'text-gray-500 hover:text-white'
              )}
            >
              <List className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tags filter */}
        {allTags.length > 0 && (
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar mb-8 pb-2">
            <Filter className="w-4 h-4 text-gray-500 flex-shrink-0" />
            {allTags.map((tag) => (
              <button
                key={tag}
                onClick={() => toggleTag(tag)}
                className={cn(
                  'flex items-center gap-1 px-3 py-1 rounded-full text-xs whitespace-nowrap transition-colors',
                  selectedTags.includes(tag)
                    ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                    : 'bg-white/5 text-gray-400 border border-white/10 hover:bg-white/10'
                )}
              >
                <Tag className="w-3 h-3" />
                {tag}
              </button>
            ))}
          </div>
        )}

        {/* Results count */}
        <div className="flex items-center justify-between mb-6">
          <p className="text-gray-500 text-sm">
            {filteredItems.length} {filteredItems.length === 1 ? 'item' : 'items'}
          </p>
          <button
            onClick={onViewDocs}
            className="text-sm text-indigo-400 hover:text-indigo-300 transition-colors"
          >
            View API Docs →
          </button>
        </div>

        {/* Items grid/list */}
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full" />
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4">
              <Search className="w-8 h-8 text-gray-500" />
            </div>
            <h3 className="text-white font-medium mb-2">No items found</h3>
            <p className="text-gray-500 text-sm mb-4">
              Try adjusting your filters or create a new item
            </p>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm hover:bg-indigo-500 transition-colors"
            >
              Create your first item
            </button>
          </div>
        ) : (
          <div
            className={cn(
              viewMode === 'grid'
                ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'
                : 'space-y-4'
            )}
          >
            {filteredItems.map((item) => (
              <KnowledgeCard
                key={item.id}
                item={item}
                viewMode={viewMode}
                onDelete={handleDeleteItem}
              />
            ))}
          </div>
        )}
      </div>

      {/* Create Modal */}
      {isCreateModalOpen && (
        <CreateModal
          onClose={() => setIsCreateModalOpen(false)}
          onCreate={handleCreateItem}
          availableTags={allTags}
        />
      )}

      {/* AI Chat */}
      {isAIChatOpen && (
        <AIChatModal
          onClose={() => setIsAIChatOpen(false)}
          knowledgeBase={items}
        />
      )}

      {/* Command Palette */}
      {isCommandPaletteOpen && (
        <CommandPalette
          onClose={() => setIsCommandPaletteOpen(false)}
          onCreate={() => {
            setIsCommandPaletteOpen(false);
            setIsCreateModalOpen(true);
          }}
          onAIChat={() => {
            setIsCommandPaletteOpen(false);
            setIsAIChatOpen(true);
          }}
          onViewDocs={() => {
            setIsCommandPaletteOpen(false);
            onViewDocs();
          }}
        />
      )}
    </div>
  );
}

// Knowledge Card Component
interface KnowledgeCardProps {
  item: KnowledgeItem;
  viewMode: 'grid' | 'list';
  onDelete: (id: string) => void;
}

function KnowledgeCard({ item, viewMode, onDelete }: KnowledgeCardProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const typeIcons: Record<KnowledgeType, typeof FileText> = {
    note: FileText,
    article: BookOpen,
    insight: Lightbulb,
    link: Link2,
    idea: Sparkles,
  };

  const typeColors: Record<KnowledgeType, string> = {
    note: 'text-blue-400',
    article: 'text-green-400',
    insight: 'text-yellow-400',
    link: 'text-purple-400',
    idea: 'text-pink-400',
  };

  const Icon = typeIcons[item.type];
  const colorClass = typeColors[item.type];

  if (viewMode === 'list') {
    return (
      <GlassCard className="p-4">
        <div className="flex items-center gap-4">
          <div className={cn('w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center', colorClass)}>
            <Icon className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-white font-medium truncate">{item.title}</h3>
            <p className="text-gray-500 text-sm truncate">
              {item.summary || item.content.slice(0, 100)}...
            </p>
          </div>
          <div className="flex items-center gap-2">
            {item.tags.slice(0, 2).map((tag) => (
              <span
                key={tag}
                className="px-2 py-1 rounded-full text-xs bg-white/5 text-gray-400"
              >
                {tag}
              </span>
            ))}
            <span className="text-gray-600 text-xs">
              {item.createdAt.toLocaleDateString()}
            </span>
          </div>
        </div>
      </GlassCard>
    );
  }

  return (
    <GlassCard className="p-6 group">
      <div className="flex items-start justify-between mb-4">
        <div className={cn('w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center', colorClass)}>
          <Icon className="w-5 h-5" />
        </div>
        <div className="relative">
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="p-2 rounded-lg hover:bg-white/5 text-gray-500 hover:text-white transition-colors"
          >
            <MoreVertical className="w-4 h-4" />
          </button>
          {isMenuOpen && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setIsMenuOpen(false)}
              />
              <div className="absolute right-0 top-full mt-1 w-40 rounded-lg bg-[#1a1a1a] border border-white/10 shadow-xl z-20">
                <button
                  onClick={() => {
                    onDelete(item.id);
                    setIsMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-2 px-4 py-2 text-red-400 hover:bg-white/5 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      <h3 className="text-white font-medium mb-2 line-clamp-2">{item.title}</h3>
      <p className="text-gray-500 text-sm mb-4 line-clamp-3">
        {item.summary || item.content.slice(0, 150)}...
      </p>

      {item.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-4">
          {item.tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="px-2 py-1 rounded-full text-xs bg-white/5 text-gray-400"
            >
              {tag}
            </span>
          ))}
          {item.tags.length > 3 && (
            <span className="px-2 py-1 rounded-full text-xs bg-white/5 text-gray-500">
              +{item.tags.length - 3}
            </span>
          )}
        </div>
      )}

      <div className="flex items-center justify-between text-xs text-gray-600">
        <span>{item.createdAt.toLocaleDateString()}</span>
        {item.metadata?.readingTime && (
          <span>{item.metadata.readingTime} min read</span>
        )}
      </div>
    </GlassCard>
  );
}

// Create Modal Component
interface CreateModalProps {
  onClose: () => void;
  onCreate: (input: CreateKnowledgeInput) => void;
  availableTags: string[];
}

function CreateModal({ onClose, onCreate, availableTags }: CreateModalProps) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [type, setType] = useState<KnowledgeType>('note');
  const [tags, setTags] = useState<string[]>([]);
  const [sourceUrl, setSourceUrl] = useState('');
  const [isGeneratingTags, setIsGeneratingTags] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onCreate({
      title,
      content,
      type,
      tags,
      sourceUrl: sourceUrl || undefined,
    });
  };

  const handleAutoTag = async () => {
    if (!title && !content) return;
    setIsGeneratingTags(true);
    const suggestedTags = await aiService.autoTag(content, title);
    setTags([...new Set([...tags, ...suggestedTags])]);
    setIsGeneratingTags(false);
  };

  const toggleTag = (tag: string) => {
    setTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-auto rounded-2xl bg-[#0a0a0a] border border-white/10">
        <div className="flex items-center justify-between p-6 border-b border-white/5">
          <h2 className="text-xl font-semibold text-white">Capture Knowledge</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-white/5 text-gray-500 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Type selector */}
          <div className="flex gap-2">
            {(['note', 'article', 'insight', 'link', 'idea'] as KnowledgeType[]).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setType(t)}
                className={cn(
                  'px-4 py-2 rounded-lg text-sm capitalize transition-colors',
                  type === t
                    ? 'bg-indigo-500 text-white'
                    : 'bg-white/5 text-gray-400 hover:bg-white/10'
                )}
              >
                {t}
              </button>
            ))}
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm text-gray-400 mb-2">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter a title..."
              className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500/50 transition-colors"
              required
            />
          </div>

          {/* Content */}
          <div>
            <label className="block text-sm text-gray-400 mb-2">Content</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Capture your thoughts, ideas, or insights..."
              rows={6}
              className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500/50 transition-colors resize-none"
              required
            />
          </div>

          {/* Source URL */}
          <div>
            <label className="block text-sm text-gray-400 mb-2">Source URL (optional)</label>
            <input
              type="url"
              value={sourceUrl}
              onChange={(e) => setSourceUrl(e.target.value)}
              placeholder="https://..."
              className="w-full px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500/50 transition-colors"
            />
          </div>

          {/* Tags */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm text-gray-400">Tags</label>
              <button
                type="button"
                onClick={handleAutoTag}
                disabled={isGeneratingTags || (!title && !content)}
                className="flex items-center gap-1 text-sm text-indigo-400 hover:text-indigo-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Sparkles className="w-3 h-3" />
                {isGeneratingTags ? 'Generating...' : 'Auto-tag'}
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {availableTags.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggleTag(tag)}
                  className={cn(
                    'px-3 py-1 rounded-full text-sm transition-colors',
                    tags.includes(tag)
                      ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                      : 'bg-white/5 text-gray-400 border border-white/10 hover:bg-white/10'
                  )}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-white/5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-gray-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!title || !content}
              className="px-6 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// AI Chat Modal Component
interface AIChatModalProps {
  onClose: () => void;
  knowledgeBase: KnowledgeItem[];
}

function AIChatModal({ onClose, knowledgeBase }: AIChatModalProps) {
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState<{ type: 'user' | 'ai'; content: string; sources?: KnowledgeItem[] }[]>([
    { type: 'ai', content: 'Hello! I\'m your AI knowledge assistant. Ask me anything about your notes and I\'ll help you find relevant information.' },
  ]);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || isLoading) return;

    const userQuery = query.trim();
    setQuery('');
    setMessages((prev) => [...prev, { type: 'user', content: userQuery }]);
    setIsLoading(true);

    const result = await aiService.query(userQuery, knowledgeBase);

    setMessages((prev) => [
      ...prev,
      { type: 'ai', content: result.answer, sources: result.sources },
    ]);
    setIsLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-2xl h-[80vh] sm:h-[600px] rounded-2xl bg-[#0a0a0a] border border-white/10 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/5">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center">
              <Bot className="w-4 h-4 text-indigo-400" />
            </div>
            <div>
              <h3 className="text-white font-medium">AI Knowledge Assistant</h3>
              <p className="text-xs text-gray-500">Powered by your notes</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-white/5 text-gray-500 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-auto p-4 space-y-4">
          {messages.map((message, index) => (
            <div
              key={index}
              className={cn(
                'flex gap-3',
                message.type === 'user' ? 'justify-end' : 'justify-start'
              )}
            >
              {message.type === 'ai' && (
                <div className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center flex-shrink-0">
                  <Bot className="w-4 h-4 text-indigo-400" />
                </div>
              )}
              <div
                className={cn(
                  'max-w-[80%] p-4 rounded-2xl',
                  message.type === 'user'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-white/5 text-gray-300'
                )}
              >
                <p className="whitespace-pre-wrap">{message.content}</p>
                {message.sources && message.sources.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-white/10">
                    <p className="text-xs text-gray-500 mb-2">Sources:</p>
                    <div className="flex flex-wrap gap-2">
                      {message.sources.map((source) => (
                        <span
                          key={source.id}
                          className="px-2 py-1 rounded-lg bg-white/10 text-xs text-gray-400"
                        >
                          {source.title}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center">
                <Bot className="w-4 h-4 text-indigo-400" />
              </div>
              <div className="bg-white/5 p-4 rounded-2xl">
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Input */}
        <form onSubmit={handleSubmit} className="p-4 border-t border-white/5">
          <div className="flex gap-2">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ask about your knowledge..."
              className="flex-1 px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500/50 transition-colors"
            />
            <button
              type="submit"
              disabled={!query.trim() || isLoading}
              className="px-4 py-3 rounded-lg bg-indigo-600 text-white hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <MessageSquare className="w-5 h-5" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Command Palette Component
interface CommandPaletteProps {
  onClose: () => void;
  onCreate: () => void;
  onAIChat: () => void;
  onViewDocs: () => void;
}

function CommandPalette({ onClose, onCreate, onAIChat, onViewDocs }: CommandPaletteProps) {
  const [search, setSearch] = useState('');

  const commands = [
    { id: 'new', label: 'New Knowledge Item', shortcut: '⌘N', action: onCreate, icon: Plus },
    { id: 'ai', label: 'Ask AI Assistant', shortcut: '⌘/', action: onAIChat, icon: Bot },
    { id: 'docs', label: 'View Documentation', shortcut: '', action: onViewDocs, icon: BookOpen },
    { id: 'back', label: 'Back to Landing', shortcut: '', action: onClose, icon: ArrowLeft },
  ];

  const filteredCommands = commands.filter((cmd) =>
    cmd.label.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh]">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg rounded-xl bg-[#0a0a0a] border border-white/10 shadow-2xl overflow-hidden">
        {/* Search */}
        <div className="flex items-center gap-3 p-4 border-b border-white/5">
          <Command className="w-5 h-5 text-gray-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Type a command..."
            className="flex-1 bg-transparent text-white placeholder-gray-500 focus:outline-none"
            autoFocus
          />
          <span className="text-xs text-gray-500">ESC to close</span>
        </div>

        {/* Commands */}
        <div className="max-h-80 overflow-auto py-2">
          {filteredCommands.map((command) => {
            const Icon = command.icon;
            return (
              <button
                key={command.id}
                onClick={() => {
                  command.action();
                  onClose();
                }}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors"
              >
                <Icon className="w-5 h-5 text-gray-500" />
                <span className="flex-1 text-left text-white">{command.label}</span>
                {command.shortcut && (
                  <span className="text-xs text-gray-500">{command.shortcut}</span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
