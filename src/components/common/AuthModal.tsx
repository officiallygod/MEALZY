'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Lock, Mail, User, CheckCircle2, RefreshCw, LogOut } from 'lucide-react';
import { syncToGoogleDriveAppData } from '@/lib/sync/google-drive';
import { getActiveGoogleClientId } from '@/config/app-config';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  userEmail?: string;
  onLoginSuccess: (email: string) => void;
  onLogout?: () => void;
}

export default function AuthModal({ isOpen, onClose, userEmail, onLoginSuccess, onLogout }: AuthModalProps) {
  const [tab, setTab] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [statusMsg, setStatusMsg] = useState<{ text: string; type: 'success' | 'info' | 'error' } | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    onLoginSuccess(email);
    onClose();
  };

  const handleGuestContinue = () => {
    onLoginSuccess('Guest Chef');
    onClose();
  };

  const handleGoogleSignIn = () => {
    const activeClientId = getActiveGoogleClientId();

    if (typeof window !== 'undefined' && (window as any).google?.accounts?.oauth2 && activeClientId) {
      try {
        const client = (window as any).google.accounts.oauth2.initTokenClient({
          client_id: activeClientId,
          scope: 'https://www.googleapis.com/auth/drive.appdata',
          callback: async (tokenResponse: any) => {
            if (tokenResponse?.access_token) {
              const ok = await syncToGoogleDriveAppData(tokenResponse.access_token);
              if (ok) {
                onLoginSuccess('Google Account');
                onClose();
              } else {
                setStatusMsg({ text: 'Google Drive sync failed. Check authorized origins.', type: 'error' });
              }
            }
          },
        });
        client.requestAccessToken();
      } catch (err) {
        console.error('Google Sign-In error:', err);
        onLoginSuccess('Google Account');
        onClose();
      }
    } else {
      onLoginSuccess('Google Account');
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto scrollbar-none">
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, y: 15 }}
        transition={{ type: 'spring', damping: 25, stiffness: 350 }}
        className="relative w-full max-w-md bg-white dark:bg-[#16171E] border-2 border-black dark:border-gray-700 rounded-3xl p-6 sm:p-7 shadow-neo-xl text-gray-900 dark:text-white max-h-[92vh] overflow-y-auto scrollbar-none"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute top-5 right-5 w-8 h-8 rounded-xl bg-[#FAF8F5] dark:bg-[#20222E] border-2 border-black dark:border-gray-700 flex items-center justify-center text-gray-700 dark:text-gray-300 hover:text-black dark:hover:text-white shadow-neo-sm active:translate-x-0.5 active:translate-y-0.5 transition-all"
        >
          <X className="w-4 h-4 stroke-[2.5]" />
        </button>

        {/* Header */}
        <div className="text-center mb-5">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-[#FFE600] border-2 border-black text-black font-black text-xl mb-3 shadow-neo">
            M
          </div>
          <h2 className="text-2xl font-funky font-black tracking-tight text-gray-900 dark:text-white">
            {tab === 'login' ? 'WELCOME TO MEALZY' : 'CREATE AN ACCOUNT'}
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 font-bold">
            Sync your meals, track your fridge, and prevent food spoilage.
          </p>
        </div>

        {/* Status Toast */}
        {statusMsg && (
          <div
            className={`mb-4 p-3 rounded-2xl text-xs flex items-center gap-2 border-2 border-black ${
              statusMsg.type === 'success'
                ? 'bg-emerald-100 text-emerald-900'
                : statusMsg.type === 'error'
                ? 'bg-rose-100 text-rose-900'
                : 'bg-purple-100 text-purple-900'
            }`}
          >
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            <span className="font-bold">{statusMsg.text}</span>
          </div>
        )}

        {userEmail ? (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-[#FAF8F5] dark:bg-[#20222E] border-2 border-black dark:border-gray-700 shadow-neo-sm text-center">
              <span className="text-[10px] font-black uppercase tracking-wider text-gray-500 dark:text-gray-400 block mb-1">
                Currently Signed In
              </span>
              <p className="font-funky font-black text-lg text-gray-900 dark:text-white truncate">
                {userEmail}
              </p>
              <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-300 text-[10px] font-black border border-emerald-500">
                <CheckCircle2 className="w-3 h-3" />
                <span>Account Remembered on Device</span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleGoogleSignIn}
              className="w-full py-3 px-4 bg-white dark:bg-[#1A1C24] hover:bg-gray-50 dark:hover:bg-[#252836] text-gray-900 dark:text-white font-black text-xs rounded-2xl border-2 border-black dark:border-gray-700 shadow-neo flex items-center justify-center gap-2.5 transition-colors active:scale-[0.98]"
            >
              <RefreshCw className="w-4 h-4 text-emerald-500" />
              <span>Sync with Google Drive</span>
            </button>

            <button
              type="button"
              onClick={() => {
                if (onLogout) onLogout();
                onClose();
              }}
              className="w-full py-3 bg-rose-500 hover:bg-rose-600 text-white font-black text-xs uppercase tracking-wider rounded-2xl border-2 border-black shadow-neo active:scale-[0.98] transition-colors flex items-center justify-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </button>
          </div>
        ) : (
          <>
            {/* PRIMARY ACTION: 1-TAP GOOGLE LOGIN */}
            <button
              type="button"
              onClick={handleGoogleSignIn}
              className="w-full py-3 px-4 bg-white hover:bg-gray-50 text-gray-900 font-black text-xs rounded-2xl border-2 border-black shadow-neo flex items-center justify-center gap-2.5 transition-colors active:scale-[0.98]"
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
              <span className="uppercase tracking-wider">Continue with Google</span>
            </button>

        <div className="relative flex py-4 items-center">
          <div className="flex-grow border-t-2 border-black/10 dark:border-gray-800"></div>
          <span className="flex-shrink mx-3 text-[10px] text-gray-500 font-black uppercase tracking-wider">
            or sign in with email
          </span>
          <div className="flex-grow border-t-2 border-black/10 dark:border-gray-800"></div>
        </div>

        {/* Tab Switcher for Email */}
        <div className="flex bg-[#FAF8F5] dark:bg-[#20222E] p-1.5 rounded-2xl mb-4 border-2 border-black dark:border-gray-700 shadow-neo-sm">
          <button
            type="button"
            onClick={() => setTab('login')}
            className={`flex-1 py-1.5 text-xs font-black rounded-xl transition-all ${
              tab === 'login' ? 'bg-[#FFE600] text-black border-2 border-black shadow-neo-sm' : 'text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white'
            }`}
          >
            Log In
          </button>
          <button
            type="button"
            onClick={() => setTab('register')}
            className={`flex-1 py-1.5 text-xs font-black rounded-xl transition-all ${
              tab === 'register' ? 'bg-[#FFE600] text-black border-2 border-black shadow-neo-sm' : 'text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white'
            }`}
          >
            Register
          </button>
        </div>

        {/* Email Form */}
        <form onSubmit={handleSubmit} className="space-y-3">
          {tab === 'register' && (
            <div>
              <label className="block text-[11px] font-black text-gray-500 uppercase mb-1">Your Name</label>
              <div className="relative">
                <User className="absolute left-3.5 top-3 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Allen"
                  className="w-full bg-[#FAF8F5] dark:bg-[#20222E] border-2 border-black dark:border-gray-700 rounded-xl pl-10 pr-4 py-2 text-xs text-gray-900 dark:text-white focus:outline-none"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-[11px] font-black text-gray-500 uppercase mb-1">Email</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-3 w-4 h-4 text-gray-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="chef@mealzy.app"
                className="w-full bg-[#FAF8F5] dark:bg-[#20222E] border-2 border-black dark:border-gray-700 rounded-xl pl-10 pr-4 py-2 text-xs text-gray-900 dark:text-white focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-black text-gray-500 uppercase mb-1">Password</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3 w-4 h-4 text-gray-400" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-[#FAF8F5] dark:bg-[#20222E] border-2 border-black dark:border-gray-700 rounded-xl pl-10 pr-4 py-2 text-xs text-gray-900 dark:text-white focus:outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-[#FF5500] hover:bg-[#ff681a] text-white font-black text-xs uppercase tracking-wider rounded-2xl border-2 border-black shadow-neo active:scale-[0.98] transition-colors mt-1"
          >
            {tab === 'login' ? 'LOG IN' : 'CREATE ACCOUNT'}
          </button>
        </form>

        {/* Guest Mode Instant Entry */}
        <div className="mt-4 pt-3 border-t-2 border-black/10 dark:border-gray-800 flex items-center justify-between text-xs">
          <span className="text-gray-500 text-[11px] font-bold">Just planning meals?</span>
          <button
            type="button"
            onClick={handleGuestContinue}
            className="text-gray-900 dark:text-[#D4FF00] hover:underline font-black text-xs uppercase tracking-wider"
          >
            Continue as Guest (100% Offline) →
          </button>
        </div>
          </>
        )}
      </motion.div>
    </div>
  );
}
