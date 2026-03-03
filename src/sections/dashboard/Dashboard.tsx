import { useState, useEffect, useMemo, useRef, useCallback, type KeyboardEvent as ReactKeyboardEvent } from 'react';
import { 
  Brain, 
  Search, 
  Plus, 
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
  ExternalLink,
  File as FileIcon,
  GitBranch,
  Orbit
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { db } from '@/lib/db';
import { aiService } from '@/lib/ai';
import { motion, AnimatePresence } from 'framer-motion';
import type { KnowledgeItem, KnowledgeType, CreateKnowledgeInput, User } from '@/types';
import type { GraphResult } from '@/types/ai';
import ReactFlow, { Background, Controls, type Edge as FlowEdge, type Node as FlowNode } from 'reactflow';
import cytoscape, { type Core as CyCore } from 'cytoscape';
import 'reactflow/dist/style.css';
import GlassCard from '@/components/animations/GlassCard';
import AuthModal from '@/components/AuthModal';

interface DashboardProps {
  onBack: () => void;
  onViewDocs: () => void;
  onSignOut?: () => void;
  user?: User | null;
}

export default function Dashboard({ onBack, onViewDocs, onSignOut, user }: DashboardProps) {
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
  const [activeItem, setActiveItem] = useState<KnowledgeItem | null>(null);
  const [initialAction, setInitialAction] = useState<ViewerAction>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(user || null);
  const [authChecked, setAuthChecked] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const hasApiKey = Boolean(import.meta.env.VITE_API_KEY);

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    show: { y: 0, opacity: 1, transition: { type: 'spring', stiffness: 300, damping: 24 } }
  };

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [knowledgeItems, tags] = await Promise.all([
        db.knowledge.getAll(),
        db.knowledge.getAllTags(),
      ]);
      setItems(knowledgeItems);
      setFilteredItems(knowledgeItems);
      setAllTags(tags);
    } catch (err) {
      console.error('Failed to load knowledge:', err);
      setShowAuthModal(true);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Auth bootstrap + data load
  useEffect(() => {
    const init = async () => {
      if (hasApiKey) {
        await loadData();
        setAuthChecked(true);
        return;
      }

      try {
        const current = await db.user.getCurrent();
        setCurrentUser(current);
        await loadData();
      } catch (err) {
        console.warn('Auth required, opening sign-in', err);
        setShowAuthModal(true);
      } finally {
        setAuthChecked(true);
      }
    };

    void init();
  }, [hasApiKey, loadData]);

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

  const stats = useMemo(() => {
    const total = items.length;
    const summarized = items.filter((i) => !!i.summary).length;
    const insights = items.filter((i) => i.type === 'insight').length;
    const words = items.reduce((sum, item) => sum + (item.metadata?.wordCount ?? item.content.split(/\s+/).length), 0);
    const avgRead = total ? Math.max(1, Math.ceil(words / total / 200)) : 0;
    return {
      total,
      summarized,
      insights,
      tags: allTags.length,
      avgRead,
    };
  }, [items, allTags]);

  const spotlightTags = useMemo(() => {
    const source = selectedTags.length ? selectedTags : allTags;
    return source.slice(0, 8);
  }, [selectedTags, allTags]);

  const recentItems = useMemo(() => items.slice(0, 3), [items]);

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
        if (!hasApiKey && !currentUser) {
          setShowAuthModal(true);
          return;
        }
        setIsCreateModalOpen(true);
      }
      // Cmd/Ctrl + / - AI Chat
      if ((e.metaKey || e.ctrlKey) && e.key === '/') {
        e.preventDefault();
        if (!hasApiKey && !currentUser) {
          setShowAuthModal(true);
          return;
        }
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
  }, [hasApiKey, currentUser]);

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

  const handleUploadItem = async (file: File) => {
    const uploaded = await db.knowledge.upload(file);
    setItems((prev) => [uploaded, ...prev]);
    setFilteredItems((prev) => [uploaded, ...prev]);
    setAllTags((prev) => Array.from(new Set([...prev, ...(uploaded.tags || [])])));
    setIsCreateModalOpen(false);
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

  const requireAuth = () => {
    if (!hasApiKey && !currentUser) {
      setShowAuthModal(true);
      return false;
    }
    return true;
  };

  const openCreateModal = () => {
    if (!requireAuth()) return;
    setIsCreateModalOpen(true);
  };

  const openAIChatModal = () => {
    if (!requireAuth()) return;
    setIsAIChatOpen(true);
  };

  if (!authChecked && !hasApiKey) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white">
        <div className="flex items-center gap-3 text-gray-300">
          <div className="w-4 h-4 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
          <span>Checking session…</span>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-black via-[#0a0a1a] to-[#0b0b22] text-white">
      <div className="pointer-events-none absolute inset-0 opacity-50 bg-[radial-gradient(circle_at_20%_20%,rgba(99,102,241,0.14),transparent_35%),radial-gradient(circle_at_80%_0%,rgba(236,72,153,0.1),transparent_25%),radial-gradient(circle_at_40%_80%,rgba(59,130,246,0.08),transparent_30%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(120deg,rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(0deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:28px_28px] opacity-20" />

      <header className="sticky top-0 z-40 border-b border-white/5 bg-black/50 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="p-2 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-900/40">
                <Brain className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-indigo-300">Second Brain</p>
                <p className="text-sm text-gray-400">AI knowledge operations</p>
              </div>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-2">
            <button
              onClick={() => setIsCommandPaletteOpen(true)}
              className="px-3 py-2 rounded-lg bg-white/5 text-xs text-gray-300 border border-white/10 hover:border-indigo-400/40 hover:text-white"
            >
              Cmd + K
            </button>
            <button
              onClick={onViewDocs}
              className="px-3 py-2 rounded-lg bg-white/5 text-xs text-gray-300 border border-white/10 hover:border-indigo-400/40 hover:text-white"
            >
              API & Docs
            </button>
            {onSignOut && (
              <button
                onClick={onSignOut}
                className="px-3 py-2 rounded-lg bg-white/5 text-xs text-gray-300 border border-white/10 hover:border-red-400/40 hover:text-white"
              >
                Sign out
              </button>
            )}
          </div>
        </div>
      </header>

      <motion.main 
        className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10"
        variants={containerVariants}
        initial="hidden"
        animate="show"
      >
        <div className="grid lg:grid-cols-[2fr,1fr] gap-6 items-stretch">
          <motion.div variants={itemVariants}>
            <GlassCard className="p-6 relative overflow-hidden h-full">
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 via-purple-500/5 to-transparent" />
              <div className="relative flex flex-col gap-6">
                <div className="flex flex-col gap-2">
                  <p className="text-xs uppercase tracking-[0.3em] text-indigo-300">Command Center</p>
                  <h1 className="text-3xl font-semibold text-white">Curate, summarize, and interrogate your knowledge</h1>
                  <p className="text-gray-400">Search, filter, and trigger AI actions from one unified surface.</p>
                </div>

                <div className="grid md:grid-cols-[1.3fr,1fr] gap-3 mt-auto">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <input
                      type="text"
                      placeholder="Search notes, tags, sources"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500/60 transition-colors"
                    />
                  </div>
                  <div className="flex flex-wrap gap-2 justify-end">
                    <button
                      onClick={openCreateModal}
                      className="flex items-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-[0_10px_35px_rgba(99,102,241,0.35)] hover:-translate-y-0.5 transition-transform"
                    >
                      <Plus className="w-4 h-4" />
                      Capture knowledge
                    </button>
                    <button
                      onClick={openAIChatModal}
                      className="flex items-center gap-2 px-4 py-3 rounded-xl bg-white/5 text-gray-200 border border-white/10 hover:border-indigo-400/40"
                    >
                      <Bot className="w-4 h-4" />
                      Ask AI
                    </button>
                    <button
                      onClick={() => setIsCommandPaletteOpen(true)}
                      className="flex items-center gap-2 px-4 py-3 rounded-xl bg-white/5 text-gray-200 border border-white/10 hover:border-indigo-400/40"
                    >
                      <Command className="w-4 h-4" />
                      Palette
                    </button>
                  </div>
                </div>
              </div>
            </GlassCard>
          </motion.div>

          <motion.div variants={itemVariants}>
            <GlassCard className="p-6 h-full flex flex-col">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-xs text-gray-500">Workspace</p>
                  <p className="text-lg font-semibold text-white">{currentUser?.name || 'Guest user'}</p>
                  <p className="text-sm text-gray-400">{currentUser?.email || 'API key session'}</p>
                </div>
                <div className="px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-300 text-xs border border-emerald-500/20">
                  Live
                </div>
              </div>
              <div className="space-y-3 text-sm text-gray-300 mt-auto">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-indigo-300" />
                  <span>Summaries generated on ingest if content is long.</span>
                </div>
                <div className="flex items-center gap-2">
                  <GitBranch className="w-4 h-4 text-indigo-300" />
                  <span>Mind maps and graphs are generated per note on demand.</span>
                </div>
                <button
                  onClick={onViewDocs}
                  className="inline-flex items-center gap-2 text-indigo-300 hover:text-indigo-200 text-sm"
                >
                  View API & widget guide
                  <ExternalLink className="w-4 h-4" />
                </button>
              </div>
            </GlassCard>
          </motion.div>
        </div>

        <motion.div 
          className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4"
          variants={containerVariants}
          initial="hidden"
          animate="show"
        >
          {[{
            label: 'Total items',
            value: stats.total,
            icon: FileText,
            accent: 'from-indigo-500 to-purple-500',
          }, {
            label: 'AI summaries',
            value: stats.summarized,
            icon: Sparkles,
            accent: 'from-amber-400 to-orange-500',
          }, {
            label: 'Avg. reading time',
            value: stats.avgRead ? `${stats.avgRead} min` : '—',
            icon: BookOpen,
            accent: 'from-cyan-400 to-sky-500',
          }, {
            label: 'Tracked tags',
            value: stats.tags,
            icon: Tag,
            accent: 'from-emerald-400 to-green-500',
          }].map((card) => {
            const Icon = card.icon;
            return (
              <motion.div key={card.label} variants={itemVariants} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <GlassCard className="p-4 flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide">{card.label}</p>
                    <p className="text-2xl font-semibold text-white mt-1">{card.value}</p>
                  </div>
                  <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${card.accent} flex items-center justify-center text-black`}>
                    <Icon className="w-5 h-5" />
                  </div>
                </GlassCard>
              </motion.div>
            );
          })}
        </motion.div>

        <div className="grid lg:grid-cols-[320px,1fr] gap-6 items-start">
          <motion.div variants={itemVariants}>
            <GlassCard className="p-5 space-y-4 sticky top-24">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Filters</p>
                <p className="text-white font-medium">Tune what you see</p>
              </div>
              <button
                onClick={() => {
                  setSelectedTags([]);
                  setSelectedType('all');
                  setSearchQuery('');
                }}
                className="text-xs text-gray-400 hover:text-white"
              >
                Reset
              </button>
            </div>

            <div className="space-y-3">
              <p className="text-xs text-gray-500">Types</p>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { value: 'all', label: 'All', icon: null },
                  { value: 'note', label: 'Notes', icon: FileText },
                  { value: 'article', label: 'Articles', icon: BookOpen },
                  { value: 'insight', label: 'Insights', icon: Lightbulb },
                  { value: 'link', label: 'Links', icon: Link2 },
                  { value: 'idea', label: 'Ideas', icon: Sparkles },
                ].map((type) => {
                  const Icon = type.icon;
                  const isActive = selectedType === type.value;
                  return (
                    <button
                      key={type.value}
                      onClick={() => setSelectedType(type.value as KnowledgeType | 'all')}
                      className={cn(
                        'flex items-center gap-2 px-3 py-2 rounded-lg border text-sm transition-colors',
                        isActive
                          ? 'border-indigo-400/50 bg-indigo-500/15 text-white'
                          : 'border-white/10 bg-white/5 text-gray-300 hover:border-indigo-400/40'
                      )}
                    >
                      {Icon && <Icon className="w-4 h-4" />}
                      {type.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>Tags</span>
                <span>{selectedTags.length ? `${selectedTags.length} selected` : `${allTags.length} available`}</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {spotlightTags.length === 0 && <p className="text-xs text-gray-600">No tags yet</p>}
                {spotlightTags.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => toggleTag(tag)}
                    className={cn(
                      'px-3 py-1 rounded-full text-xs border transition-colors',
                      selectedTags.includes(tag)
                        ? 'bg-indigo-500/20 text-indigo-200 border-indigo-400/40'
                        : 'bg-white/5 text-gray-300 border-white/10 hover:border-indigo-400/40'
                    )}
                  >
                    #{tag}
                  </button>
                ))}
              </div>
            </div>

            {recentItems.length > 0 && (
              <div className="space-y-2 pt-1 border-t border-white/5">
                <p className="text-xs text-gray-500">Recently added</p>
                <div className="space-y-2">
                  {recentItems.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => {
                        setActiveItem(item);
                        setInitialAction(null);
                      }}
                      className="w-full text-left px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                    >
                      <p className="text-sm text-white line-clamp-1">{item.title}</p>
                      <p className="text-xs text-gray-500 line-clamp-1">{item.type} • {item.tags.slice(0, 3).join(', ')}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </GlassCard>
        </motion.div>

        <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Results</p>
                <p className="text-white font-medium">{filteredItems.length} {filteredItems.length === 1 ? 'item' : 'items'}</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setViewMode('grid')}
                  className={cn('p-2 rounded-lg border', viewMode === 'grid' ? 'border-indigo-400/50 bg-indigo-500/10 text-white' : 'border-white/10 text-gray-400 hover:border-indigo-400/40')}
                >
                  <Grid3X3 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={cn('p-2 rounded-lg border', viewMode === 'list' ? 'border-indigo-400/50 bg-indigo-500/10 text-white' : 'border-white/10 text-gray-400 hover:border-indigo-400/40')}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>

            {isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[...Array(6)].map((_, idx) => (
                  <div key={idx} className="h-40 rounded-xl bg-white/5 border border-white/5 animate-pulse" />
                ))}
              </div>
            ) : filteredItems.length === 0 ? (
              <GlassCard className="p-10 text-center border border-dashed border-white/10">
                <div className="mx-auto mb-4 w-14 h-14 rounded-full bg-white/5 flex items-center justify-center">
                  <Search className="w-6 h-6 text-gray-400" />
                </div>
                <p className="text-white font-medium mb-2">No items match these filters</p>
                <p className="text-gray-500 text-sm mb-4">Adjust search or start capturing a new note.</p>
                <div className="flex justify-center gap-2">
                  <button
                    onClick={openCreateModal}
                    className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm hover:bg-indigo-500"
                  >
                    Create item
                  </button>
                  <button
                    onClick={openAIChatModal}
                    className="px-4 py-2 rounded-lg bg-white/5 text-gray-200 text-sm border border-white/10 hover:border-indigo-400/40"
                  >
                    Ask AI
                  </button>
                </div>
              </GlassCard>
            ) : (
              <motion.div 
                variants={containerVariants}
                initial="hidden"
                animate="show"
                className={cn(viewMode === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4' : 'space-y-3')}
              >
                {filteredItems.map((item) => (
                  <motion.div key={item.id} variants={itemVariants} layout>
                    <KnowledgeCard
                      item={item}
                      viewMode={viewMode}
                      onDelete={handleDeleteItem}
                      onOpen={(item, action) => {
                        setActiveItem(item);
                        setInitialAction(action ?? null);
                      }}
                    />
                  </motion.div>
                ))}
              </motion.div>
            )}
          </div>
        </div>
      </motion.main>

      {activeItem && (
        <ItemViewer
          item={activeItem}
          onClose={() => {
            setActiveItem(null);
            setInitialAction(null);
          }}
          onDelete={async (id) => {
            await handleDeleteItem(id);
            setActiveItem(null);
            setInitialAction(null);
          }}
          initialAction={initialAction}
        />
      )}

      {/* Create Modal */}
      {isCreateModalOpen && (
        <CreateModal
          onClose={() => setIsCreateModalOpen(false)}
          onCreate={handleCreateItem}
          onUpload={handleUploadItem}
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
            openCreateModal();
          }}
          onAIChat={() => {
            setIsCommandPaletteOpen(false);
            openAIChatModal();
          }}
          onViewDocs={() => {
            setIsCommandPaletteOpen(false);
            onViewDocs();
          }}
        />
      )}

      <AuthModal
        open={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onAuthenticated={(u) => {
          setCurrentUser(u);
          setShowAuthModal(false);
          void loadData();
        }}
      />
    </div>
  );
}

// Knowledge Card Component
interface KnowledgeCardProps {
  item: KnowledgeItem;
  viewMode: 'grid' | 'list';
  onDelete: (id: string) => void;
  onOpen: (item: KnowledgeItem, action?: ViewerAction) => void;
}

type ViewerAction = 'mindmap' | 'graph' | null;

function KnowledgeCard({ item, viewMode, onDelete, onOpen }: KnowledgeCardProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const isPdf = item.metadata?.sourceFile?.mimetype?.toLowerCase().includes('pdf');
  const displayExcerpt = isPdf ? 'PDF document uploaded' : (item.summary || item.content.slice(0, viewMode === 'list' ? 100 : 150));

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
  const triggerOpen = (action?: ViewerAction) => onOpen(item, action);

  if (viewMode === 'list') {
    return (
      <GlassCard
        className="p-4 cursor-pointer"
        onClick={() => triggerOpen()}
        role="button"
        tabIndex={0}
        onKeyDown={(e: ReactKeyboardEvent<HTMLDivElement>) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            triggerOpen();
          }
        }}
      >
        <div className="flex items-center gap-4">
          <div className={cn('w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center', colorClass)}>
            <Icon className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-white font-medium truncate">{item.title}</h3>
            <p className="text-gray-500 text-sm truncate">
              {displayExcerpt}...
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
        <div className="mt-3 flex gap-2">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              triggerOpen('mindmap');
            }}
            className="flex items-center gap-1 px-3 py-1 rounded-lg bg-white/5 text-xs text-gray-300 hover:bg-white/10"
          >
            <GitBranch className="w-3 h-3" />
            Mind Map
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              triggerOpen('graph');
            }}
            className="flex items-center gap-1 px-3 py-1 rounded-lg bg-white/5 text-xs text-gray-300 hover:bg-white/10"
          >
            <Orbit className="w-3 h-3" />
            Graph
          </button>
        </div>
      </GlassCard>
    );
  }

  return (
    <GlassCard
      className="p-6 group cursor-pointer"
      onClick={() => triggerOpen()}
      role="button"
      tabIndex={0}
      onKeyDown={(e: ReactKeyboardEvent<HTMLDivElement>) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          triggerOpen();
        }
      }}
    >
      <div className="flex items-start justify-between mb-4">
        <div className={cn('w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center', colorClass)}>
          <Icon className="w-5 h-5" />
        </div>
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
                onClick={(e) => {
                  e.stopPropagation();
                  setIsMenuOpen(false);
                }}
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

      <h3 className="text-white font-medium mb-2 line-clamp-2">{item.title}</h3>
      <p className="text-gray-500 text-sm mb-4 line-clamp-3">
        {displayExcerpt}...
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

      <div className="mt-4 flex gap-2">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            triggerOpen('mindmap');
          }}
          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 text-xs text-gray-300 hover:bg-white/10"
        >
          <GitBranch className="w-4 h-4" />
          Mind Map
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            triggerOpen('graph');
          }}
          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 text-xs text-gray-300 hover:bg-white/10"
        >
          <Orbit className="w-4 h-4" />
          Graph
        </button>
      </div>
    </GlassCard>
  );
}

const formatBytes = (bytes?: number) => {
  if (!bytes || Number.isNaN(bytes)) return '—';
  const units = ['B', 'KB', 'MB', 'GB'];
  let value = bytes;
  let unitIndex = 0;
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }
  const precision = unitIndex === 0 ? 0 : 1;
  return `${value.toFixed(precision)} ${units[unitIndex]}`;
};

type MindMapFlow = { nodes: FlowNode[]; edges: FlowEdge[] };

const parseMindMapToFlow = (mapText: string): MindMapFlow => {
  const lines = mapText
    .split(/\r?\n/)
    .map((l) => l.replace(/\t/g, '  '))
    .filter((l) => l.trim().length > 0);

  const stack: { depth: number; id: string }[] = [];
  const nodes: FlowNode[] = [];
  const edges: FlowEdge[] = [];

  lines.forEach((line, idx) => {
    const indent = (line.match(/^\s*/) || [''])[0].length;
    const depth = Math.floor(indent / 2);
    const label = line.replace(/^[-*•\s]+/, '').trim();
    if (!label) return;

    // Pop deeper levels
    while (stack.length > 0 && stack[stack.length - 1].depth >= depth) {
      stack.pop();
    }

    const id = `m-${idx}`;
    const parent = stack[stack.length - 1]?.id;
    const order = nodes.length;
    nodes.push({
      id,
      data: { label },
      position: { x: depth * 220, y: order * 110 },
      style: { background: '#111827', border: '1px solid rgba(99,102,241,0.4)', color: '#e5e7eb' },
    });

    if (parent) {
      edges.push({ id: `e-${parent}-${id}`, source: parent, target: id, animated: false });
    }

    stack.push({ depth, id });
  });

  return { nodes, edges };
};

interface ItemViewerProps {
  item: KnowledgeItem;
  onClose: () => void;
  onDelete: (id: string) => void | Promise<void>;
  initialAction?: ViewerAction;
}

function ItemViewer({ item, onClose, onDelete, initialAction }: ItemViewerProps) {
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
  const fileMeta = item.metadata?.sourceFile;
  const isPdf = fileMeta?.mimetype?.toLowerCase().includes('pdf');
  const [mindMap, setMindMap] = useState<string | null>(null);
  const [graph, setGraph] = useState<GraphResult | null>(null);
  const [isGeneratingMindMap, setIsGeneratingMindMap] = useState(false);
  const [isGeneratingGraph, setIsGeneratingGraph] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mindMapFlow = useMemo<MindMapFlow>(() => (mindMap ? parseMindMapToFlow(mindMap) : { nodes: [], edges: [] }), [mindMap]);


  const generateMindMap = async () => {
    setIsGeneratingMindMap(true);
    setError(null);
    try {
      const result = await aiService.mindMap(item.title, item.content);
      setMindMap(result.map);
    } catch (e) {
      setError('Failed to generate mind map.');
    } finally {
      setIsGeneratingMindMap(false);
    }
  };

  const generateGraph = async () => {
    setIsGeneratingGraph(true);
    setError(null);
    try {
      const result = await aiService.knowledgeGraph(item.title, item.content);
      setGraph(result);
    } catch (e) {
      setError('Failed to generate graph.');
    } finally {
      setIsGeneratingGraph(false);
    }
  };

  useEffect(() => {
    if (initialAction === 'mindmap') {
      void generateMindMap();
    }
    if (initialAction === 'graph') {
      void generateGraph();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialAction]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-5xl max-h-[90vh] overflow-hidden rounded-2xl bg-[#0b0b0b] border border-white/10">
        <div className="flex flex-wrap items-center justify-between gap-4 p-6 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className={cn('w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center', colorClass)}>
              <Icon className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-white leading-tight">{item.title}</h2>
              <p className="text-xs text-gray-500 mt-1">
                {item.type.toUpperCase()} • {item.createdAt.toLocaleString()}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {item.sourceUrl && (
              <a
                href={item.sourceUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 text-xs text-indigo-300 border border-white/10 hover:bg-white/10"
              >
                <ExternalLink className="w-4 h-4" />
                Open source
              </a>
            )}
            <button
              onClick={generateMindMap}
              disabled={isGeneratingMindMap}
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 text-xs text-gray-200 border border-white/10 hover:bg-white/10 disabled:opacity-50"
            >
              <GitBranch className="w-4 h-4" />
              {isGeneratingMindMap ? 'Building…' : 'Mind Map'}
            </button>
            <button
              onClick={generateGraph}
              disabled={isGeneratingGraph}
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 text-xs text-gray-200 border border-white/10 hover:bg-white/10 disabled:opacity-50"
            >
              <Orbit className="w-4 h-4" />
              {isGeneratingGraph ? 'Linking…' : 'Graph'}
            </button>
            <button
              onClick={() => onDelete(item.id)}
              className="px-3 py-2 rounded-lg bg-white/5 text-xs text-red-300 border border-white/10 hover:bg-white/10"
            >
              Delete
            </button>
            <button
              onClick={onClose}
              className="px-3 py-2 rounded-lg bg-indigo-600 text-xs text-white hover:bg-indigo-500"
            >
              Close
            </button>
          </div>
        </div>

        <div className="p-6 space-y-4 overflow-auto max-h-[calc(90vh-96px)]">
          {!isPdf && item.summary && (
            <div className="rounded-xl bg-indigo-500/5 border border-indigo-500/20 p-4">
              <p className="text-xs text-indigo-300 mb-2">AI summary</p>
              <p className="text-sm text-gray-100 leading-relaxed whitespace-pre-wrap">{item.summary}</p>
            </div>
          )}

          {fileMeta && (
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center flex-shrink-0">
                <FileIcon className="w-4 h-4 text-indigo-400" />
              </div>
              <div className="text-sm">
                <p className="text-white font-medium">{fileMeta.name}</p>
                <p className="text-xs text-gray-500 mb-1">{fileMeta.mimetype} • {formatBytes(fileMeta.size)}</p>
                <p className="text-xs text-gray-500">Content below was extracted from the uploaded file.</p>
              </div>
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            <span className={cn('px-3 py-1 rounded-full text-xs border border-white/10', colorClass)}>
              {item.type}
            </span>
            {item.tags.map((tag) => (
              <span
                key={tag}
                className="px-3 py-1 rounded-full text-xs bg-white/5 text-gray-300 border border-white/10"
              >
                {tag}
              </span>
            ))}
          </div>

          {isPdf ? (
            <div className="rounded-xl bg-white/[0.02] border border-white/10 p-4">
              <p className="text-xs text-gray-500 mb-2">PDF file</p>
              <p className="text-sm text-gray-300">
                This item comes from a PDF. Original text is hidden; download or view the PDF to read it.
              </p>
            </div>
          ) : (
            <div className="rounded-xl bg-white/[0.02] border border-white/10 p-4">
              <p className="text-xs text-gray-500 mb-2">Content</p>
              <div className="text-gray-100 text-sm whitespace-pre-wrap leading-relaxed">
                {item.content}
              </div>
            </div>
          )}

          <div className="grid md:grid-cols-2 gap-4">
            <div className="rounded-xl bg-white/[0.02] border border-white/10 p-4">
              <div className="flex items-center gap-2 mb-2 text-sm text-gray-300">
                <GitBranch className="w-4 h-4" />
                Mind map
              </div>
              {mindMap ? (
                <div className="h-72 rounded-lg bg-black/30 border border-white/5">
                  <ReactFlow
                    nodes={mindMapFlow.nodes}
                    edges={mindMapFlow.edges}
                    fitView
                    proOptions={{ hideAttribution: true }}
                    nodesDraggable={false}
                    elementsSelectable={false}
                    zoomOnScroll
                    panOnScroll
                    panOnDrag
                    style={{ height: '100%' }}
                  >
                    <Background gap={12} color="rgba(255,255,255,0.05)" />
                    <Controls showInteractive={false} />
                  </ReactFlow>
                </div>
              ) : (
                <p className="text-xs text-gray-500">Generate a quick mind map from this note.</p>
              )}
            </div>
            <div className="rounded-xl bg-white/[0.02] border border-white/10 p-4">
              <div className="flex items-center gap-2 mb-2 text-sm text-gray-300">
                <Orbit className="w-4 h-4" />
                Knowledge graph
              </div>
              {graph ? (
                <CytoscapeView graph={graph} title={item.title} />
              ) : (
                <p className="text-xs text-gray-500">Generate a lightweight connection graph.</p>
              )}
            </div>
          </div>

          {error && (
            <div className="rounded-lg border border-red-500/20 bg-red-500/5 text-red-200 text-xs px-3 py-2">
              {error}
            </div>
          )}

          <div className="grid sm:grid-cols-3 gap-3 text-sm text-gray-400">
            <div className="rounded-lg bg-white/[0.02] border border-white/10 p-3">
              <p className="text-xs text-gray-500">Created</p>
              <p className="text-white">{item.createdAt.toLocaleString()}</p>
            </div>
            <div className="rounded-lg bg-white/[0.02] border border-white/10 p-3">
              <p className="text-xs text-gray-500">Updated</p>
              <p className="text-white">{item.updatedAt.toLocaleString()}</p>
            </div>
            <div className="rounded-lg bg-white/[0.02] border border-white/10 p-3">
              <p className="text-xs text-gray-500">Reading time</p>
              <p className="text-white">{item.metadata?.readingTime ? `${item.metadata.readingTime} min` : '—'}</p>
              {item.metadata?.wordCount && (
                <p className="text-xs text-gray-500">{item.metadata.wordCount} words</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

interface CytoscapeViewProps {
  graph: GraphResult;
  title: string;
}

function CytoscapeView({ graph, title }: CytoscapeViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  const elements = useMemo(() => {
    const nodeIds = new Set(graph.nodes.map((n) => n.id));
    const nodes = [...graph.nodes];
    graph.edges.forEach((e) => {
      if (!nodeIds.has(e.source)) {
        nodes.push({ id: e.source, label: e.source });
        nodeIds.add(e.source);
      }
      if (!nodeIds.has(e.target)) {
        nodes.push({ id: e.target, label: e.target });
        nodeIds.add(e.target);
      }
    });

    if (!nodeIds.size) {
      nodes.push({ id: 'title', label: title });
    }

    const cyNodes = nodes.map((n) => ({ data: { id: n.id, label: n.label } }));
    const cyEdges = graph.edges.map((e, idx) => ({
      data: {
        id: `e-${idx}`,
        source: e.source,
        target: e.target,
        label: e.label,
      },
    }));

    return [...cyNodes, ...cyEdges];
  }, [graph.edges, graph.nodes, title]);

  useEffect(() => {
    if (!containerRef.current) return;
    const cy: CyCore = cytoscape({
      container: containerRef.current,
      elements,
      style: [
        {
          selector: 'node',
          style: {
            'background-color': '#6366f1',
            color: '#e5e7eb',
            label: 'data(label)',
            'font-size': '10px',
            'text-valign': 'center',
            'text-halign': 'center',
            'text-wrap': 'wrap',
            'text-max-width': '120px',
          },
        },
        {
          selector: 'edge',
          style: {
            'line-color': '#8b5cf6',
            'target-arrow-color': '#8b5cf6',
            'target-arrow-shape': 'triangle',
            'curve-style': 'bezier',
            width: 1.5,
            'font-size': '9px',
            label: 'data(label)',
            'text-background-color': '#0a0a0a',
            'text-background-opacity': 0.7,
            'text-background-padding': '2px',
          },
        },
      ],
      layout: { name: 'cose', animate: false, fit: true, nodeRepulsion: 8000 },
      wheelSensitivity: 0.2,
    });

    cy.resize();
    cy.fit();

    return () => {
      cy.destroy();
    };
  }, [elements]);

  return <div ref={containerRef} className="h-72 w-full rounded-lg bg-black/30 border border-white/10" />;
}

// Create Modal Component
interface CreateModalProps {
  onClose: () => void;
  onCreate: (input: CreateKnowledgeInput) => void;
  onUpload: (file: File) => void;
  availableTags: string[];
}

function CreateModal({ onClose, onCreate, onUpload, availableTags }: CreateModalProps) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [type, setType] = useState<KnowledgeType>('note');
  const [tags, setTags] = useState<string[]>([]);
  const [sourceUrl, setSourceUrl] = useState('');
  const [isGeneratingTags, setIsGeneratingTags] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || isUploading) return;
    setIsUploading(true);
    await onUpload(selectedFile);
    setIsUploading(false);
    setSelectedFile(null);
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

          {/* File upload */}
          <div className="rounded-xl border border-dashed border-white/10 bg-white/[0.02] p-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm text-white font-medium">Upload a document</p>
                <p className="text-xs text-gray-500">TXT, MD, or PDF up to 10MB. We ingest and auto-tag it.</p>
                {selectedFile && (
                  <p className="mt-2 text-xs text-indigo-300">Selected: {selectedFile.name}</p>
                )}
              </div>
              <label className="px-3 py-2 rounded-lg bg-white/5 text-sm text-gray-200 border border-white/10 cursor-pointer hover:bg-white/10">
                Choose file
                <input
                  type="file"
                  accept=".txt,.md,.pdf,text/plain,text/markdown,application/pdf"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </label>
            </div>
            <div className="flex justify-end gap-2 mt-3">
              <button
                type="button"
                onClick={handleUpload}
                disabled={!selectedFile || isUploading}
                className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isUploading ? 'Uploading…' : 'Upload & Ingest'}
              </button>
            </div>
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
