import { db } from '../db';

export interface MealzyBackupPayload {
  version: number;
  exportedAt: string;
  meals: any[];
  fridge: any[];
  preferences: any;
}

export async function exportLocalDataToPayload(): Promise<MealzyBackupPayload> {
  const meals = await db.meals.toArray();
  const fridge = await db.fridge.toArray();
  const preferences = await db.preferences.get('user-default-settings');

  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    meals,
    fridge,
    preferences: preferences || {},
  };
}

export async function restoreDataFromPayload(payload: MealzyBackupPayload): Promise<void> {
  if (!payload || !payload.meals) throw new Error('Invalid backup format');

  await db.transaction('rw', db.meals, db.fridge, db.preferences, async () => {
    await db.meals.clear();
    await db.fridge.clear();

    if (payload.meals?.length) await db.meals.bulkAdd(payload.meals);
    if (payload.fridge?.length) await db.fridge.bulkAdd(payload.fridge);
    if (payload.preferences) await db.preferences.put(payload.preferences);
  });
}

// Download manual JSON file backup directly in the browser
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

// Google Drive AppData Sync Guide & Implementation
// Scope: 'https://www.googleapis.com/auth/drive.appdata'
export async function syncToGoogleDriveAppData(accessToken: string): Promise<boolean> {
  const payload = await exportLocalDataToPayload();
  const fileContent = JSON.stringify(payload);

  const metadata = {
    name: 'mealzy_sync.json',
    parents: ['appDataFolder'],
    mimeType: 'application/json',
  };

  const form = new FormData();
  form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
  form.append('file', new Blob([fileContent], { type: 'application/json' }));

  const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    body: form,
  });

  return response.ok;
}
