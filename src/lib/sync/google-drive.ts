import {
  db,
  markLocalDataModified,
  getLastLocalModifiedTime,
  SEED_ONCE_KEY,
  LAST_LOCAL_MODIFIED_KEY,
} from '../db';
import { getActiveGoogleClientId } from '@/config/app-config';

export interface ClientPreferences {
  theme?: 'dark' | 'light';
  snacksMinimized?: boolean;
  snacksPrompted?: boolean;
  userName?: string;
  userAvatar?: string;
  userEmail?: string;
  calorieTarget?: number;
  proteinTarget?: number;
  carbsTarget?: number;
  fatTarget?: number;
  dietPreference?: string;
}

export interface MealzyBackupPayload {
  version: number;
  exportedAt: string;
  meals: any[];
  fridge: any[];
  preferences: any;
  clientSettings?: ClientPreferences;
}

// Client ID Management: reads from app-config, environment variables, or dev override
export function getSavedGoogleClientId(): string {
  return getActiveGoogleClientId();
}

export function saveGoogleClientId(clientId: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem('mealzy_dev_google_client_id', clientId.trim());
}

export async function exportLocalDataToPayload(): Promise<MealzyBackupPayload> {
  const meals = await db.meals.toArray();
  const fridge = await db.fridge.toArray();
  let dbPrefs: any = undefined;
  if (db?.preferences) {
    try {
      dbPrefs = await db.preferences.get('user-default-settings');
    } catch (prefErr) {
      console.warn('Could not read user preferences for backup:', prefErr);
    }
  }

  let clientSettings: ClientPreferences | undefined = undefined;
  if (typeof window !== 'undefined') {
    clientSettings = {
      theme: (localStorage.getItem('mealzy_theme') as 'dark' | 'light') || 'dark',
      snacksMinimized: localStorage.getItem('mealzy_snacks_minimized') === 'true',
      snacksPrompted: localStorage.getItem('mealzy_snacks_prompted') === 'true',
      userName: localStorage.getItem('mealzy_user_name') || undefined,
      userAvatar: localStorage.getItem('mealzy_user_avatar') || undefined,
      userEmail: localStorage.getItem('mealzy_user_email') || undefined,
      calorieTarget: dbPrefs?.calorieTarget,
      proteinTarget: dbPrefs?.proteinTarget,
      carbsTarget: dbPrefs?.carbsTarget,
      fatTarget: dbPrefs?.fatTarget,
      dietPreference: dbPrefs?.dietPreference,
    };
  }

  return {
    version: 2,
    exportedAt: new Date().toISOString(),
    meals,
    fridge,
    preferences: dbPrefs || {},
    clientSettings,
  };
}

export let isSyncInProgress = false;

export function setSyncInProgress(value: boolean): void {
  isSyncInProgress = value;
}

export async function restoreDataFromPayload(payload: MealzyBackupPayload): Promise<void> {
  if (!payload || !payload.meals) throw new Error('Invalid backup format');

  isSyncInProgress = true;
  try {
    const tablesToLock: any[] = [db.meals, db.fridge];
    if (db?.preferences) tablesToLock.push(db.preferences);
    await db.transaction('rw', tablesToLock, async () => {
      await db.meals.clear();
      await db.fridge.clear();

      if (payload.meals?.length) await db.meals.bulkAdd(payload.meals);
      if (payload.fridge?.length) await db.fridge.bulkAdd(payload.fridge);
      if (db?.preferences && payload.preferences && Object.keys(payload.preferences).length > 0) {
        await db.preferences.put({
          id: 'user-default-settings',
          ...payload.preferences,
        });
      }
    });

    if (typeof window !== 'undefined') {
      localStorage.setItem(SEED_ONCE_KEY, 'true');
      if (payload.exportedAt) {
        const cloudTime = new Date(payload.exportedAt).getTime();
        if (cloudTime > 0) {
          localStorage.setItem(LAST_LOCAL_MODIFIED_KEY, cloudTime.toString());
        }
      }

      if (payload.clientSettings) {
        const cs = payload.clientSettings;
        if (cs.theme) {
          localStorage.setItem('mealzy_theme', cs.theme);
          if (cs.theme === 'light') {
            document.documentElement.classList.remove('dark');
            document.documentElement.classList.add('light');
          } else {
            document.documentElement.classList.remove('light');
            document.documentElement.classList.add('dark');
          }
        }
        if (cs.snacksMinimized !== undefined) {
          localStorage.setItem('mealzy_snacks_minimized', String(cs.snacksMinimized));
        }
        if (cs.snacksPrompted !== undefined) {
          localStorage.setItem('mealzy_snacks_prompted', String(cs.snacksPrompted));
        }
        if (cs.userName) {
          localStorage.setItem('mealzy_user_name', cs.userName);
        }
        if (cs.userAvatar) {
          localStorage.setItem('mealzy_user_avatar', cs.userAvatar);
        }
        if (cs.userEmail) {
          localStorage.setItem('mealzy_user_email', cs.userEmail);
        }

        // Dispatch notification event so active mounted components update their UI state
        window.dispatchEvent(new CustomEvent('mealzy_cloud_sync_applied', { detail: cs }));
      }
    }
  } finally {
    setTimeout(() => {
      isSyncInProgress = false;
    }, 600);
  }
}

// Download manual JSON file backup directly in browser
export async function downloadLocalBackupFile() {
  const payload = await exportLocalDataToPayload();
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `mealzy_backup_${new Date().toISOString().split('T')[0]}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

// Upload and restore from JSON file
export async function uploadAndRestoreBackup(file: File): Promise<boolean> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const text = e.target?.result as string;
        const payload = JSON.parse(text);
        await restoreDataFromPayload(payload);
        resolve(true);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = reject;
    reader.readAsText(file);
  });
}

// Google Drive AppData Sync Implementation
// Uses 'https://www.googleapis.com/auth/drive.appdata'
export async function syncToGoogleDriveAppData(accessToken: string): Promise<boolean> {
  try {
    const payload = await exportLocalDataToPayload();
    const fileContent = JSON.stringify(payload, null, 2);

    // 1. Check if mealzy_sync.json already exists in appDataFolder
    const searchRes = await fetch(
      "https://www.googleapis.com/drive/v3/files?spaces=appDataFolder&q=name='mealzy_sync.json' and trashed=false&fields=files(id,name,modifiedTime)&orderBy=modifiedTime desc",
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );

    if (searchRes.ok) {
      const searchData = await searchRes.json();
      const files = searchData.files || [];

      if (files.length > 0) {
        const existingFileId = files[0].id;
        // Overwrite existing file via PATCH to keep Google Drive uncluttered
        const patchRes = await fetch(
          `https://www.googleapis.com/upload/drive/v3/files/${existingFileId}?uploadType=media`,
          {
            method: 'PATCH',
            headers: {
              Authorization: `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
            body: fileContent,
          }
        );

        // Asynchronously clean up any old duplicate sync files if they exist
        if (files.length > 1) {
          for (let i = 1; i < files.length; i++) {
            fetch(`https://www.googleapis.com/drive/v3/files/${files[i].id}`, {
              method: 'DELETE',
              headers: { Authorization: `Bearer ${accessToken}` },
            }).catch(() => {});
          }
        }

        return patchRes.ok;
      }
    }

    // 2. If no existing file found, create via multipart POST
    const metadata = {
      name: 'mealzy_sync.json',
      parents: ['appDataFolder'],
      mimeType: 'application/json',
    };

    const form = new FormData();
    form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
    form.append('file', new Blob([fileContent], { type: 'application/json' }));

    const postRes = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      body: form,
    });

    return postRes.ok;
  } catch (err) {
    console.error('[Mealzy] syncToGoogleDriveAppData failed:', err);
    return false;
  }
}

export type PullResult =
  | { success: true; payload: MealzyBackupPayload }
  | { success: false; reason: 'unauthorized' | 'not_found' | 'network_error' };

// Download and restore sync file from Google Drive appDataFolder with conflict resolution
export async function pullFromGoogleDriveAppData(accessToken: string): Promise<PullResult> {
  try {
    const listRes = await fetch(
      "https://www.googleapis.com/drive/v3/files?spaces=appDataFolder&q=name='mealzy_sync.json' and trashed=false&fields=files(id,name,modifiedTime)&orderBy=modifiedTime desc",
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );

    if (listRes.status === 401) {
      return { success: false, reason: 'unauthorized' };
    }

    if (!listRes.ok) {
      return { success: false, reason: 'network_error' };
    }

    const listData = await listRes.json();
    if (!listData.files || listData.files.length === 0) {
      return { success: false, reason: 'not_found' };
    }

    const fileId = listData.files[0].id;
    const downloadRes = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!downloadRes.ok) {
      return { success: false, reason: 'network_error' };
    }

    const payload = (await downloadRes.json()) as MealzyBackupPayload;

    // Check timestamps before restoring to avoid resurrecting deleted meals
    const cloudTime = payload.exportedAt ? new Date(payload.exportedAt).getTime() : 0;
    const localTime = getLastLocalModifiedTime();

    if (localTime > 0 && localTime > cloudTime + 1000) {
      // Local changes are newer than the cloud file (e.g. user cleared meals or planned offline).
      // Do NOT overwrite local changes with stale cloud data. Instead, push local state to cloud.
      console.log('[Mealzy] Local state is newer than cloud backup. Pushing local state to Google Drive.');
      await syncToGoogleDriveAppData(accessToken);
      return { success: true, payload };
    }

    await restoreDataFromPayload(payload);
    if (cloudTime > 0 && typeof window !== 'undefined') {
      localStorage.setItem(LAST_LOCAL_MODIFIED_KEY, cloudTime.toString());
    }
    return { success: true, payload };
  } catch (err) {
    console.error('[Mealzy] Failed to pull from Google Drive:', err);
    return { success: false, reason: 'network_error' };
  }
}

// Cross-device sync executed automatically when opening the app
export async function syncAcrossDevicesOnStartup(): Promise<{
  status: 'synced_from_cloud' | 'seeded_to_cloud' | 'no_token' | 'expired_token' | 'idle';
}> {
  if (typeof window === 'undefined') return { status: 'idle' };
  const token = localStorage.getItem('mealzy_google_access_token');
  if (!token) return { status: 'no_token' };

  try {
    const pullResult = await pullFromGoogleDriveAppData(token);
    if (pullResult.success) {
      console.log('[Mealzy] Successfully checked cross-device state with Google Drive.');
      return { status: 'synced_from_cloud' };
    }

    if (pullResult.reason === 'not_found') {
      // First connection on this account: upload local state so cloud has it
      const pushed = await syncToGoogleDriveAppData(token);
      if (pushed) {
        console.log('[Mealzy] Initial cloud state seeded to Google Drive.');
        return { status: 'seeded_to_cloud' };
      }
    }

    if (pullResult.reason === 'unauthorized') {
      console.warn('[Mealzy] Stored Google Drive session has expired.');
      return { status: 'expired_token' };
    }
  } catch (err) {
    console.warn('[Mealzy] Startup cross-device sync notice:', err);
  }

  return { status: 'idle' };
}

export type SaveSyncStatus = 'idle' | 'saving' | 'saved_locally' | 'synced';

export interface SaveSyncEventDetail {
  status: SaveSyncStatus;
  timestamp: number;
}

let autoSyncTimer: ReturnType<typeof setTimeout> | null = null;

// Execute save locally to localStorage snapshot AND push to Google Drive if connected
export async function performIdleSaveAndSync(): Promise<void> {
  if (typeof window === 'undefined') return;

  window.dispatchEvent(
    new CustomEvent('mealzy_save_status', {
      detail: { status: 'saving', timestamp: Date.now() },
    })
  );

  try {
    // 1. Always create an offline snapshot in localStorage
    const payload = await exportLocalDataToPayload();
    try {
      localStorage.setItem('mealzy_local_backup_snapshot', JSON.stringify(payload));
    } catch (snapErr) {
      console.warn('[Mealzy] Local snapshot write notice:', snapErr);
    }
    markLocalDataModified();

    // 2. If signed into Google Drive, sync to cloud
    const token = localStorage.getItem('mealzy_google_access_token');
    if (token) {
      const pushed = await syncToGoogleDriveAppData(token);
      if (pushed) {
        window.dispatchEvent(
          new CustomEvent('mealzy_save_status', {
            detail: { status: 'synced', timestamp: Date.now() },
          })
        );
        return;
      }
    }

    // Guest / offline mode
    window.dispatchEvent(
      new CustomEvent('mealzy_save_status', {
        detail: { status: 'saved_locally', timestamp: Date.now() },
      })
    );
  } catch (err) {
    console.warn('[Mealzy] Idle save notice:', err);
    window.dispatchEvent(
      new CustomEvent('mealzy_save_status', {
        detail: { status: 'saved_locally', timestamp: Date.now() },
      })
    );
  }
}

// Background auto-save & sync: debounced to 1.5s idle
export function scheduleBackgroundDriveSync(delayMs = 1500): void {
  if (typeof window === 'undefined') return;

  if (autoSyncTimer) clearTimeout(autoSyncTimer);
  autoSyncTimer = setTimeout(() => {
    autoSyncTimer = null;
    performIdleSaveAndSync();
  }, delayMs);
}

// Flush pending save immediately on tab switch or before unload
export function flushPendingAutoSave(): void {
  if (autoSyncTimer) {
    clearTimeout(autoSyncTimer);
    autoSyncTimer = null;
    performIdleSaveAndSync();
  }
}

// Hook Dexie transactions to seamlessly save on idle across any change
let hasRegisteredDexieHooks = false;
export function enableAutomaticDriveSync(): void {
  if (typeof window === 'undefined' || hasRegisteredDexieHooks) return;
  if (!db || !db.meals) return;

  const triggerChange = () => {
    if (isSyncInProgress) return;
    markLocalDataModified();
    scheduleBackgroundDriveSync(1500);
  };

  try {
    db.meals.hook('creating', function () {
      this.onsuccess = triggerChange;
    });
    db.meals.hook('updating', function () {
      this.onsuccess = triggerChange;
    });
    db.meals.hook('deleting', function () {
      this.onsuccess = triggerChange;
    });

    db.fridge.hook('creating', function () {
      this.onsuccess = triggerChange;
    });
    db.fridge.hook('updating', function () {
      this.onsuccess = triggerChange;
    });
    db.fridge.hook('deleting', function () {
      this.onsuccess = triggerChange;
    });

    if (db.preferences) {
      db.preferences.hook('creating', function () {
        this.onsuccess = triggerChange;
      });
      db.preferences.hook('updating', function () {
        this.onsuccess = triggerChange;
      });
    }

    window.addEventListener('beforeunload', () => {
      flushPendingAutoSave();
    });

    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        flushPendingAutoSave();
      }
    });

    hasRegisteredDexieHooks = true;
    console.log('[Mealzy] Reactive idle auto-save and sync listeners activated.');
  } catch (err) {
    console.warn('[Mealzy] Could not attach reactive auto-sync hooks:', err);
  }
}
