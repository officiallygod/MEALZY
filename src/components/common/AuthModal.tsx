'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Lock, Mail, User, Cloud, Sparkles, Key, CheckCircle2, Download, Upload, ExternalLink, ShieldCheck, ChevronDown, ChevronUp } from 'lucide-react';
import {
  downloadLocalBackupFile,
  uploadAndRestoreBackup,
  getSavedGoogleClientId,
  saveGoogleClientId,
  syncToGoogleDriveAppData,
} from '@/lib/sync/google-drive';
import { APP_CONFIG, getActiveGoogleClientId } from '@/config/app-config';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  userEmail?: string;
  onLoginSuccess: (email: string) => void;
}

export default function AuthModal({ isOpen, onClose, userEmail, onLoginSuccess }: AuthModalProps) {
  const [tab, setTab] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [statusMsg, setStatusMsg] = useState<{ text: string; type: 'success' | 'info' | 'error' } | null>(null);
  const [showDevPanel, setShowDevPanel] = useState(false);
  const [devClientId, setDevClientId] = useState('');

  useEffect(() => {
    if (isOpen) {
      setDevClientId(getActiveGoogleClientId());
    }
  }, [isOpen]);

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

  const handleSaveDevKey = () => {
    saveGoogleClientId(devClientId);
    setStatusMsg({
      text: 'Saved Google Client ID! All users on this browser can now 1-tap sign in.',
      type: 'success',
    });
    setTimeout(() => setStatusMsg(null), 4000);
  };

  const handleGoogleSignIn = () => {
    const activeClientId = getActiveGoogleClientId() || devClientId;

    if (!activeClientId) {
      setStatusMsg({
        text: 'Developer notice: Please set your Google Client ID in src/config/app-config.ts or below so your users can 1-tap sign in!',
        type: 'info',
      });
      setShowDevPanel(true);
      return;
    }

    // Trigger Google OAuth via Google Identity Services
    if (typeof window !== 'undefined' && (window as any).google?.accounts?.oauth2) {
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
    } else {
      // Smooth fallback if running offline or local simulation
      onLoginSuccess('Google Account');
      onClose();
    }
  };

  const handleBackupDownload = async () => {
    await downloadLocalBackupFile();
    setStatusMsg({ text: 'Downloaded mealzy_backup.json!', type: 'success' });
    setTimeout(() => setStatusMsg(null), 3000);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      await uploadAndRestoreBackup(file);
      setStatusMsg({ text: 'Backup restored! Reloading meals...', type: 'success' });
      setTimeout(() => window.location.reload(), 1000);
    } catch {
      setStatusMsg({ text: 'Error reading backup JSON.', type: 'error' });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.92, y: 20 }}
        transition={{ type: 'spring', damping: 25, stiffness: 350 }}
        className="relative w-full max-w-md bg-[#12141B] border-2 border-black rounded-3xl p-6 shadow-[6px_6px_0px_#D4FF00] text-white max-h-[92vh] overflow-y-auto"
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
            {tab === 'login' ? 'WELCOME TO MEALZY' : 'CREATE AN ACCOUNT'}
          </h2>
          <p className="text-xs text-gray-400 mt-1">
            Sync your meals, track your fridge, and never let food rot.
          </p>
        </div>

        {/* Status Toast */}
        {statusMsg && (
          <div
            className={`mb-4 p-3 rounded-2xl text-xs flex items-center gap-2 border ${
              statusMsg.type === 'success'
                ? 'bg-[#22C55E]/20 border-[#22C55E]/40 text-[#22C55E]'
                : statusMsg.type === 'error'
                ? 'bg-[#FF5C5C]/20 border-[#FF5C5C]/40 text-[#FF5C5C]'
                : 'bg-[#C084FC]/20 border-[#C084FC]/40 text-[#C084FC]'
            }`}
          >
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            <span>{statusMsg.text}</span>
          </div>
        )}

        {/* PRIMARY ACTION: 1-TAP GOOGLE LOGIN FOR VISITORS */}
        <button
          type="button"
          onClick={handleGoogleSignIn}
          className="w-full py-3 px-4 bg-white hover:bg-gray-100 text-gray-900 font-extrabold text-xs rounded-xl shadow-neo flex items-center justify-center gap-2.5 transition-all active:translate-x-0.5 active:translate-y-0.5"
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

        <div className="relative flex py-4 items-center">
          <div className="flex-grow border-t border-gray-800"></div>
          <span className="flex-shrink mx-3 text-[10px] text-gray-500 font-black uppercase tracking-wider">
            or sign in with email
          </span>
          <div className="flex-grow border-t border-gray-800"></div>
        </div>

        {/* Tab Switcher for Email */}
        <div className="flex bg-[#181A24] p-1 rounded-2xl mb-4 border border-gray-800">
          <button
            onClick={() => setTab('login')}
            className={`flex-1 py-1.5 text-xs font-bold rounded-xl transition-all ${
              tab === 'login' ? 'bg-[#D4FF00] text-black shadow-sm' : 'text-gray-400 hover:text-white'
            }`}
          >
            Log In
          </button>
          <button
            onClick={() => setTab('register')}
            className={`flex-1 py-1.5 text-xs font-bold rounded-xl transition-all ${
              tab === 'register' ? 'bg-[#D4FF00] text-black shadow-sm' : 'text-gray-400 hover:text-white'
            }`}
          >
            Register
          </button>
        </div>

        {/* Email Form */}
        <form onSubmit={handleSubmit} className="space-y-3">
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
                  className="w-full bg-[#1A1D27] border border-gray-700 rounded-xl pl-10 pr-4 py-2 text-xs text-white focus:outline-none focus:border-[#D4FF00]"
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
                className="w-full bg-[#1A1D27] border border-gray-700 rounded-xl pl-10 pr-4 py-2 text-xs text-white focus:outline-none focus:border-[#D4FF00]"
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
                className="w-full bg-[#1A1D27] border border-gray-700 rounded-xl pl-10 pr-4 py-2 text-xs text-white focus:outline-none focus:border-[#D4FF00]"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-2.5 bg-[#D4FF00] hover:bg-[#c3ed00] text-black font-black text-xs rounded-xl shadow-neo transition-all active:translate-x-0.5 active:translate-y-0.5 mt-1"
          >
            {tab === 'login' ? 'LOG IN' : 'CREATE ACCOUNT'}
          </button>
        </form>

        {/* Guest Mode Instant Entry */}
        <div className="mt-3 pt-3 border-t border-gray-800 flex items-center justify-between text-xs">
          <span className="text-gray-400 text-[11px]">Just browsing?</span>
          <button
            type="button"
            onClick={handleGuestContinue}
            className="text-[#D4FF00] hover:underline font-bold text-xs"
          >
            Continue as Guest (100% Offline) →
          </button>
        </div>

        {/* COLLAPSIBLE DEVELOPER SETUP (FOR THE APP OWNER) */}
        <div className="mt-5 pt-3 border-t border-gray-800/80">
          <button
            type="button"
            onClick={() => setShowDevPanel(!showDevPanel)}
            className="w-full flex items-center justify-between text-[11px] font-bold text-gray-400 hover:text-white"
          >
            <span className="flex items-center gap-1.5">
              <Key className="w-3.5 h-3.5 text-[#C084FC]" />
              <span>Owner & Developer Settings</span>
            </span>
            {showDevPanel ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          <AnimatePresence>
            {showDevPanel && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-3 p-3.5 rounded-2xl bg-[#181A24] border border-gray-800 space-y-3 text-xs overflow-hidden"
              >
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-white font-bold text-[11px]">Your Google OAuth Client ID:</span>
                    <a
                      href="https://console.cloud.google.com/apis/credentials"
                      target="_blank"
                      rel="noreferrer"
                      className="text-[10px] text-[#38BDF8] hover:underline flex items-center gap-1"
                    >
                      <span>Get from Google</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                  <input
                    type="text"
                    value={devClientId}
                    onChange={(e) => setDevClientId(e.target.value)}
                    placeholder="xxxx-yyyy.apps.googleusercontent.com"
                    className="w-full bg-[#12141B] border border-gray-700 rounded-xl px-2.5 py-1.5 text-[11px] text-white focus:outline-none focus:border-[#D4FF00]"
                  />
                  <p className="text-[10px] text-gray-400 mt-1">
                    Once set here (or in <code>src/config/app-config.ts</code> / GitHub Secrets), all visitors can log in with 1 tap.
                  </p>
                  <button
                    type="button"
                    onClick={handleSaveDevKey}
                    className="mt-2 w-full py-1.5 bg-[#C084FC] hover:bg-[#b06df7] text-black font-black text-xs rounded-xl transition-all"
                  >
                    Save Key
                  </button>
                </div>

                {/* Local Backup Download/Restore */}
                <div className="pt-2 border-t border-gray-800 flex gap-2">
                  <button
                    type="button"
                    onClick={handleBackupDownload}
                    className="flex-1 py-1.5 px-2 bg-[#262938] hover:bg-[#34384c] text-white font-bold rounded-lg text-[10px] flex items-center justify-center gap-1"
                  >
                    <Download className="w-3 h-3 text-[#D4FF00]" />
                    <span>Download JSON</span>
                  </button>
                  <label className="flex-1 py-1.5 px-2 bg-[#262938] hover:bg-[#34384c] text-white font-bold rounded-lg text-[10px] flex items-center justify-center gap-1 cursor-pointer">
                    <Upload className="w-3 h-3 text-[#C084FC]" />
                    <span>Restore JSON</span>
                    <input type="file" accept=".json" onChange={handleFileUpload} className="hidden" />
                  </label>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
