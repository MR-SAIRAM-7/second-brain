import { useState } from 'react';
import { 
  ArrowLeft, 
  BookOpen, 
  Code, 
  Layers, 
  Lightbulb, 
  Globe,
  Copy,
  Check,
  Terminal,
  Database
} from 'lucide-react';
import { cn } from '@/lib/utils';
import GlassCard from '@/components/animations/GlassCard';

interface DocsProps {
  onBack: () => void;
}

const sidebarItems = [
  { id: 'overview', label: 'Overview', icon: BookOpen },
  { id: 'architecture', label: 'Architecture', icon: Layers },
  { id: 'principles', label: 'Design Principles', icon: Lightbulb },
  { id: 'api', label: 'Public API', icon: Code },
  { id: 'embed', label: 'Embeddable Widget', icon: Globe },
];

const architectureComponents = [
  {
    layer: 'Frontend',
    components: [
      { name: 'React + Vite', description: 'Modern UI framework with fast HMR', swappable: true },
      { name: 'Tailwind CSS', description: 'Utility-first styling', swappable: true },
      { name: 'shadcn/ui', description: 'Accessible component primitives', swappable: true },
      { name: 'GSAP + Three.js', description: 'Animation and 3D graphics', swappable: true },
    ],
  },
  {
    layer: 'Backend',
    components: [
      { name: 'Node.js/Express', description: 'API server and business logic', swappable: true },
      { name: 'AI Service Layer', description: 'OpenAI/Claude/Gemini integration', swappable: true },
      { name: 'Authentication', description: 'JWT-based auth system', swappable: true },
    ],
  },
  {
    layer: 'Database',
    components: [
      { name: 'PostgreSQL', description: 'Primary data store', swappable: true },
      { name: 'pgvector', description: 'Vector search extension', swappable: false },
      { name: 'Redis', description: 'Caching and sessions', swappable: true },
    ],
  },
  {
    layer: 'AI/ML',
    components: [
      { name: 'OpenAI API', description: 'GPT-4 for summarization and Q&A', swappable: true },
      { name: 'Embedding Model', description: 'Text embeddings for semantic search', swappable: true },
      { name: 'Vector Store', description: 'Pinecone/pgvector for similarity', swappable: true },
    ],
  },
];

const designPrinciples = [
  {
    name: 'Intelligence First',
    description: 'AI is not an afterthought—it\'s woven into every interaction. From auto-tagging to conversational queries, intelligence guides the user experience.',
    implementation: 'The AI service layer abstracts all LLM interactions, providing a unified interface for summarization, tagging, and querying. This allows swapping between OpenAI, Claude, or Gemini without changing application code.',
  },
  {
    name: 'Progressive Disclosure',
    description: 'Show only what\'s necessary, reveal depth on demand. The interface adapts to user expertise and context.',
    implementation: 'The dashboard uses a clean grid view by default, with expandable cards and a command palette for power users. Advanced features like the knowledge graph are accessible but not overwhelming.',
  },
  {
    name: 'Fluid Feedback',
    description: 'Every action receives immediate, meaningful feedback. The system feels alive and responsive.',
    implementation: 'GSAP animations provide smooth transitions, loading states use skeleton screens, and the AI chat shows typing indicators. Micro-interactions on hover and click create a tactile feel.',
  },
  {
    name: 'Knowledge Graph Visualization',
    description: 'Connections between ideas should be discoverable and explorable.',
    implementation: 'The knowledge graph uses D3.js/React Flow to render nodes and edges. AI automatically suggests connections based on semantic similarity and shared tags.',
  },
  {
    name: 'Keyboard-First Navigation',
    description: 'Power users should never need to reach for the mouse.',
    implementation: 'Command palette (Cmd+K), shortcuts for common actions (Cmd+N for new), and full keyboard accessibility throughout the interface.',
  },
];

const apiEndpoints = [
  {
    method: 'GET',
    path: '/api/public/brain/query',
    description: 'Query the knowledge base with natural language',
    params: [
      { name: 'q', type: 'string', required: true, description: 'Natural language query' },
      { name: 'limit', type: 'number', required: false, description: 'Max results (default: 5)' },
    ],
    response: `{
  "success": true,
  "data": {
    "answer": "Based on your notes...",
    "sources": [
      { "id": "1", "title": "Note Title", "relevance": 0.95 }
    ],
    "confidence": 0.87
  },
  "timestamp": "2024-01-15T10:30:00Z"
}`,
  },
  {
    method: 'GET',
    path: '/api/public/brain/items',
    description: 'List knowledge items with optional filtering',
    params: [
      { name: 'type', type: 'string', required: false, description: 'Filter by type (note, article, insight)' },
      { name: 'tag', type: 'string', required: false, description: 'Filter by tag' },
      { name: 'search', type: 'string', required: false, description: 'Search query' },
    ],
    response: `{
  "success": true,
  "data": {
    "items": [
      { "id": "1", "title": "...", "type": "note", "tags": [...] }
    ],
    "total": 42
  },
  "timestamp": "2024-01-15T10:30:00Z"
}`,
  },
  {
    method: 'POST',
    path: '/api/public/brain/summarize',
    description: 'Generate a summary of provided content',
    params: [
      { name: 'content', type: 'string', required: true, description: 'Content to summarize' },
      { name: 'maxLength', type: 'number', required: false, description: 'Maximum summary length' },
    ],
    response: `{
  "success": true,
  "data": {
    "summary": "Concise summary of the content...",
    "keyPoints": ["Point 1", "Point 2"]
  },
  "timestamp": "2024-01-15T10:30:00Z"
}`,
  },
];

export default function Docs({ onBack }: DocsProps) {
  const [activeSection, setActiveSection] = useState('overview');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const handleCopy = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(id);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const renderContent = () => {
    switch (activeSection) {
      case 'overview':
        return (
          <div className="space-y-8">
            <div>
              <h1 className="text-4xl font-bold text-white mb-4">Documentation</h1>
              <p className="text-gray-400 text-lg">
                Welcome to the Second Brain documentation. Here you'll find everything you need to 
                understand the architecture, integrate with our API, and embed the knowledge widget 
                in your own applications.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                { title: 'Architecture', desc: 'Understand the system design', icon: Layers, section: 'architecture' },
                { title: 'Design Principles', desc: 'Learn our UX philosophy', icon: Lightbulb, section: 'principles' },
                { title: 'Public API', desc: 'Integrate with your apps', icon: Code, section: 'api' },
                { title: 'Embeddable Widget', desc: 'Add to any website', icon: Globe, section: 'embed' },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.title}
                    onClick={() => setActiveSection(item.section)}
                    className="p-6 rounded-xl bg-white/[0.03] border border-white/[0.08] hover:border-indigo-500/30 transition-all text-left group"
                  >
                    <Icon className="w-8 h-8 text-indigo-400 mb-4 group-hover:scale-110 transition-transform" />
                    <h3 className="text-white font-medium mb-2">{item.title}</h3>
                    <p className="text-gray-500 text-sm">{item.desc}</p>
                  </button>
                );
              })}
            </div>

            <GlassCard className="p-6">
              <h2 className="text-xl font-semibold text-white mb-4">Quick Start</h2>
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-indigo-400 font-medium">1</span>
                  </div>
                  <div>
                    <h4 className="text-white font-medium">Create an account</h4>
                    <p className="text-gray-500 text-sm">Sign up for free and start capturing knowledge</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-indigo-400 font-medium">2</span>
                  </div>
                  <div>
                    <h4 className="text-white font-medium">Capture your first note</h4>
                    <p className="text-gray-500 text-sm">Use the dashboard or API to add knowledge items</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-indigo-400 font-medium">3</span>
                  </div>
                  <div>
                    <h4 className="text-white font-medium">Query with AI</h4>
                    <p className="text-gray-500 text-sm">Ask questions and get answers from your knowledge base</p>
                  </div>
                </div>
              </div>
            </GlassCard>
          </div>
        );

      case 'architecture':
        return (
          <div className="space-y-8">
            <div>
              <h1 className="text-4xl font-bold text-white mb-4">Architecture</h1>
              <p className="text-gray-400 text-lg">
                Second Brain is built on a portable, layered architecture. Each layer is designed 
                to be swappable, allowing you to adapt the system to your specific needs.
              </p>
            </div>

            <div className="space-y-6">
              {architectureComponents.map((layer) => (
                <GlassCard key={layer.layer} className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <Database className="w-5 h-5 text-indigo-400" />
                    <h3 className="text-lg font-semibold text-white">{layer.layer}</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {layer.components.map((component) => (
                      <div
                        key={component.name}
                        className="p-4 rounded-lg bg-white/5 border border-white/10"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-white font-medium">{component.name}</span>
                          {component.swappable && (
                            <span className="px-2 py-0.5 rounded-full text-xs bg-green-500/20 text-green-400">
                              Swappable
                            </span>
                          )}
                        </div>
                        <p className="text-gray-500 text-sm">{component.description}</p>
                      </div>
                    ))}
                  </div>
                </GlassCard>
              ))}
            </div>

            <GlassCard className="p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Separation of Concerns</h3>
              <div className="space-y-4 text-gray-400">
                <p>
                  The architecture follows clean architecture principles with clear boundaries between layers:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li><strong className="text-white">Domain Layer:</strong> Contains business logic and entities, independent of frameworks</li>
                  <li><strong className="text-white">Application Layer:</strong> Orchestrates use cases and coordinates domain objects</li>
                  <li><strong className="text-white">Infrastructure Layer:</strong> Implements interfaces for databases, APIs, and external services</li>
                  <li><strong className="text-white">Presentation Layer:</strong> UI components and state management</li>
                </ul>
              </div>
            </GlassCard>
          </div>
        );

      case 'principles':
        return (
          <div className="space-y-8">
            <div>
              <h1 className="text-4xl font-bold text-white mb-4">Design Principles</h1>
              <p className="text-gray-400 text-lg">
                These principles guide every design decision in Second Brain, from micro-interactions 
                to system architecture.
              </p>
            </div>

            <div className="space-y-6">
              {designPrinciples.map((principle, index) => (
                <GlassCard key={principle.name} className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-lg bg-indigo-500/20 flex items-center justify-center flex-shrink-0">
                      <span className="text-indigo-400 font-bold">{index + 1}</span>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-white mb-2">{principle.name}</h3>
                      <p className="text-gray-400 mb-4">{principle.description}</p>
                      <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                        <p className="text-sm text-gray-500">
                          <span className="text-indigo-400 font-medium">Implementation: </span>
                          {principle.implementation}
                        </p>
                      </div>
                    </div>
                  </div>
                </GlassCard>
              ))}
            </div>
          </div>
        );

      case 'api':
        return (
          <div className="space-y-8">
            <div>
              <h1 className="text-4xl font-bold text-white mb-4">Public API</h1>
              <p className="text-gray-400 text-lg">
                Access your Second Brain programmatically. Query your knowledge, create items, 
                and integrate with your existing workflows.
              </p>
            </div>

            <GlassCard className="p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Authentication</h3>
              <p className="text-gray-400 mb-4">
                All API requests require an API key passed in the Authorization header:
              </p>
              <div className="relative">
                <pre className="p-4 rounded-lg bg-black/50 text-sm font-mono text-gray-300 overflow-x-auto">
                  Authorization: Bearer YOUR_API_KEY
                </pre>
                <button
                  onClick={() => handleCopy('Authorization: Bearer YOUR_API_KEY', 'auth')}
                  className="absolute top-2 right-2 p-2 rounded-lg hover:bg-white/10 text-gray-500 hover:text-white transition-colors"
                >
                  {copiedCode === 'auth' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </GlassCard>

            <div className="space-y-6">
              {apiEndpoints.map((endpoint) => (
                <GlassCard key={endpoint.path} className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <span className={cn(
                      'px-2 py-1 rounded text-xs font-medium',
                      endpoint.method === 'GET' && 'bg-blue-500/20 text-blue-400',
                      endpoint.method === 'POST' && 'bg-green-500/20 text-green-400',
                      endpoint.method === 'PUT' && 'bg-yellow-500/20 text-yellow-400',
                      endpoint.method === 'DELETE' && 'bg-red-500/20 text-red-400',
                    )}>
                      {endpoint.method}
                    </span>
                    <code className="text-white font-mono">{endpoint.path}</code>
                  </div>
                  <p className="text-gray-400 mb-4">{endpoint.description}</p>

                  {endpoint.params.length > 0 && (
                    <div className="mb-4">
                      <h4 className="text-sm font-medium text-white mb-2">Parameters</h4>
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="text-gray-500 border-b border-white/10">
                            <th className="text-left py-2">Name</th>
                            <th className="text-left py-2">Type</th>
                            <th className="text-left py-2">Required</th>
                            <th className="text-left py-2">Description</th>
                          </tr>
                        </thead>
                        <tbody>
                          {endpoint.params.map((param) => (
                            <tr key={param.name} className="text-gray-400">
                              <td className="py-2 font-mono">{param.name}</td>
                              <td className="py-2">{param.type}</td>
                              <td className="py-2">{param.required ? 'Yes' : 'No'}</td>
                              <td className="py-2">{param.description}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  <div>
                    <h4 className="text-sm font-medium text-white mb-2">Response</h4>
                    <div className="relative">
                      <pre className="p-4 rounded-lg bg-black/50 text-sm font-mono text-gray-300 overflow-x-auto">
                        {endpoint.response}
                      </pre>
                      <button
                        onClick={() => handleCopy(endpoint.response, endpoint.path)}
                        className="absolute top-2 right-2 p-2 rounded-lg hover:bg-white/10 text-gray-500 hover:text-white transition-colors"
                      >
                        {copiedCode === endpoint.path ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </GlassCard>
              ))}
            </div>
          </div>
        );

      case 'embed':
        return (
          <div className="space-y-8">
            <div>
              <h1 className="text-4xl font-bold text-white mb-4">Embeddable Widget</h1>
              <p className="text-gray-400 text-lg">
                Add a Second Brain search widget to any website. Let your visitors query your 
                knowledge base directly from your site.
              </p>
            </div>

            <GlassCard className="p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Basic Embed</h3>
              <p className="text-gray-400 mb-4">
                Add this script tag to your HTML:
              </p>
              <div className="relative">
                <pre className="p-4 rounded-lg bg-black/50 text-sm font-mono text-gray-300 overflow-x-auto">
{`<script 
  src="https://secondbrain.app/widget.js" 
  data-api-key="YOUR_API_KEY"
  data-theme="dark"
></script>`}
                </pre>
                <button
                  onClick={() => handleCopy(`<script src="https://secondbrain.app/widget.js" data-api-key="YOUR_API_KEY" data-theme="dark"></script>`, 'embed-basic')}
                  className="absolute top-2 right-2 p-2 rounded-lg hover:bg-white/10 text-gray-500 hover:text-white transition-colors"
                >
                  {copiedCode === 'embed-basic' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </GlassCard>

            <GlassCard className="p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Configuration Options</h3>
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-gray-500 border-b border-white/10">
                    <th className="text-left py-2">Option</th>
                    <th className="text-left py-2">Type</th>
                    <th className="text-left py-2">Default</th>
                    <th className="text-left py-2">Description</th>
                  </tr>
                </thead>
                <tbody className="text-gray-400">
                  <tr>
                    <td className="py-2 font-mono">data-api-key</td>
                    <td className="py-2">string</td>
                    <td className="py-2">required</td>
                    <td className="py-2">Your API key</td>
                  </tr>
                  <tr>
                    <td className="py-2 font-mono">data-theme</td>
                    <td className="py-2">string</td>
                    <td className="py-2">"dark"</td>
                    <td className="py-2">Widget theme (dark/light)</td>
                  </tr>
                  <tr>
                    <td className="py-2 font-mono">data-position</td>
                    <td className="py-2">string</td>
                    <td className="py-2">"bottom-right"</td>
                    <td className="py-2">Widget position</td>
                  </tr>
                  <tr>
                    <td className="py-2 font-mono">data-primary-color</td>
                    <td className="py-2">string</td>
                    <td className="py-2">"#4F46E5"</td>
                    <td className="py-2">Primary accent color</td>
                  </tr>
                </tbody>
              </table>
            </GlassCard>

            <GlassCard className="p-6">
              <h3 className="text-lg font-semibold text-white mb-4">React Component</h3>
              <p className="text-gray-400 mb-4">
                For React applications, use our official component:
              </p>
              <div className="relative">
                <pre className="p-4 rounded-lg bg-black/50 text-sm font-mono text-gray-300 overflow-x-auto">
{`import { SecondBrainWidget } from '@secondbrain/react';

function App() {
  return (
    <SecondBrainWidget
      apiKey="YOUR_API_KEY"
      theme="dark"
      position="bottom-right"
    />
  );
}`}
                </pre>
                <button
                  onClick={() => handleCopy(`import { SecondBrainWidget } from '@secondbrain/react';

function App() {
  return (
    <SecondBrainWidget
      apiKey="YOUR_API_KEY"
      theme="dark"
      position="bottom-right"
    />
  );
}`, 'embed-react')}
                  className="absolute top-2 right-2 p-2 rounded-lg hover:bg-white/10 text-gray-500 hover:text-white transition-colors"
                >
                  {copiedCode === 'embed-react' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </GlassCard>

            <GlassCard className="p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Live Preview</h3>
              <div className="p-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center">
                <div className="text-center">
                  <div className="w-16 h-16 rounded-full bg-indigo-500/20 flex items-center justify-center mx-auto mb-4">
                    <Terminal className="w-8 h-8 text-indigo-400" />
                  </div>
                  <p className="text-gray-400">Widget preview would appear here</p>
                  <p className="text-gray-600 text-sm mt-2">Install the widget to see it in action</p>
                </div>
              </div>
            </GlassCard>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-black/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <button
                onClick={onBack}
                className="p-2 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-500 flex items-center justify-center">
                  <BookOpen className="w-5 h-5 text-white" />
                </div>
                <span className="font-semibold text-white">Documentation</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-8">
          {/* Sidebar */}
          <aside className="hidden lg:block w-64 flex-shrink-0">
            <nav className="sticky top-24 space-y-1">
              {sidebarItems.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveSection(item.id)}
                    className={cn(
                      'w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors',
                      activeSection === item.id
                        ? 'bg-indigo-500/10 text-indigo-400'
                        : 'text-gray-400 hover:bg-white/5 hover:text-white'
                    )}
                  >
                    <Icon className="w-5 h-5" />
                    {item.label}
                  </button>
                );
              })}
            </nav>
          </aside>

          {/* Main content */}
          <div className="flex-1 min-w-0">
            {renderContent()}
          </div>
        </div>
      </div>
    </div>
  );
}
