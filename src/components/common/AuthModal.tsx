'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Lock, Mail, User, Cloud, Sparkles, Key, CheckCircle2, Download, Upload } from 'lucide-react';
import { downloadLocalBackupFile, uploadAndRestoreBackup } from '@/lib/sync/google-drive';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  userEmail?: string;
  onLoginSuccess: (email: string) => void;
}

export default function AuthModal({ isOpen, onClose, userEmail, onLoginSuccess }: AuthModalProps) {
  const [tab, setTab] = useState<'login' | 'register' | 'cloud-keys'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);
  const [googleClientId, setGoogleClientId] = useState('');
  const [supabaseUrl, setSupabaseUrl] = useState('');
  const [supabaseKey, setSupabaseKey] = useState('');
  const [statusMsg, setStatusMsg] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    onLoginSuccess(email);
    onClose();
  };

  const handleGoogleSignInSimulated = () => {
    // Instant Google OAuth flow simulator for demo / local
    onLoginSuccess('user@gmail.com');
    onClose();
  };

  const handleBackupDownload = async () => {
    await downloadLocalBackupFile();
    setStatusMsg('Downloaded encrypted mealzy_backup.json!');
    setTimeout(() => setStatusMsg(''), 4000);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      await uploadAndRestoreBackup(file);
      setStatusMsg('Backup restored! Reloading meals...');
      setTimeout(() => window.location.reload(), 1200);
    } catch {
      setStatusMsg('Error reading backup JSON file.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.92, y: 20 }}
        transition={{ type: 'spring', damping: 25, stiffness: 350 }}
        className="relative w-full max-w-md bg-[#12141B] border-2 border-black rounded-3xl p-6 shadow-[6px_6px_0px_#D4FF00] text-white"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 w-8 h-8 rounded-full bg-[#1C1F2B] border border-gray-700 flex items-center justify-center text-gray-400 hover:text-white hover:border-[#D4FF00] transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-[#D4FF00] text-black font-black text-xl mb-3 shadow-neo">
            M
          </div>
          <h2 className="text-2xl font-funky font-black tracking-tight text-white">
            {tab === 'cloud-keys' ? 'ZERO-COST CLOUD SETUP' : tab === 'login' ? 'WELCOME BACK' : 'JOIN MEALZY'}
          </h2>
          <p className="text-xs text-gray-400 mt-1">
            {tab === 'cloud-keys'
              ? 'Free Google Drive AppData Sync & Supabase config'
              : 'Keep your meals synced across iOS, Android & Browser'}
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-[#181A24] p-1 rounded-2xl mb-6 border border-gray-800">
          <button
            onClick={() => setTab('login')}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
              tab === 'login' ? 'bg-[#D4FF00] text-black shadow-neo' : 'text-gray-400 hover:text-white'
            }`}
          >
            Log In
          </button>
          <button
            onClick={() => setTab('register')}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
              tab === 'register' ? 'bg-[#D4FF00] text-black shadow-neo' : 'text-gray-400 hover:text-white'
            }`}
          >
            Register
          </button>
          <button
            onClick={() => setTab('cloud-keys')}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
              tab === 'cloud-keys' ? 'bg-[#C084FC] text-black shadow-neo' : 'text-gray-400 hover:text-white'
            }`}
          >
            Free Cloud
          </button>
        </div>

        {/* TAB 1 & 2: LOGIN / REGISTER */}
        {tab !== 'cloud-keys' ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            {tab === 'register' && (
              <div>
                <label className="block text-[11px] font-bold text-gray-400 uppercase mb-1">Your Name</label>
                <div className="relative">
                  <User className="absolute left-3.5 top-3 w-4 h-4 text-gray-500" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Julia"
                    className="w-full bg-[#1A1D27] border border-gray-700 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#D4FF00] transition-colors"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-[11px] font-bold text-gray-400 uppercase mb-1">Email</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3 w-4 h-4 text-gray-500" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="chef@mealzy.app"
                  className="w-full bg-[#1A1D27] border border-gray-700 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#D4FF00] transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-gray-400 uppercase mb-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3 w-4 h-4 text-gray-500" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-[#1A1D27] border border-gray-700 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#D4FF00] transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-[#D4FF00] hover:bg-[#c3ed00] text-black font-black text-sm rounded-xl shadow-neo transition-all active:translate-x-0.5 active:translate-y-0.5 mt-2"
            >
              {tab === 'login' ? 'LOG IN NOW' : 'CREATE ACCOUNT'}
            </button>

            <div className="relative flex py-2 items-center">
              <div className="flex-grow border-t border-gray-800"></div>
              <span className="flex-shrink mx-3 text-[11px] text-gray-500 font-bold uppercase">or free google sign in</span>
              <div className="flex-grow border-t border-gray-800"></div>
            </div>

            {/* Google OAuth Button */}
            <button
              type="button"
              onClick={handleGoogleSignInSimulated}
              className="w-full py-2.5 px-4 bg-white hover:bg-gray-100 text-gray-900 font-bold text-xs rounded-xl shadow-neo flex items-center justify-center gap-2 transition-all active:translate-x-0.5 active:translate-y-0.5"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 10.03 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                />
              </svg>
              <span>Continue with Google</span>
            </button>
          </form>
        ) : (
          /* TAB 3: ZERO-COST CLOUD & KEYS EXPLAINER */
          <div className="space-y-4 text-xs">
            <div className="p-3 rounded-2xl bg-[#181A24] border border-[#C084FC]/40">
              <div className="flex items-center gap-2 text-[#C084FC] font-bold mb-1">
                <Cloud className="w-4 h-4" />
                <span>Google Drive AppData Sync ($0 / Unlimited)</span>
              </div>
              <p className="text-gray-300 text-[11px] leading-relaxed">
                When you log in with Google, MEALZY can sync directly to your private Google Drive AppData folder. You pay $0 for database hosting, and your data stays 100% private to you!
              </p>
            </div>

            {/* Manual Backup Download/Restore */}
            <div className="p-3 rounded-2xl bg-[#181A24] border border-gray-800 space-y-2">
              <span className="font-bold text-white text-[11px]">Instant Local JSON Sync</span>
              <div className="flex gap-2">
                <button
                  onClick={handleBackupDownload}
                  className="flex-1 py-2 px-3 bg-[#262938] hover:bg-[#323648] text-white font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all"
                >
                  <Download className="w-3.5 h-3.5 text-[#D4FF00]" />
                  <span>Download Backup</span>
                </button>
                <label className="flex-1 py-2 px-3 bg-[#262938] hover:bg-[#323648] text-white font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer">
                  <Upload className="w-3.5 h-3.5 text-[#C084FC]" />
                  <span>Upload Backup</span>
                  <input type="file" accept=".json" onChange={handleFileUpload} className="hidden" />
                </label>
              </div>
            </div>

            {statusMsg && (
              <div className="p-2.5 rounded-xl bg-[#22C55E]/20 border border-[#22C55E]/40 text-[#22C55E] text-[11px] flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                <span>{statusMsg}</span>
              </div>
            )}
          </div>
        )}
      </motion.div>
    </div>
  );
}
