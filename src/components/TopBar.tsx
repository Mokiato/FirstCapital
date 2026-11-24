import { useState } from 'react';
import { useGameStore } from '../game/store';
import { getCompanyLevel } from '../game/selectors';
import { useClockStore } from '../game/simulation/clockStore';
import { Bell, Award, Settings, ChevronsRight } from 'lucide-react';
import Modal from './Modal';

function formatTopBarBalance(amount: number) {
  if (amount >= 1_000_000_000) {
    return `${(amount / 1_000_000_000).toFixed(2)} млрд ₽`;
  }
  // Выводит полное число с пробелами (например, 139 000 000 ₽)
  return `${Math.floor(amount).toLocaleString('ru-RU')} ₽`;
}

export default function TopBar({ onOpenSettings }: { onOpenSettings: () => void }) {
  const state = useGameStore();
  const [showNotifs, setShowNotifs] = useState(false);

  const level = getCompanyLevel(state);
  const clock = useClockStore((s) => s.clock);

  const MONTHS = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'];
  const monthName = MONTHS[clock.monthIndex % 12];
  const year = Math.floor(clock.monthIndex / 12) + 1;

  return (
    <>
      <header className="flex h-[72px] items-center justify-between border-b border-[#D8D0C4] bg-[#FBF9F4] px-6">
        {/* ЛЕВО: Профиль и Баланс */}
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center bg-[#D8D0C4] text-[#332B2B] font-mono font-bold text-sm">
              {level}
            </div>
            <div>
              <div className="text-sm font-bold text-[#332B2B]">{state.companyName}</div>
              <div className="font-mono text-xs text-[#776E64]">БАЛАНС</div>
            </div>
          </div>

          <div className="h-8 w-px bg-[#D8D0C4]" />

          <div className="font-mono text-lg font-semibold text-[#332B2B]">
            {formatTopBarBalance(state.balance)}
          </div>
        </div>

        {/* ЦЕНТР: Время и ход (GDD v2.0 §3.1: 1 ход = 1 месяц) */}
        <div className="flex items-center gap-4">
          <div className="font-mono text-xs text-[#776E64]">
            ГОД {year} · {monthName.toUpperCase()}
          </div>
          <button
            onClick={() => state.endTurn()}
            disabled={state.gameOver}
            title="Закрыть месяц: зарплаты, закупки, продажи, налоги, события, рынок"
            className="flex items-center gap-2 bg-[#8B5A3C] px-4 py-2 font-mono text-xs font-bold text-white hover:bg-[#7A4E33] disabled:cursor-not-allowed disabled:opacity-40"
          >
            ЗАВЕРШИТЬ МЕСЯЦ
            <ChevronsRight size={16} />
          </button>
        </div>

        {/* ПРАВО: Уведомления и Настройки */}
        <div className="flex items-center gap-4">
          <button onClick={() => setShowNotifs(true)} className="relative p-2 text-[#776E64] hover:text-[#332B2B]">
            <Bell size={20} strokeWidth={1.5} />
            {state.notifications.length > 0 && <span className="absolute top-1 right-1 h-2 w-2 bg-[#A84A4A]" />}
          </button>
          <button className="p-2 text-[#776E64] hover:text-[#332B2B]">
            <Award size={20} strokeWidth={1.5} />
          </button>
          <button onClick={onOpenSettings} className="p-2 text-[#776E64] hover:text-[#332B2B]">
            <Settings size={20} strokeWidth={1.5} />
          </button>
        </div>
      </header>

      {/* Модалка уведомлений */}
      <Modal open={showNotifs} onClose={() => setShowNotifs(false)} title="УВЕДОМЛЕНИЯ">
        <div className="space-y-2">
          {state.notifications.map((n) => (
            <div key={n.id} className="flex items-start justify-between border-b border-[#D8D0C4] py-2 text-sm text-[#332B2B]">
              <span>{n.text}</span>
              <button onClick={() => state.dismissNotification(n.id)} className="text-[#776E64] hover:text-[#A84A4A] font-mono text-xs uppercase">Закрыть</button>
            </div>
          ))}
        </div>
      </Modal>
    </>
  );
}