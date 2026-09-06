'use client';

import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle2, RefreshCw, LogOut, ShieldCheck, Key, AlertCircle } from 'lucide-react';
import { syncToGoogleDriveAppData } from '@/lib/sync/google-drive';
import { getActiveGoogleClientId } from '@/config/app-config';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  userEmail?: string;
  userName?: string;
  userAvatar?: string;
  onLoginSuccess: (email: string, name?: string, avatar?: string) => void;
  onLogout?: () => void;
}

// Decode standard Google Identity Services JWT credential in browser with zero backend
function decodeJwt(token: string): { email?: string; name?: string; picture?: string } {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      window
        .atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    console.error('Failed to parse Google JWT:', e);
    return {};
  }
}

export default function AuthModal({
  isOpen,
  onClose,
  userEmail,
  userName,
  userAvatar,
  onLoginSuccess,
  onLogout,
}: AuthModalProps) {
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ text: string; type: 'success' | 'info' | 'error' } | null>(null);
  const [showConfig, setShowConfig] = useState(false);
  const [customClientId, setCustomClientId] = useState('');
  const googleBtnRef = useRef<HTMLDivElement>(null);

  const activeClientId = customClientId.trim() || getActiveGoogleClientId();

  // Load Google Identity Services script dynamically if not present
  useEffect(() => {
    if (!isOpen) return;

    const existingScript = document.getElementById('google-gsi-client');
    if (!existingScript && !(window as any).google?.accounts) {
      const script = document.createElement('script');
      script.id = 'google-gsi-client';
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = () => {
        initGoogleIdentity();
      };
      document.head.appendChild(script);
    } else {
      initGoogleIdentity();
    }
  }, [isOpen, activeClientId, userEmail]);

  const initGoogleIdentity = () => {
    if (typeof window === 'undefined' || !(window as any).google?.accounts?.id || !activeClientId) return;
    if (userEmail) return;

    try {
      (window as any).google.accounts.id.initialize({
        client_id: activeClientId,
        callback: (response: any) => {
          if (response?.credential) {
            const decoded = decodeJwt(response.credential);
            const email = decoded.email || 'chef@mealzy.app';
            const name = decoded.name || 'Google Chef';
            const avatar = decoded.picture;
            onLoginSuccess(email, name, avatar);
            onClose();
          }
        },
        auto_select: false,
        cancel_on_tap_outside: true,
      });

      if (googleBtnRef.current) {
        googleBtnRef.current.innerHTML = '';
        (window as any).google.accounts.id.renderButton(googleBtnRef.current, {
          theme: 'filled_black',
          size: 'large',
          shape: 'pill',
          width: 320,
          text: 'continue_with',
        });
      }
    } catch (err) {
      console.warn('Google Identity initialization notice:', err);
    }
  };

  if (!isOpen) return null;

  // Real Google OAuth2 Popup Dialog
  const handleGoogleSignInPopup = () => {
    setStatusMsg(null);
    setIsSigningIn(true);

    if (typeof window === 'undefined') return;

    const googleObj = (window as any).google;
    if (!googleObj?.accounts?.oauth2) {
      setStatusMsg({
        text: 'Loading Google Security Services... Please tap again in 2 seconds.',
        type: 'info',
      });
      setIsSigningIn(false);
      return;
    }

    try {
      const client = googleObj.accounts.oauth2.initTokenClient({
        client_id: activeClientId,
        scope: 'email profile https://www.googleapis.com/auth/drive.appdata',
        prompt: 'select_account',
        callback: async (tokenResponse: any) => {
          if (tokenResponse?.error) {
            console.error('Google OAuth error:', tokenResponse);
            setStatusMsg({
              text: `Google Sign-In canceled or blocked (${tokenResponse.error_description || tokenResponse.error}).`,
              type: 'error',
            });
            setIsSigningIn(false);
            return;
          }

          if (tokenResponse?.access_token) {
            try {
              localStorage.setItem('mealzy_google_access_token', tokenResponse.access_token);

              // 1. Fetch user profile from Google UserInfo endpoint
              const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
              });

              if (userInfoRes.ok) {
                const profile = await userInfoRes.json();
                const email = profile.email || 'chef@google.com';
                const name = profile.name || profile.given_name || 'Google Chef';
                const avatar = profile.picture;

                // 2. Perform silent initial Google Drive sync
                await syncToGoogleDriveAppData(tokenResponse.access_token);

                onLoginSuccess(email, name, avatar);
                onClose();
              } else {
                onLoginSuccess('Google Account', 'Google Chef');
                onClose();
              }
            } catch (fetchErr) {
              console.error('Failed to fetch Google profile:', fetchErr);
              onLoginSuccess('Google Account', 'Google Chef');
              onClose();
            } finally {
              setIsSigningIn(false);
            }
          }
        },
      });

      client.requestAccessToken({ prompt: 'select_account' });
    } catch (err: any) {
      console.error('Google Sign-In exception:', err);
      setStatusMsg({
        text: 'Could not open Google Login. Ensure popups are allowed for this site.',
        type: 'error',
      });
      setIsSigningIn(false);
    }
  };

  const handleManualSync = async () => {
    setIsSyncing(true);
    setStatusMsg(null);

    const token = localStorage.getItem('mealzy_google_access_token');
    if (token) {
      const ok = await syncToGoogleDriveAppData(token);
      setIsSyncing(false);
      if (ok) {
        setStatusMsg({ text: 'All meal plans safely synced to your Google Drive!', type: 'success' });
      } else {
        handleGoogleSignInPopup();
      }
    } else {
      handleGoogleSignInPopup();
    }
  };

  const handleSaveCustomClientId = (e: React.FormEvent) => {
    e.preventDefault();
    if (customClientId.trim()) {
      localStorage.setItem('mealzy_dev_google_client_id', customClientId.trim());
      setStatusMsg({ text: 'Custom Google Client ID saved!', type: 'success' });
      initGoogleIdentity();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto scrollbar-none">
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, y: 15 }}
        transition={{ type: 'spring', damping: 25, stiffness: 350 }}
        className="relative w-full max-w-md bg-white dark:bg-[#16171E] border-2 border-black dark:border-gray-700 rounded-3xl p-6 sm:p-7 shadow-neo-xl text-gray-900 dark:text-white max-h-[92vh] overflow-y-auto scrollbar-none select-none"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute top-5 right-5 w-8 h-8 rounded-xl bg-[#FAF8F5] dark:bg-[#20222E] border-2 border-black dark:border-gray-700 flex items-center justify-center text-gray-700 dark:text-gray-300 hover:text-black dark:hover:text-white shadow-neo-sm active:scale-95 transition-colors cursor-pointer"
        >
          <X className="w-4 h-4 stroke-[2.5]" />
        </button>

        {/* Brand Header */}
        <div className="text-center mb-5">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-[#FF5500] border-2 border-black text-white font-black text-xl mb-3 shadow-neo">
            <svg viewBox="0 0 32 32" className="w-6 h-6 fill-none">
              <path d="M7 23V9.5L13.5 17.5L20 9.5V23" stroke="#FFFFFF" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M25 5L25.8 7.2L28 8L25.8 8.8L25 11L24.2 8.8L22 8L24.2 7.2Z" fill="#D4FF00" stroke="#000000" strokeWidth="0.8" />
            </svg>
          </div>
          <h2 className="text-2xl font-funky font-black tracking-tight text-gray-900 dark:text-white">
            {userEmail ? 'YOUR MEALZY ACCOUNT' : 'SIGN IN WITH GOOGLE'}
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 font-bold">
            100% Serverless &amp; Private • Direct Google Drive Cloud Sync
          </p>
        </div>

        {/* Status Toast Notification */}
        {statusMsg && (
          <div
            className={`mb-4 p-3 rounded-2xl text-xs flex items-center gap-2 border-2 border-black ${
              statusMsg.type === 'success'
                ? 'bg-emerald-100 text-emerald-900 border-emerald-600'
                : statusMsg.type === 'error'
                ? 'bg-rose-100 text-rose-900 border-rose-600'
                : 'bg-amber-100 text-amber-900 border-amber-600'
            }`}
          >
            {statusMsg.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-700" />
            ) : (
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-700" />
            )}
            <span className="font-bold flex-1">{statusMsg.text}</span>
          </div>
        )}

        {userEmail ? (
          /* ========================================================================= */
          /* LOGGED IN ACCOUNT VIEW                                                   */
          /* ========================================================================= */
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-[#FAF8F5] dark:bg-[#20222E] border-2 border-black dark:border-gray-700 shadow-neo-sm text-center">
              {/* User Avatar */}
              <div className="w-14 h-14 mx-auto rounded-2xl bg-[#D4FF00] border-2 border-black shadow-neo-sm flex items-center justify-center text-xl font-black mb-2 overflow-hidden">
                {userAvatar ? (
                  <img src={userAvatar} alt={userName || 'Chef'} className="w-full h-full object-cover" />
                ) : (
                  <span>{userName ? userName[0].toUpperCase() : userEmail[0].toUpperCase()}</span>
                )}
              </div>

              {userName && (
                <p className="font-funky font-black text-xl text-gray-900 dark:text-white truncate">
                  {userName}
                </p>
              )}
              <p className="text-xs font-bold text-gray-600 dark:text-gray-300 truncate mt-0.5">
                {userEmail}
              </p>

              <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-300 text-[10px] font-black border border-emerald-500 shadow-neo-sm">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Google Account Remembered on This Device</span>
              </div>
            </div>

            {/* Privacy Guarantee Card */}
            <div className="p-3.5 rounded-2xl bg-[#FFFDF0] dark:bg-[#1A1E14] border-2 border-black dark:border-lime-500/30 text-xs space-y-1.5">
              <div className="flex items-center gap-1.5 font-black text-lime-900 dark:text-lime-300 uppercase tracking-wider text-[10px]">
                <ShieldCheck className="w-3.5 h-3.5 text-lime-600" />
                <span>Zero Backend Server Database</span>
              </div>
              <p className="text-[11px] text-gray-700 dark:text-gray-300 leading-relaxed font-medium">
                Your data is stored strictly in your browser and synced directly to your personal Google Drive AppData folder. Nobody else has access to your recipes or meal plans.
              </p>
            </div>

            {/* Sync Now Button */}
            <button
              type="button"
              onClick={handleManualSync}
              disabled={isSyncing}
              className="w-full py-3 px-4 bg-white dark:bg-[#1E202B] hover:bg-gray-50 dark:hover:bg-[#252836] text-gray-900 dark:text-white font-black text-xs rounded-2xl border-2 border-black dark:border-gray-700 shadow-neo flex items-center justify-center gap-2.5 transition-colors active:scale-[0.98] cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 text-emerald-500 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? 'Syncing with Google Drive...' : 'Sync Now with Google Drive'}</span>
            </button>

            {/* Sign Out Button */}
            <button
              type="button"
              onClick={() => {
                if (onLogout) onLogout();
                onClose();
              }}
              className="w-full py-3 bg-rose-500 hover:bg-rose-600 text-white font-black text-xs uppercase tracking-wider rounded-2xl border-2 border-black shadow-neo active:scale-[0.98] transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out of Google Account</span>
            </button>
          </div>
        ) : (
          /* ========================================================================= */
          /* EXCLUSIVE GOOGLE LOGIN SCREEN (NO EMAIL / NO BACKEND)                    */
          /* ========================================================================= */
          <div className="space-y-4">
            {/* Zero-Backend Information Card */}
            <div className="p-3.5 rounded-2xl bg-[#FFFDF0] dark:bg-[#1A1E14] border-2 border-black dark:border-lime-500/30 text-xs space-y-1.5">
              <div className="flex items-center gap-1.5 font-black text-lime-900 dark:text-lime-300 uppercase tracking-wider text-[10px]">
                <ShieldCheck className="w-3.5 h-3.5 text-lime-600" />
                <span>100% Serverless &amp; Secure</span>
              </div>
              <p className="text-[11px] text-gray-700 dark:text-gray-300 leading-relaxed font-medium">
                Mealzy has <span className="font-black text-black dark:text-white">no backend servers</span>. Login is powered directly by Google to sync your meals to your personal Google Drive.
              </p>
            </div>

            {/* PRIMARY ACTION: POPUP GOOGLE SIGN-IN */}
            <button
              type="button"
              onClick={handleGoogleSignInPopup}
              disabled={isSigningIn}
              className="w-full py-3.5 px-4 bg-white hover:bg-gray-50 text-gray-900 font-black text-sm rounded-2xl border-2 border-black shadow-neo flex items-center justify-center gap-3 transition-colors active:scale-[0.98] cursor-pointer disabled:opacity-60"
            >
              {isSigningIn ? (
                <RefreshCw className="w-5 h-5 animate-spin text-gray-600" />
              ) : (
                <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
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
              )}
              <span className="uppercase tracking-wider">
                {isSigningIn ? 'Connecting to Google...' : 'Sign In with Google'}
              </span>
            </button>

            {/* Official Rendered Google Button Container (Fallback / One Tap) */}
            <div className="flex justify-center pt-1">
              <div ref={googleBtnRef} className="min-h-[40px] flex items-center justify-center" />
            </div>

            {/* Developer / Advanced Options Toggle */}
            <div className="pt-2 border-t-2 border-black/10 dark:border-gray-800 text-center">
              <button
                type="button"
                onClick={() => setShowConfig(!showConfig)}
                className="text-[10px] text-gray-500 dark:text-gray-400 hover:underline font-bold flex items-center justify-center gap-1 mx-auto cursor-pointer"
              >
                <Key className="w-3 h-3" />
                <span>{showConfig ? 'Hide OAuth Settings' : 'Google OAuth Client Settings'}</span>
              </button>

              <AnimatePresence>
                {showConfig && (
                  <motion.form
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    onSubmit={handleSaveCustomClientId}
                    className="mt-3 p-3 bg-[#FAF8F5] dark:bg-[#20222E] rounded-xl border border-black/20 dark:border-gray-700 text-left space-y-2 overflow-hidden"
                  >
                    <label className="block text-[10px] font-black uppercase text-gray-600 dark:text-gray-400">
                      Custom Google Client ID
                    </label>
                    <input
                      type="text"
                      value={customClientId}
                      onChange={(e) => setCustomClientId(e.target.value)}
                      placeholder={activeClientId || 'Paste Client ID from Google Cloud Console'}
                      className="w-full bg-white dark:bg-[#16171E] border border-black dark:border-gray-700 rounded-lg px-2.5 py-1.5 text-[11px] text-gray-900 dark:text-white focus:outline-none"
                    />
                    <div className="flex justify-between items-center pt-1">
                      <span className="text-[9px] text-gray-500 font-medium">
                        Origin: <code className="font-mono bg-black/10 dark:bg-white/10 px-1 rounded">{typeof window !== 'undefined' ? window.location.origin : ''}</code>
                      </span>
                      <button
                        type="submit"
                        className="px-2.5 py-1 bg-[#D4FF00] text-black font-black text-[10px] rounded-lg border border-black shadow-neo-sm active:scale-95 cursor-pointer"
                      >
                        Save
                      </button>
                    </div>
                  </motion.form>
                )}
              </AnimatePresence>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
