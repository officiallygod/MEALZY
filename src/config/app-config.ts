/**
 * MEALZY Global Application Configuration
 *
 * 🔑 DEVELOPER: Paste your Google Client ID below ONCE!
 * Once pasted, ALL your visitors and users can simply tap "Continue with Google"
 * with ZERO configuration on their part.
 */

export const APP_CONFIG = {
  appName: 'MEALZY',
  appUrl: process.env.NEXT_PUBLIC_APP_URL || 'https://officiallygod.github.io/MEALZY',

  // Google OAuth Client ID for zero-cost Drive AppData sync
  googleClientId:
    process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ||
    '348698469561-l9ijflms2f1a16ommrlnqs4hni917fpa.apps.googleusercontent.com',

  // Optional Supabase project credentials
  supabase: {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
  },
};

export function getActiveGoogleClientId(): string {
  if (
    APP_CONFIG.googleClientId &&
    APP_CONFIG.googleClientId !== 'YOUR_GOOGLE_CLIENT_ID_HERE'
  ) {
    return APP_CONFIG.googleClientId;
  }
  if (typeof window !== 'undefined') {
    return localStorage.getItem('mealzy_dev_google_client_id') || '';
  }
  return '';
}
