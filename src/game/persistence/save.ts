export const SAVE_KEY = 'firstcapital-save-v3';
export const SAVE_SCHEMA_VERSION = 3;

export interface SaveEnvelope<T> { schemaVersion: number; savedAt: number; payload: T; }
export interface KeyValueStorage { getItem(key: string): string | null; setItem(key: string, value: string): void; removeItem?(key: string): void; }

export function serializeSave<T>(payload: T): string {
  return JSON.stringify({ schemaVersion: SAVE_SCHEMA_VERSION, savedAt: Date.now(), payload });
}

export function parseSave<T>(raw: string | null): SaveEnvelope<T> | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<SaveEnvelope<T>>;
    if (parsed.schemaVersion !== SAVE_SCHEMA_VERSION || typeof parsed.savedAt !== 'number' || parsed.payload === undefined) return null;
    return parsed as SaveEnvelope<T>;
  } catch { return null; }
}

export function saveToStorage<T>(storage: KeyValueStorage, payload: T, key = SAVE_KEY): void {
  storage.setItem(key, serializeSave(payload));
}

export function loadFromStorage<T>(storage: KeyValueStorage, key = SAVE_KEY): T | null {
  return parseSave<T>(storage.getItem(key))?.payload ?? null;
}

export function exportSaveFile<T>(payload: T): void {
  if (typeof document === 'undefined') return;
  const blob = new Blob([serializeSave(payload)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url; anchor.download = 'firstcapital-save.json'; anchor.click();
  URL.revokeObjectURL(url);
}

export async function importSaveFile<T>(file: File): Promise<T> {
  const envelope = parseSave<T>(await file.text());
  if (!envelope) throw new Error('Файл сохранения повреждён или имеет неподдерживаемую версию.');
  return envelope.payload;
}
