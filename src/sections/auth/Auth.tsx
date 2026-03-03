import { useState } from 'react';
import { ArrowLeft, Lock, Mail, Sparkles, User as UserIcon } from 'lucide-react';
import db from '@/lib/db';
import GlassCard from '@/components/animations/GlassCard';
import { cn } from '@/lib/utils';
import type { User } from '@/types';

interface AuthProps {
  onBack: () => void;
  onSuccess: (payload: { token: string; user: User }) => void;
}

type Mode = 'login' | 'register';

export function Auth({ onBack, onSuccess }: AuthProps) {
  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    try {
      if (mode === 'login') {
        const result = await db.auth.login(email, password);
        onSuccess({ token: result.token, user: result.user });
      } else {
        const result = await db.auth.register(name, email, password);
        onSuccess({ token: result.token, user: result.user });
      }
    } catch (err: any) {
      setError(err?.message || 'Something went wrong');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-black via-slate-950 to-[#0b0b1a] text-white overflow-hidden">
      <div className="absolute inset-0 opacity-30 bg-[radial-gradient(circle_at_top,_rgba(99,102,241,0.25),_transparent_45%),radial-gradient(circle_at_30%_20%,_rgba(236,72,153,0.15),_transparent_35%)]" />

      <div className="relative max-w-5xl mx-auto px-6 py-12">
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to landing
          </button>
          <div className="flex items-center gap-2 text-gray-400">
            <Sparkles className="w-4 h-4 text-indigo-400" />
            <span className="text-sm">Secure your Second Brain</span>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-8 items-stretch">
          <GlassCard className="p-8 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-transparent" />
            <div className="relative">
              <p className="text-xs uppercase tracking-[0.3em] text-indigo-300 mb-4">Identity Layer</p>
              <h1 className="text-3xl font-semibold text-white mb-3">Log in or create your workspace</h1>
              <p className="text-gray-400 leading-relaxed mb-6">
                We keep auth lightweight: password hashing, JWT sessions, and API key fallback for automation. Sign in to
                keep your knowledge, tags, and graphs scoped to you.
              </p>

              <div className="flex gap-2 mb-6">
                {(
                  [
                    { id: 'login', label: 'Sign In' },
                    { id: 'register', label: 'Create Account' },
                  ] as { id: Mode; label: string }[]
                ).map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setMode(tab.id)}
                    className={cn(
                      'px-4 py-2 rounded-full text-sm transition-colors',
                      mode === tab.id
                        ? 'bg-white text-black'
                        : 'bg-white/5 text-gray-300 hover:bg-white/10'
                    )}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {mode === 'register' && (
                  <label className="block">
                    <span className="text-sm text-gray-400">Full name</span>
                    <div className="mt-2 flex items-center gap-3 px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus-within:border-indigo-500/60">
                      <UserIcon className="w-4 h-4 text-gray-500" />
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Ada Lovelace"
                        className="bg-transparent outline-none flex-1 text-white placeholder:text-gray-500"
                        required
                      />
                    </div>
                  </label>
                )}

                <label className="block">
                  <span className="text-sm text-gray-400">Email</span>
                  <div className="mt-2 flex items-center gap-3 px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus-within:border-indigo-500/60">
                    <Mail className="w-4 h-4 text-gray-500" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="bg-transparent outline-none flex-1 text-white placeholder:text-gray-500"
                      required
                    />
                  </div>
                </label>

                <label className="block">
                  <span className="text-sm text-gray-400">Password</span>
                  <div className="mt-2 flex items-center gap-3 px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus-within:border-indigo-500/60">
                    <Lock className="w-4 h-4 text-gray-500" />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Minimum 8 characters"
                      className="bg-transparent outline-none flex-1 text-white placeholder:text-gray-500"
                      required
                      minLength={8}
                    />
                  </div>
                </label>

                {error && (
                  <div className="text-xs text-red-300 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-medium hover:shadow-[0_10px_40px_rgba(99,102,241,0.25)] transition-transform hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Working...' : mode === 'login' ? 'Sign in' : 'Create account'}
                </button>

                <p className="text-xs text-gray-500 text-center">
                  Passwords are hashed with bcrypt; sessions are JWT-based. Bring your own API key if you prefer automation.
                </p>
              </form>
            </div>
          </GlassCard>

          <div className="space-y-4 self-stretch flex flex-col">
            <GlassCard className="p-6 flex-1">
              <div className="flex items-center gap-2 text-sm text-indigo-300 mb-4">
                <Sparkles className="w-4 h-4" />
                <span>What you get</span>
              </div>
              <ul className="space-y-3 text-gray-300">
                <li className="flex gap-3">
                  <span className="h-2 w-2 rounded-full bg-indigo-400 mt-2" />
                  <div>
                    <p className="text-white font-medium">Scoped knowledge vault</p>
                    <p className="text-sm text-gray-500">Notes, uploads, AI summaries, and graphs tied to your account.</p>
                  </div>
                </li>
                <li className="flex gap-3">
                  <span className="h-2 w-2 rounded-full bg-indigo-400 mt-2" />
                  <div>
                    <p className="text-white font-medium">API + UI parity</p>
                    <p className="text-sm text-gray-500">Same endpoints power the dashboard and public integrations.</p>
                  </div>
                </li>
                <li className="flex gap-3">
                  <span className="h-2 w-2 rounded-full bg-indigo-400 mt-2" />
                  <div>
                    <p className="text-white font-medium">Secure by default</p>
                    <p className="text-sm text-gray-500">JWT or API key access, CORS-locked origins, and server-side AI calls.</p>
                  </div>
                </li>
              </ul>
            </GlassCard>

            <GlassCard className="p-4">
              <p className="text-sm text-gray-400">Need SSO later? The auth layer is minimal and swappable—replace it with OAuth or your IdP without touching the knowledge API.</p>
            </GlassCard>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Auth;
