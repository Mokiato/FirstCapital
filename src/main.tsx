import React from 'react';
import ReactDOM from 'react-dom/client';
import { Toaster } from 'sonner';
import App from './App';
import './index.css';
import { useGameStore } from './game/store';
import {
  readSaveFile,
  createDebouncedWriter,
  checkTauri,
} from './utils/tauriStorage';

async function bootstrap() {
  // 1. Если мы в Tauri — подгружаем сохранение из файла
  if (checkTauri()) {
    const saved = await readSaveFile();
    if (saved && typeof saved === 'object') {
      // Аккуратно мержим, чтобы не потерять новые поля после обновления
      useGameStore.setState((current) => ({ ...current, ...(saved as any) }));
      console.log('[bootstrap] Сохранение загружено из AppData');
    } else {
      console.log('[bootstrap] Сохранения нет, старт с начальных значений');
    }

    // 2. Подписываемся с дебаунсом 2 секунды
    const write = createDebouncedWriter(2000);
    useGameStore.subscribe((state) => {
      write(state);
    });
  }

  // 3. Монтируем React
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <App />
      <Toaster position="top-center" richColors theme="dark" />
    </React.StrictMode>
  );
}

bootstrap().catch((e) => {
  console.error('Bootstrap failed:', e);
});
