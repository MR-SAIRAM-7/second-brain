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
  Command,
  Upload,
  Globe,
  Hash,
  CalendarDays,
  Clock3,
  Layers3,
  TrendingUp,
  ChevronRight,
  ExternalLink
} from 'lucide-react';
import { cn } from '@/lib/utils';
import axios from 'axios';
import type { KnowledgeItem, KnowledgeType, CreateKnowledgeInput } from '@/types';
import GlassCard from '@/components/animations/GlassCard';
import { RichTextEditor } from '@/components/ui/RichTextEditor';

const API_URL = 'http://localhost:3001/api';

const htmlToPlainText = (content: string): string => {
  if (!content) return '';

  if (typeof window === 'undefined') {
    return content.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  }

  const parser = new DOMParser();
  const text = parser.parseFromString(content, 'text/html').body.textContent || '';
  return text.replace(/\s+/g, ' ').trim();
};

const getContentPreview = (content: string, length = 140): string => {
  const plainText = htmlToPlainText(content);
  if (!plainText) return '';
  return plainText.length > length ? `${plainText.slice(0, length)}...` : plainText;
};

const sanitizeRichHtml = (content: string): string => {
  if (!content) return '';

  if (typeof window === 'undefined') {
    return content;
  }

  const parser = new DOMParser();
  const doc = parser.parseFromString(content, 'text/html');

  doc.querySelectorAll('script, style, iframe, object, embed').forEach((node) => node.remove());

  doc.body.querySelectorAll('*').forEach((element) => {
    [...element.attributes].forEach((attr) => {
      const name = attr.name.toLowerCase();
      const value = attr.value.toLowerCase();

      if (name.startsWith('on')) {
        element.removeAttribute(attr.name);
      }

      if ((name === 'href' || name === 'src') && value.startsWith('javascript:')) {
        element.removeAttribute(attr.name);
      }
    });
  });

  return doc.body.innerHTML;
};

const formatRelativeDate = (date: Date): string => {
  const now = new Date();
  const diffMs = now.getTime() - new Date(date).getTime();
  const dayMs = 1000 * 60 * 60 * 24;
  const days = Math.floor(diffMs / dayMs);

  if (days <= 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
  if (days < 365) return `${Math.floor(days / 30)} months ago`;
  return `${Math.floor(days / 365)} years ago`;
};

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
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'title'>('newest');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isAIChatOpen, setIsAIChatOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<KnowledgeItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load data
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const response = await axios.get(`${API_URL}/notes`);
        // Map _id to id to match the expected KnowledgeItem frontend type if needed
        const fetchedItems = response.data.map((item: any) => ({
           ...item,
           id: item._id,
           createdAt: new Date(item.createdAt)
        }));
        
        // Extract unique tags from fetched items
        const tags = Array.from(new Set(fetchedItems.flatMap((item: any) => item.tags)));

        setItems(fetchedItems);
        setFilteredItems(fetchedItems);
        setAllTags(tags as string[]);
      } catch (error) {
        console.error("Error fetching notes:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  // Filter items
  useEffect(() => {
    let filtered = [...items];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (item) =>
          item.title.toLowerCase().includes(query) ||
          htmlToPlainText(item.content).toLowerCase().includes(query) ||
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

    if (sortBy === 'newest') {
      filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } else if (sortBy === 'oldest') {
      filtered.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    } else {
      filtered.sort((a, b) => a.title.localeCompare(b.title));
    }

    setFilteredItems(filtered);
  }, [items, searchQuery, selectedType, selectedTags, sortBy]);

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

  const handleCreateItem = async (input: CreateKnowledgeInput | FormData) => {
    try {
      // If we're passing FormData (includes file), let Axios set the correct multipart header
      const isFormData = input instanceof FormData;
      
      const response = await axios.post(`${API_URL}/notes`, input, {
         headers: {
            'Content-Type': isFormData ? 'multipart/form-data' : 'application/json'
         }
      });
      
      const createdItem = {
         ...response.data,
         id: response.data._id,
         createdAt: new Date(response.data.createdAt)
      };

      setItems([createdItem, ...items]);
      setIsCreateModalOpen(false);
      
      // Update tags list if new tags were generated by AI
      if (createdItem.tags && createdItem.tags.length > 0) {
         setAllTags((prevTags) => Array.from(new Set([...prevTags, ...createdItem.tags])));
      }
    } catch (error) {
       console.error("Error creating note:", error);
       alert("Failed to create item.");
    }
  };

  const handleDeleteItem = async (id: string) => {
    try {
      await axios.delete(`${API_URL}/notes/${id}`);
      setItems(items.filter((item) => item.id !== id));
    } catch (error) {
      console.error("Error deleting note:", error);
    }
  };

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);

  const recentItems = items.filter((item) => new Date(item.createdAt) >= weekAgo).length;
  const totalWords = items.reduce((sum, item) => {
    const plain = htmlToPlainText(item.content);
    if (!plain) return sum;
    return sum + plain.split(/\s+/).length;
  }, 0);
  const estimatedReadingHours = (totalWords / 220 / 60).toFixed(1);
  const hasActiveFilters = Boolean(searchQuery || selectedType !== 'all' || selectedTags.length > 0);

  return (
    <div className="relative min-h-screen bg-[#06080f]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_12%_18%,rgba(20,184,166,0.18),transparent_28%),radial-gradient(circle_at_90%_8%,rgba(99,102,241,0.24),transparent_32%),radial-gradient(circle_at_80%_78%,rgba(14,165,233,0.18),transparent_34%)]" />

      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-white/10 bg-black/70 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between min-h-[4.25rem] py-2 gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <button
                onClick={onBack}
                className="p-2 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-cyan-500 flex items-center justify-center shadow-[0_0_20px_rgba(56,189,248,0.35)]">
                  <Brain className="w-5 h-5 text-white" />
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-white leading-tight">Second Brain</p>
                  <p className="text-xs text-gray-400 hidden sm:block">Compound your knowledge every day</p>
                </div>
              </div>
            </div>

            <div className="hidden md:flex flex-1 max-w-xl mx-2 lg:mx-8">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="text"
                  placeholder="Search notes, concepts, or tags..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-24 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-cyan-400/50 transition-colors"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] text-gray-500 border border-white/10 rounded px-1.5 py-0.5">
                  Ctrl/Cmd + K
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsAIChatOpen(true)}
                className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-xl bg-cyan-500/10 text-cyan-300 border border-cyan-400/20 hover:bg-cyan-500/15 transition-colors"
              >
                <Bot className="w-4 h-4" />
                <span className="text-sm">Ask AI</span>
              </button>
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 text-white hover:bg-indigo-500 transition-colors shadow-[0_8px_30px_rgba(99,102,241,0.35)]"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline text-sm">New Note</span>
              </button>
            </div>
          </div>
          <div className="md:hidden pb-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="text"
                placeholder="Search your knowledge"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-cyan-400/50 transition-colors"
              />
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-10">
        <section className="mb-8 rounded-2xl border border-white/10 bg-[linear-gradient(130deg,rgba(99,102,241,0.22),rgba(8,47,73,0.32)_45%,rgba(15,23,42,0.6))] p-6 sm:p-8 overflow-hidden">
          <div className="absolute pointer-events-none -right-16 -top-16 w-52 h-52 rounded-full bg-cyan-400/20 blur-3xl" />
          <div className="relative flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-cyan-300 mb-2">Knowledge Dashboard</p>
              <h1 className="text-2xl sm:text-3xl font-semibold text-white mb-2">Build a sharper second brain</h1>
              <p className="text-sm sm:text-base text-gray-300 max-w-2xl">
                Capture quickly, filter deeply, and revisit your notes with context-rich views built for focused thinking.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white text-slate-900 text-sm font-medium hover:bg-slate-200 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Capture now
              </button>
              <button
                onClick={onViewDocs}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 border border-white/20 text-white text-sm hover:bg-white/15 transition-colors"
              >
                View docs
                <ExternalLink className="w-4 h-4" />
              </button>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-8">
          <GlassCard className="p-4 sm:p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs uppercase tracking-wide text-gray-500">Total Notes</p>
                <p className="text-2xl sm:text-3xl font-semibold text-white mt-1">{items.length}</p>
              </div>
              <div className="w-9 h-9 rounded-lg bg-indigo-500/15 text-indigo-300 flex items-center justify-center">
                <Layers3 className="w-4 h-4" />
              </div>
            </div>
          </GlassCard>

          <GlassCard className="p-4 sm:p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs uppercase tracking-wide text-gray-500">Added This Week</p>
                <p className="text-2xl sm:text-3xl font-semibold text-white mt-1">{recentItems}</p>
              </div>
              <div className="w-9 h-9 rounded-lg bg-emerald-500/15 text-emerald-300 flex items-center justify-center">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
          </GlassCard>

          <GlassCard className="p-4 sm:p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs uppercase tracking-wide text-gray-500">Tag Library</p>
                <p className="text-2xl sm:text-3xl font-semibold text-white mt-1">{allTags.length}</p>
              </div>
              <div className="w-9 h-9 rounded-lg bg-cyan-500/15 text-cyan-300 flex items-center justify-center">
                <Tag className="w-4 h-4" />
              </div>
            </div>
          </GlassCard>

          <GlassCard className="p-4 sm:p-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs uppercase tracking-wide text-gray-500">Est. Reading Bank</p>
                <p className="text-2xl sm:text-3xl font-semibold text-white mt-1">{estimatedReadingHours}h</p>
              </div>
              <div className="w-9 h-9 rounded-lg bg-amber-500/15 text-amber-300 flex items-center justify-center">
                <Clock3 className="w-4 h-4" />
              </div>
            </div>
          </GlassCard>
        </section>

        <section className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4 mb-5">
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
            {[
              { value: 'all', label: 'All', icon: Layers3 },
              { value: 'note', label: 'Notes', icon: FileText },
              { value: 'article', label: 'Articles', icon: BookOpen },
              { value: 'insight', label: 'Insights', icon: Lightbulb },
              { value: 'link', label: 'Links', icon: Link2 },
              { value: 'idea', label: 'Ideas', icon: Sparkles },
            ].map((type) => {
              const Icon = type.icon;
              return (
                <button
                  key={type.value}
                  onClick={() => setSelectedType(type.value as KnowledgeType | 'all')}
                  className={cn(
                    'flex items-center gap-2 px-4 py-2 rounded-xl text-sm whitespace-nowrap border transition-colors',
                    selectedType === type.value
                      ? 'bg-indigo-500/20 text-indigo-200 border-indigo-500/40'
                      : 'bg-white/5 text-gray-400 border-white/10 hover:bg-white/10 hover:text-white'
                  )}
                >
                  <Icon className="w-4 h-4" />
                  {type.label}
                </button>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-2 px-2 py-1 rounded-xl border border-white/10 bg-white/5">
              <span className="text-xs text-gray-400 px-1">Sort</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'newest' | 'oldest' | 'title')}
                className="bg-transparent text-sm text-white focus:outline-none pr-1"
              >
                <option value="newest" className="bg-slate-900">Newest first</option>
                <option value="oldest" className="bg-slate-900">Oldest first</option>
                <option value="title" className="bg-slate-900">Title A-Z</option>
              </select>
            </div>

            <div className="flex items-center gap-1 p-1 rounded-xl border border-white/10 bg-white/5">
              <button
                onClick={() => setViewMode('grid')}
                className={cn(
                  'p-2 rounded-lg transition-colors',
                  viewMode === 'grid'
                    ? 'bg-white/15 text-white'
                    : 'text-gray-500 hover:text-white'
                )}
              >
                <Grid3X3 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={cn(
                  'p-2 rounded-lg transition-colors',
                  viewMode === 'list'
                    ? 'bg-white/15 text-white'
                    : 'text-gray-500 hover:text-white'
                )}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </section>

        {allTags.length > 0 && (
          <section className="mb-6 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-3 sm:px-4">
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
              <div className="flex items-center gap-1 text-xs text-gray-500 whitespace-nowrap mr-1">
                <Filter className="w-3.5 h-3.5" />
                Tags
              </div>
              {allTags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => toggleTag(tag)}
                  className={cn(
                    'flex items-center gap-1 px-3 py-1 rounded-full text-xs whitespace-nowrap border transition-colors',
                    selectedTags.includes(tag)
                      ? 'bg-cyan-500/15 text-cyan-300 border-cyan-400/35'
                      : 'bg-white/5 text-gray-400 border-white/10 hover:bg-white/10'
                  )}
                >
                  <Tag className="w-3 h-3" />
                  {tag}
                </button>
              ))}
            </div>
          </section>
        )}

        <section className="flex flex-wrap items-center justify-between gap-3 mb-5">
          <div className="text-sm text-gray-400">
            <span className="text-white font-medium">{filteredItems.length}</span>{' '}
            {filteredItems.length === 1 ? 'item' : 'items'} shown
            {hasActiveFilters && <span className="text-gray-500"> from {items.length} total</span>}
          </div>
          <div className="flex items-center gap-3">
            {hasActiveFilters && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedType('all');
                  setSelectedTags([]);
                }}
                className="text-sm text-gray-300 hover:text-white transition-colors"
              >
                Clear filters
              </button>
            )}
            <button
              onClick={onViewDocs}
              className="inline-flex items-center gap-1 text-sm text-cyan-300 hover:text-cyan-200 transition-colors"
            >
              API Docs
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </section>

        {/* Items grid/list */}
        {isLoading ? (
          <div className="flex items-center justify-center h-72">
            <div className="animate-spin w-9 h-9 border-2 border-indigo-500 border-t-transparent rounded-full" />
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] text-center py-16 px-6">
            <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4">
              <Search className="w-8 h-8 text-gray-500" />
            </div>
            <h3 className="text-white font-medium mb-2">No notes match this view</h3>
            <p className="text-gray-500 text-sm mb-6">
              Adjust filters or capture something new to expand your knowledge graph.
            </p>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 text-white text-sm hover:bg-indigo-500 transition-colors"
            >
              Capture your first note
            </button>
          </div>
        ) : (
          <div
            className={cn(
              viewMode === 'grid'
                ? 'grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5'
                : 'space-y-3'
            )}
          >
            {filteredItems.map((item) => (
              <KnowledgeCard
                key={item.id}
                item={item}
                viewMode={viewMode}
                onDelete={handleDeleteItem}
                onOpen={setSelectedItem}
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

      {selectedItem && (
        <NoteDetailModal
          item={selectedItem}
          onClose={() => setSelectedItem(null)}
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
  onOpen: (item: KnowledgeItem) => void;
}

function KnowledgeCard({ item, viewMode, onDelete, onOpen }: KnowledgeCardProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const previewText = item.summary || getContentPreview(item.content, viewMode === 'list' ? 100 : 150);
  const relativeDate = formatRelativeDate(item.createdAt);
  const wordCount = htmlToPlainText(item.content).split(/\s+/).filter(Boolean).length;

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
      <GlassCard className="p-4 cursor-pointer" tiltAmount={6}>
        <div
          className="flex items-center gap-4"
          role="button"
          tabIndex={0}
          onClick={() => onOpen(item)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onOpen(item);
            }
          }}
        >
          <div className={cn('w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center', colorClass)}>
            <Icon className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-white font-medium truncate mb-1">{item.title}</h3>
            <p className="text-gray-500 text-sm truncate">
              {previewText}
            </p>
          </div>
          <div className="hidden lg:flex items-center gap-2">
            <span className="text-xs text-gray-500">{wordCount} words</span>
            <span className="text-gray-600 text-xs">{relativeDate}</span>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsMenuOpen(!isMenuOpen);
            }}
            className="p-2 rounded-lg hover:bg-white/5 text-gray-500 hover:text-white transition-colors"
          >
            <MoreVertical className="w-4 h-4" />
          </button>
          {isMenuOpen && (
            <div className="relative">
              <div
                className="fixed inset-0 z-10"
                onClick={() => setIsMenuOpen(false)}
              />
              <div className="absolute right-0 top-full mt-1 w-40 rounded-lg bg-[#1a1a1a] border border-white/10 shadow-xl z-20">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(item.id);
                    setIsMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-2 px-4 py-2 text-red-400 hover:bg-white/5 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </button>
              </div>
            </div>
          )}
          <ChevronRight className="w-4 h-4 text-gray-600" />
        </div>
      </GlassCard>
    );
  }

  return (
    <GlassCard className="p-5 group cursor-pointer" tiltAmount={8}>
      <article
        role="button"
        tabIndex={0}
        onClick={() => onOpen(item)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onOpen(item);
          }
        }}
      >
      <div className="flex items-start justify-between mb-4">
        <div className={cn('w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center', colorClass)}>
          <Icon className="w-5 h-5" />
        </div>
        <div className="flex items-center gap-2">
          <span className="px-2 py-1 rounded-full text-[11px] uppercase tracking-wide bg-white/5 text-gray-400 border border-white/10">
            {item.type}
          </span>
          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsMenuOpen(!isMenuOpen);
              }}
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
                    onClick={(e) => {
                      e.stopPropagation();
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
      </div>

      <h3 className="text-white font-medium mb-2 line-clamp-2 text-base">{item.title}</h3>
      <p className="text-gray-400 text-sm mb-4 line-clamp-3 min-h-[3.75rem]">
        {previewText}
      </p>

      {item.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-4">
          {item.tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="px-2 py-1 rounded-full text-xs bg-white/5 text-gray-400 border border-white/10"
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

      <div className="flex items-center justify-between text-xs text-gray-500">
        <span className="inline-flex items-center gap-1">
          <CalendarDays className="w-3 h-3" />
          {relativeDate}
        </span>
        <span>{item.metadata?.readingTime || Math.max(1, Math.ceil(wordCount / 220))} min read</span>
      </div>
      </article>
    </GlassCard>
  );
}

interface NoteDetailModalProps {
  item: KnowledgeItem;
  onClose: () => void;
}

function NoteDetailModal({ item, onClose }: NoteDetailModalProps) {
  const safeHtml = sanitizeRichHtml(item.content);
  const externalUrl = (item as any).sourceUrl || (item as any).url;
  const fileUrl = (item as any).fileUrl;
  const wordCount = htmlToPlainText(item.content).split(/\s+/).filter(Boolean).length;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full sm:max-w-4xl sm:max-h-[90vh] h-[100vh] sm:h-auto overflow-hidden sm:rounded-2xl border border-white/10 bg-[#0b0d12] shadow-2xl flex flex-col">
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-white/10 bg-[radial-gradient(circle_at_top_right,rgba(34,211,238,0.15),transparent_45%)]">
          <div className="min-w-0 pr-3">
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-1 rounded-full text-[11px] uppercase tracking-wide border border-white/15 bg-white/5 text-gray-300">
                {item.type}
              </span>
              <span className="text-xs text-gray-500">{formatRelativeDate(item.createdAt)}</span>
            </div>
            <h3 className="text-lg sm:text-xl text-white font-semibold truncate">{item.title}</h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-white/5 text-gray-500 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 sm:p-6 border-b border-white/5 flex flex-wrap gap-3 text-xs">
          <span className="px-2 py-1 rounded-lg bg-white/5 border border-white/10 text-gray-300">
            {wordCount} words
          </span>
          <span className="px-2 py-1 rounded-lg bg-white/5 border border-white/10 text-gray-300">
            {Math.max(1, Math.ceil(wordCount / 220))} min read
          </span>
          {externalUrl && (
            <a
              href={externalUrl}
              target="_blank"
              rel="noreferrer"
              className="px-2 py-1 rounded-lg bg-cyan-500/10 border border-cyan-400/30 text-cyan-300 hover:bg-cyan-500/20 transition-colors"
            >
              Open source
            </a>
          )}
          {fileUrl && (
            <a
              href={fileUrl}
              target="_blank"
              rel="noreferrer"
              className="px-2 py-1 rounded-lg bg-indigo-500/10 border border-indigo-400/30 text-indigo-300 hover:bg-indigo-500/20 transition-colors"
            >
              Open attachment
            </a>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          <article
            className="prose prose-invert prose-sm sm:prose-base max-w-none prose-headings:text-white prose-p:text-gray-300 prose-strong:text-white prose-a:text-cyan-300 prose-a:no-underline hover:prose-a:underline prose-li:text-gray-300"
            dangerouslySetInnerHTML={{ __html: safeHtml }}
          />

          {item.tags.length > 0 && (
            <div className="mt-8 pt-5 border-t border-white/10">
              <p className="text-xs uppercase tracking-wide text-gray-500 mb-3">Tags</p>
              <div className="flex flex-wrap gap-2">
                {item.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-3 py-1 rounded-full text-xs bg-white/5 border border-white/10 text-gray-300"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Create Modal Component
interface CreateModalProps {
  onClose: () => void;
  onCreate: (input: CreateKnowledgeInput | FormData) => Promise<void>;
  availableTags: string[];
}

function CreateModal({ onClose, onCreate, availableTags }: CreateModalProps) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('<p></p>');
  const [type, setType] = useState<KnowledgeType>('note');
  const [tags, setTags] = useState<string[]>([]);
  const [customTag, setCustomTag] = useState('');
  const [sourceUrl, setSourceUrl] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const contentText = htmlToPlainText(content);
  const wordCount = contentText ? contentText.split(/\s+/).length : 0;
  const readingMinutes = wordCount > 0 ? Math.max(1, Math.ceil(wordCount / 220)) : 0;

  const typeMeta: Record<KnowledgeType, { icon: typeof FileText; label: string; hint: string }> = {
    note: { icon: FileText, label: 'Note', hint: 'Quick ideas and snippets' },
    article: { icon: BookOpen, label: 'Article', hint: 'Long-form learnings' },
    insight: { icon: Lightbulb, label: 'Insight', hint: 'Your distilled takeaways' },
    link: { icon: Link2, label: 'Link', hint: 'Source-backed references' },
    idea: { icon: Sparkles, label: 'Idea', hint: 'Concepts worth exploring' },
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !contentText) return;

    setIsSubmitting(true);
    
    try {
      if (file) {
        const formData = new FormData();
        formData.append('title', title.trim());
        formData.append('content', content);
        formData.append('type', type);
        formData.append('tags', tags.join(','));
        if (sourceUrl) formData.append('url', sourceUrl.trim());
        formData.append('file', file);
        
        await onCreate(formData);
      } else {
        await onCreate({
          title: title.trim(),
          content,
          type,
          tags,
          sourceUrl: sourceUrl.trim() || undefined,
        });
      }
    } finally {
        setIsSubmitting(false);
    }
  };

  const toggleTag = (tag: string) => {
    setTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const addCustomTag = () => {
    const normalized = customTag.trim().toLowerCase().replace(/\s+/g, '-');
    if (!normalized || tags.includes(normalized)) {
      setCustomTag('');
      return;
    }

    setTags((prev) => [...prev, normalized]);
    setCustomTag('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-5xl max-h-[92vh] overflow-auto rounded-2xl bg-[#0b0d12] border border-white/10 shadow-2xl">
        <div className="p-6 border-b border-white/10 bg-[radial-gradient(circle_at_top_right,rgba(99,102,241,0.22),transparent_52%),radial-gradient(circle_at_top_left,rgba(14,165,233,0.16),transparent_45%)]">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-2xl font-semibold text-white">Capture Knowledge</h2>
              <p className="text-sm text-gray-300 mt-1">
                Write with rich formatting. AI will summarize and suggest tags after save.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg border border-cyan-400/20 bg-cyan-500/10 text-cyan-300 text-xs">
                <Sparkles className="w-3 h-3" />
                Auto-enrichment enabled
              </div>
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg border border-white/10 bg-white/5 text-gray-300 text-xs">
                <Command className="w-3 h-3" />
                Ctrl/Cmd + Enter to save
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="absolute right-4 top-4 p-2 rounded-lg hover:bg-white/5 text-gray-500 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          onKeyDown={(e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
              e.preventDefault();
              (e.currentTarget as HTMLFormElement).requestSubmit();
            }
          }}
          className="p-6"
        >
          <div className="grid grid-cols-1 xl:grid-cols-[1.1fr_2fr] gap-6">
            <div className="space-y-5">
              <div>
                <label className="block text-sm text-gray-300 mb-2">Knowledge Type</label>
                <div className="grid grid-cols-2 gap-2">
                  {(['note', 'article', 'insight', 'link', 'idea'] as KnowledgeType[]).map((t) => {
                    const Icon = typeMeta[t].icon;
                    return (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setType(t)}
                        className={cn(
                          'flex items-start gap-2 text-left p-3 rounded-xl border transition-colors',
                          type === t
                            ? 'border-indigo-400/60 bg-indigo-500/15 text-white'
                            : 'border-white/10 bg-white/5 text-gray-400 hover:bg-white/10'
                        )}
                      >
                        <Icon className="w-4 h-4 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium capitalize">{typeMeta[t].label}</p>
                          <p className="text-xs text-gray-400">{typeMeta[t].hint}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-300 mb-2">Source URL</label>
                <div className="relative">
                  <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  <input
                    type="url"
                    value={sourceUrl}
                    onChange={(e) => setSourceUrl(e.target.value)}
                    placeholder="https://example.com/reference"
                    className="w-full pl-9 pr-3 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500/60 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-300 mb-2">Attachment</label>
                <label className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl border border-dashed border-white/20 bg-white/5 hover:bg-white/10 cursor-pointer transition-colors">
                  <Upload className="w-4 h-4 text-gray-300" />
                  <span className="text-sm text-gray-300">
                    {file ? file.name : 'Drop file or click to upload'}
                  </span>
                  <span className="text-xs text-gray-500">PDF, DOCX, TXT, JPG, PNG</span>
                  <input
                    type="file"
                    onChange={(e) => setFile(e.target.files ? e.target.files[0] : null)}
                    className="hidden"
                    accept=".jpg,.jpeg,.png,.pdf,.docx,.txt"
                  />
                </label>
              </div>

              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                <p className="text-xs uppercase tracking-wide text-gray-500 mb-2">Writing stats</p>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div>
                    <p className="text-lg font-semibold text-white">{wordCount}</p>
                    <p className="text-[11px] text-gray-500">Words</p>
                  </div>
                  <div>
                    <p className="text-lg font-semibold text-white">{contentText.length}</p>
                    <p className="text-[11px] text-gray-500">Chars</p>
                  </div>
                  <div>
                    <p className="text-lg font-semibold text-white">{readingMinutes}</p>
                    <p className="text-[11px] text-gray-500">Min read</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-5">
              <div>
                <label className="block text-sm text-gray-300 mb-2">Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Name this knowledge card..."
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500/60 transition-colors"
                  required
                />
              </div>

              <div>
                <label className="block text-sm text-gray-300 mb-2">Content</label>
                <RichTextEditor
                  content={content}
                  onChange={setContent}
                  placeholder="Capture ideas, synthesize thoughts, or draft a new insight..."
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm text-gray-300">Tags</label>
                  <div className="flex items-center gap-1 text-xs text-cyan-300">
                    <Sparkles className="w-3 h-3" />
                    AI adds more tags on save
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 mb-3">
                  {availableTags.slice(0, 12).map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => toggleTag(tag)}
                      className={cn(
                        'px-3 py-1 rounded-full text-sm border transition-colors',
                        tags.includes(tag)
                          ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40'
                          : 'bg-white/5 text-gray-400 border-white/10 hover:bg-white/10'
                      )}
                    >
                      {tag}
                    </button>
                  ))}
                </div>

                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <input
                      type="text"
                      value={customTag}
                      onChange={(e) => setCustomTag(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ',') {
                          e.preventDefault();
                          addCustomTag();
                        }
                      }}
                      placeholder="Add custom tag"
                      className="w-full pl-9 pr-3 py-2.5 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500/60 transition-colors"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={addCustomTag}
                    className="px-3 py-2.5 rounded-lg bg-white/10 text-white hover:bg-white/20 transition-colors"
                  >
                    Add
                  </button>
                </div>

                {tags.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {tags.map((tag) => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => toggleTag(tag)}
                        className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-cyan-500/12 border border-cyan-400/25 text-cyan-200 text-sm"
                      >
                        {tag}
                        <X className="w-3 h-3" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-5 mt-6 border-t border-white/10">
            <p className="text-xs text-gray-500">Tip: Use headings and lists to keep notes skimmable.</p>
            <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-gray-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!title.trim() || !contentText || isSubmitting}
              className="flex items-center gap-2 px-6 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
              {isSubmitting ? 'Saving to Brain...' : 'Save'}
            </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

// AI Chat Modal Component
interface AIChatModalProps {
  onClose: () => void;
  knowledgeBase?: KnowledgeItem[];
}

function AIChatModal({ onClose }: AIChatModalProps) {
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

    try {
      const response = await axios.get(`${API_URL}/public/brain/query`, {
        params: { q: userQuery }
      });
      
      const result = response.data;
      
      // Formatting the response
      const answer = `Found ${result.count} related items in your brain for "${result.query}".\n\n` + 
        result.answers.map((ans: any) => `- **${ans.title}**: ${ans.summary}`).join('\n');

      setMessages((prev) => [
        ...prev,
        { type: 'ai', content: answer, sources: result.answers },
      ]);
    } catch (error) {
      console.error("AI Chat Error:", error);
      setMessages((prev) => [
        ...prev,
        { type: 'ai', content: 'Sorry, I encountered an error searching your brain.' },
      ]);
    } finally {
      setIsLoading(false);
    }
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
