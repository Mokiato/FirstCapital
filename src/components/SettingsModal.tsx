import { useState } from 'react';
import { toast } from 'sonner';
import Modal from './Modal';
import { useGameStore } from '../game/store';
import { exportSaveToDesktop, importSaveFromDesktop, checkTauri } from '../utils/tauriStorage';
import { SaveTransfer } from './SaveTransfer';
import { SAVE_KEY } from '../game/persistence/save';

type Tab = 'general' | 'save' | 'devtools';

export default function SettingsModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const state = useGameStore();
  const [tab, setTab] = useState<Tab>('general');
  const [busy, setBusy] = useState<'export' | 'import' | null>(null);
  const [devUnlocked, setDevUnlocked] = useState(false);
  const [secretClicks, setSecretClicks] = useState(0);

  const handleExport = async () => {
    if (!checkTauri()) { toast.error('Экспорт работает только в десктоп-версии'); return; }
    setBusy('export');
    const result = await exportSaveToDesktop(useGameStore.getState());
    setBusy(null);
    if (result.ok) toast.success(`Сохранение экспортировано`, { description: result.path });
    else toast.error('Ошибка экспорта', { description: result.error });
  };

  const handleImport = async () => {
    if (!checkTauri()) { toast.error('Импорт работает только в десктоп-версии'); return; }
    if (!confirm('Импортировать сохранение? Текущий прогресс будет перезаписан.')) return;
    setBusy('import');
    const result = await importSaveFromDesktop();
    setBusy(null);
    if (result.ok && result.data) {
      useGameStore.getState().loadGame(result.data);
      toast.success('Сохранение импортировано');
    } else toast.error('Ошибка импорта', { description: result.error });
  };

  const handleHardReset = () => {
    if (!confirm('Это удалит ВЕСЬ прогресс безвозвратно. Продолжить?')) return;
    if (!confirm('Точно-точно? Подумайте ещё раз.')) return;
    try { localStorage.removeItem(SAVE_KEY); } catch {}
    state.hardReset();
    toast.success('Прогресс сброшен. Перезапуск через 2 секунды...');
    setTimeout(() => location.reload(), 2000);
  };

  const handleSecretClick = () => {
    const next = secretClicks + 1;
    setSecretClicks(next);
    if (next >= 5) {
      setDevUnlocked(true);
      toast.success('🛠️ Режим разработчика активирован');
      setSecretClicks(0);
    }
  };

  const tabBtn = (id: Tab, label: string) => (
    <button onClick={() => setTab(id)} className={`font-mono text-xs uppercase tracking-widest pb-2 transition ${tab === id ? 'text-[#332B2B] font-bold border-b-2 border-[#8B5A3C]' : 'text-[#776E64] hover:text-[#332B2B] border-b-2 border-transparent'}`}>
      {label}
    </button>
  );

  return (
    <Modal open={open} onClose={onClose} title="Настройки">
      <div className="space-y-6 bg-[#FBF9F4] text-[#332B2B]">
        <div className="flex gap-6 border-b border-[#D8D0C4]">
          {tabBtn('general', 'Общие')}
          {tabBtn('save', 'Сохранение')}
          {devUnlocked && tabBtn('devtools', 'DevTools')}
        </div>

        {tab === 'general' && (
          <div className="space-y-6">
            <div className="border border-[#D8D0C4] bg-[#F4F1EA] p-4">
              <h3 className="font-mono text-xs uppercase tracking-widest mb-3 cursor-pointer select-none" onClick={handleSecretClick} title={secretClicks > 0 ? `${5 - secretClicks} кликов до секрета` : undefined}>
                Дополнительно
              </h3>
              <label className="flex items-center justify-between text-sm mb-2">
                <span>🔊 Звуки</span>
                <input type="checkbox" checked={state.settings.sound ?? true} onChange={(e) => state.setSetting('sound', e.target.checked)} />
              </label>
              <label className="flex items-center justify-between text-sm">
                <span>📳 Вибрация</span>
                <input type="checkbox" checked={state.settings.haptics ?? true} onChange={(e) => state.setSetting('haptics', e.target.checked)} />
              </label>
            </div>

            <button onClick={handleHardReset} className="w-full border border-[#A84A4A] py-3 font-mono text-xs uppercase tracking-widest font-bold text-[#A84A4A] hover:bg-[#A84A4A] hover:text-white transition">
              Сбросить весь прогресс
            </button>
          </div>
        )}

        {tab === 'save' && (
          <div className="border border-[#D8D0C4] bg-[#F4F1EA] p-4">
            <h3 className="font-mono text-xs uppercase tracking-widest mb-4">Сохранение</h3>
            <p className="font-mono text-xs text-[#776E64] mb-4">
              {checkTauri() ? 'Автосохранение в AppData каждые 2 секунды.' : 'Автосохранение в браузере (localStorage).'}
            </p>

            {checkTauri() ? (
              <div className="space-y-2">
                <button disabled={busy !== null} onClick={handleExport} className="w-full border border-[#8B5A3C] py-3 font-mono text-xs font-bold text-[#8B5A3C] hover:bg-[#8B5A3C] hover:text-white transition disabled:opacity-50">
                  {busy === 'export' ? 'Экспорт...' : 'ЭКСПОРТ НА РАБОЧИЙ СТОЛ'}
                </button>
                <button disabled={busy !== null} onClick={handleImport} className="w-full bg-[#8B5A3C] py-3 font-mono text-xs font-bold text-white hover:bg-[#73482F] transition disabled:opacity-50">
                  {busy === 'import' ? 'Импорт...' : 'ИМПОРТ С РАБОЧЕГО СТОЛА'}
                </button>
              </div>
            ) : (
              <SaveTransfer />
            )}
          </div>
        )}

        {tab === 'devtools' && (
          <div className="space-y-4">
            <div className="border border-[#C28B35] bg-[#C28B35]/10 p-3 font-mono text-xs text-[#C28B35]">
              Режим разработчика. Используйте только для тестирования.
            </div>
            <div className="border border-[#D8D0C4] bg-[#F4F1EA] p-4">
              <h3 className="font-mono text-xs uppercase tracking-widest mb-3">Ресурсы</h3>
              <div className="grid grid-cols-2 gap-2">
                <button onClick={() => { state.addBalance(1_000_000); toast.success('+1 000 000 ₽'); }} className="bg-[#8B5A3C] text-white p-2 font-mono text-xs font-bold hover:bg-[#73482F]">+1M ₽</button>
                <button onClick={() => { state.addBalance(1_000_000_000); toast.success('+1B ₽'); }} className="bg-[#8B5A3C] text-white p-2 font-mono text-xs font-bold hover:bg-[#73482F]">+1B ₽</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}