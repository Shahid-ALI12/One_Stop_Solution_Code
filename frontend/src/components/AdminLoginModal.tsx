import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Shield, Lock, User, X, AlertCircle } from 'lucide-react';

interface AdminLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: () => void;
}

export default function AdminLoginModal({ isOpen, onClose, onLoginSuccess }: AdminLoginModalProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!username.trim() || !password.trim()) {
      setError('Please enter both administrative credentials.');
      return;
    }

    setIsSubmitting(true);

    // Simulate small backend verification delay for realism
    setTimeout(() => {
      setIsSubmitting(false);
      onLoginSuccess();
      setUsername('');
      setPassword('');
      onClose();
    }, 600);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div id="admin-login-overlay" className="fixed inset-0 z-50 flex items-center justify-center p-4">
          
          {/* Backdrop Blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-950/70 backdrop-blur-md"
          />

          {/* Frosted Login Panel */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ type: 'spring', stiffness: 260, damping: 25 }}
            className="relative w-full max-w-md bg-white/20 backdrop-blur-2xl border border-white/45 rounded-3xl p-8 shadow-2xl z-10 overflow-hidden"
          >
            {/* Elegant close button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-1.5 hover:bg-white/10 rounded-xl text-slate-500 hover:text-slate-800 transition-all"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Glowing background highlights inside card */}
            <div className="absolute -top-16 -left-16 w-32 h-32 rounded-full bg-indigo-500/15 blur-2xl" />
            <div className="absolute -bottom-16 -right-16 w-32 h-32 rounded-full bg-purple-500/15 blur-2xl" />

            <div className="relative text-center mb-6">
              <div className="inline-flex p-3 bg-indigo-600 text-white rounded-2xl shadow-lg shadow-indigo-600/15 mb-3.5">
                <Shield className="w-5 h-5" />
              </div>
              <h3 className="text-xl font-sans font-extrabold text-slate-900 leading-tight">
                Secure Terminal Login
              </h3>
              <p className="text-xs text-slate-500 font-sans mt-1">
                Enter any administrator credentials to authorize the session.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 relative">
              {error && (
                <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl text-rose-600 text-xs font-sans flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Username Input */}
              <div className="space-y-1">
                <label className="text-[10px] font-mono font-bold uppercase text-slate-500 pl-1">
                  Admin ID / Email
                </label>
                <div className="relative flex items-center">
                  <div className="absolute left-3.5 text-slate-400">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    placeholder="e.g. admin"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full bg-white/45 backdrop-blur-md border border-white/45 rounded-2xl pl-10 pr-4 py-3 text-xs font-sans text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-600/35 transition-all shadow-xs placeholder-slate-400"
                  />
                </div>
              </div>

              {/* Password Input */}
              <div className="space-y-1">
                <label className="text-[10px] font-mono font-bold uppercase text-slate-500 pl-1">
                  Access Key / Password
                </label>
                <div className="relative flex items-center">
                  <div className="absolute left-3.5 text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type="password"
                    required
                    placeholder="e.g. ••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-white/45 backdrop-blur-md border border-white/45 rounded-2xl pl-10 pr-4 py-3 text-xs font-sans text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-600/35 transition-all shadow-xs placeholder-slate-400"
                  />
                </div>
              </div>

              {/* Authorize Session CTA */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="mt-6 w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-500 text-white font-bold rounded-2xl text-xs transition-all flex items-center justify-center space-x-1.5 cursor-pointer shadow-md shadow-indigo-600/10"
              >
                {isSubmitting ? (
                  <>
                    <span className="w-3.5 h-3.5 rounded-full border-2 border-white border-t-transparent animate-spin inline-block mr-1.5" />
                    <span>Verifying Credentials...</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-3.5 h-3.5" />
                    <span>Authorize Session</span>
                  </>
                )}
              </button>
            </form>

            {/* JetBrains Mono security tag line */}
            <div className="mt-6 pt-4 border-t border-white/35 text-center">
              <span className="text-[9px] font-mono font-bold text-slate-400 uppercase tracking-widest">
                AES-256 SESSION ENCRYPTION ACTIVE
              </span>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
