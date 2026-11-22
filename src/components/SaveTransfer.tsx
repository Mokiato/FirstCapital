// src/components/SaveTransfer.tsx
// Браузерный экспорт/импорт сохранения через файл.
// Используется в SettingsModal, когда Tauri недоступен.

import { useRef, useState } from 'react';
import { toast } from 'sonner';
import { useGameStore } from '../game/store';
import { exportSaveFile, importSaveFile } from '../game/persistence/save';

export function SaveTransfer() {
  const getSavePayload = useGameStore((s) => s.getSavePayload);
  const loadGame = useGameStore((s) => s.loadGame);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState<'export' | 'import' | null>(null);

  const handleExport = () => {
    setBusy('export');
    try {
      const payload = getSavePayload();
      exportSaveFile(payload);
      toast.success('Сохранение экспортировано', {
        description: 'Файл firstcapital-save.json скачан',
      });
    } catch (err) {
      toast.error('Ошибка экспорта', {
        description: (err as Error).message,
      });
    } finally {
      setBusy(null);
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    if (!confirm('Импортировать сохранение? Текущий прогресс будет перезаписан.')) {
      return;
    }

    setBusy('import');
    try {
      const payload = await importSaveFile<Record<string, unknown>>(file);
      loadGame(payload);
      toast.success('Сохранение импортировано');
    } catch (err) {
      toast.error('Ошибка импорта', {
        description: (err as Error).message,
      });
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="space-y-2">
      <button
        type="button"
        disabled={busy !== null}
        onClick={handleExport}
        className="w-full rounded-xl bg-emerald-600 p-3 text-sm font-semibold text-white transition-all hover:bg-emerald-500 active:scale-95 disabled:bg-neutral-700 disabled:text-neutral-500"
      >
        {busy === 'export' ? '⏳ Экспорт...' : '📤 Экспорт сохранения (файл)'}
      </button>

      <button
        type="button"
        disabled={busy !== null}
        onClick={handleImportClick}
        className="w-full rounded-xl bg-sky-600 p-3 text-sm font-semibold text-white transition-all hover:bg-sky-500 active:scale-95 disabled:bg-neutral-700 disabled:text-neutral-500"
      >
        {busy === 'import' ? '⏳ Импорт...' : '📥 Импорт сохранения (файл)'}
      </button>

      <input
        ref={fileInputRef}
        type="file"
        accept="application/json,.json"
        className="hidden"
        onChange={handleFileChange}
      />

      <p className="mt-2 text-xs text-neutral-500">
        Файл <code className="text-amber-400">firstcapital-save.json</code>{' '}
        скачивается браузером. Тот же формат, что и в десктоп-версии.
      </p>
    </div>
  );
}