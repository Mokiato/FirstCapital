import { appDataDir, desktopDir, join } from '@tauri-apps/api/path';
import { readTextFile, writeTextFile, exists, mkdir } from '@tauri-apps/plugin-fs';
import { isTauri } from './isTauri';

const SAVE_FILE_NAME = 'save.json';
const EXPORT_FILE_NAME = 'save_export.json';

/** Проверка, что мы запущены внутри Tauri (а не в браузере) */
export function checkTauri(): boolean {
  return isTauri();
}

/** Абсолютный путь к файлу сохранения в AppData */
async function getSavePath(): Promise<string> {
  const appData = await appDataDir();
  await mkdir(appData, { recursive: true }).catch(() => {});
  return await join(appData, SAVE_FILE_NAME);
}

/** Абсолютный путь к экспорту на рабочем столе */
async function getExportPath(): Promise<string> {
  const desktop = await desktopDir();
  return await join(desktop, EXPORT_FILE_NAME);
}

/** Чтение сохранения. Возвращает null, если файла нет или он битый. */
export async function readSaveFile(): Promise<unknown | null> {
  if (!checkTauri()) return null;
  try {
    const path = await getSavePath();
    if (!(await exists(path))) return null;
    const content = await readTextFile(path);
    if (!content) return null;
    return JSON.parse(content);
  } catch (e) {
    console.error('[tauriStorage] read error:', e);
    return null;
  }
}

/** Запись сохранения (вызывается с дебаунсом снаружи) */
export async function writeSaveFile(state: unknown): Promise<void> {
  if (!checkTauri()) return;
  try {
    const path = await getSavePath();
    await writeTextFile(path, JSON.stringify(state, null, 2));
  } catch (e) {
    console.error('[tauriStorage] write error:', e);
  }
}

/** Экспорт текущего стейта на рабочий стол */
export async function exportSaveToDesktop(
  state: unknown
): Promise<{ ok: boolean; path?: string; error?: string }> {
  try {
    const path = await getExportPath();
    await writeTextFile(path, JSON.stringify(state, null, 2));
    return { ok: true, path };
  } catch (e: any) {
    return { ok: false, error: String(e?.message || e) };
  }
}

/** Импорт сохранения с рабочего стола. Возвращает объект или null. */
export async function importSaveFromDesktop(): Promise<{
  ok: boolean;
  data?: unknown;
  error?: string;
}> {
  try {
    const path = await getExportPath();
    if (!(await exists(path))) {
      return { ok: false, error: `Файл ${EXPORT_FILE_NAME} не найден на рабочем столе` };
    }
    const content = await readTextFile(path);
    if (!content) return { ok: false, error: 'Файл пустой' };
    const data = JSON.parse(content);
    return { ok: true, data };
  } catch (e: any) {
    return { ok: false, error: String(e?.message || e) };
  }
}

/**
 * Создаёт debounced-подписку: при каждом изменении стейта
 * сохраняет его в файл через `delayMs` миллисекунд.
 */
export function createDebouncedWriter(delayMs = 2000) {
  let timer: ReturnType<typeof setTimeout> | null = null;
  let latestState: unknown = null;

  return (state: unknown) => {
    latestState = state;
    if (timer) clearTimeout(timer);
    timer = setTimeout(async () => {
      if (latestState) {
        await writeSaveFile(latestState);
      }
    }, delayMs);
  };
}
