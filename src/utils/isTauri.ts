/** Проверяет, что мы запущены внутри Tauri, а не в обычном браузере. */
export function isTauri(): boolean {
  return (
    typeof window !== 'undefined' &&
    '__TAURI_INTERNALS__' in window
  );
}