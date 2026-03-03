import { useState } from 'react';
import { X, Lock, Mail, User as UserIcon, Loader2 } from 'lucide-react';
import db from '@/lib/db';
import type { User } from '@/types';
import { cn } from '@/lib/utils';

interface AuthModalProps {
  open: boolean;
  onClose: () => void;
  onAuthenticated: (user: User) => void;
}

export function AuthModal({ open, onClose, onAuthenticated }: AuthModalProps) {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (mode === 'login') {
        const { user } = await db.auth.login(email, password);
        onAuthenticated(user);
      } else {
        const { user } = await db.auth.register(name, email, password);
        onAuthenticated(user);
      }
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-2xl bg-[#0b0b0b] border border-white/10 p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-xs uppercase tracking-wide text-indigo-400">Second Brain</p>
            <h2 className="text-xl font-semibold text-white">Sign in</h2>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex items-center gap-2 text-xs text-gray-500 mb-4">
          <Lock className="w-4 h-4" />
          Private by default. Your data stays scoped to your account.
        </div>

        <div className="flex gap-2 mb-4">
          {(['login', 'register'] as const).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={cn(
                'flex-1 rounded-lg border px-3 py-2 text-sm transition-colors',
                mode === m
                  ? 'border-indigo-500/60 bg-indigo-500/10 text-white'
                  : 'border-white/10 bg-white/5 text-gray-400 hover:bg-white/10'
              )}
            >
              {m === 'login' ? 'Log in' : 'Register'}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          {mode === 'register' && (
            <label className="block">
              <span className="text-sm text-gray-400">Name</span>
              <div className="mt-1 flex items-center gap-2 rounded-lg bg-white/5 border border-white/10 px-3 py-2 focus-within:border-indigo-500/60">
                <UserIcon className="w-4 h-4 text-gray-500" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                  className="flex-1 bg-transparent text-white placeholder-gray-600 outline-none"
                  required
                />
              </div>
            </label>
          )}

          <label className="block">
            <span className="text-sm text-gray-400">Email</span>
            <div className="mt-1 flex items-center gap-2 rounded-lg bg-white/5 border border-white/10 px-3 py-2 focus-within:border-indigo-500/60">
              <Mail className="w-4 h-4 text-gray-500" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="flex-1 bg-transparent text-white placeholder-gray-600 outline-none"
                required
              />
            </div>
          </label>

          <label className="block">
            <span className="text-sm text-gray-400">Password</span>
            <div className="mt-1 flex items-center gap-2 rounded-lg bg-white/5 border border-white/10 px-3 py-2 focus-within:border-indigo-500/60">
              <Lock className="w-4 h-4 text-gray-500" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="flex-1 bg-transparent text-white placeholder-gray-600 outline-none"
                minLength={8}
                required
              />
            </div>
          </label>

          {error && (
            <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-200">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 rounded-lg bg-indigo-600 text-white py-2.5 text-sm hover:bg-indigo-500 transition-colors disabled:opacity-50"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {mode === 'login' ? 'Log in' : 'Create account'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default AuthModal;
