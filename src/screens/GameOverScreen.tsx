import { useGameStore } from '../game/store';
import { formatMoney } from '../game/domain/money';

export function GameOverScreen() {
  const companyName = useGameStore((s) => s.companyName);
  const balance = useGameStore((s) => s.balanceDecimal);

  const handleRestart = () => {
    if (
      window.confirm(
        'Начать заново? Весь текущий прогресс будет потерян.',
      )
    ) {
      localStorage.clear();
      window.location.reload();
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#1A1714] px-4">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="text-6xl">💀</div>
        <h1 className="text-3xl font-bold text-[#F5F1E8]">
          Банкротство
        </h1>
        <p className="text-[#B8B0A4] font-mono text-sm leading-relaxed">
          Ликвидация активов не покрыла долговые обязательства.
          <br />
          Компания «{companyName}» прекращает существование.
        </p>
        <div className="bg-[#2B2521] rounded-lg px-4 py-3 font-mono text-xs text-[#776E64]">
          Остаток на счету: {formatMoney(balance)}
        </div>
        <button
          onClick={handleRestart}
          className="w-full bg-[#8B5A3C] hover:bg-[#A66B4A] text-[#F5F1E8] font-bold py-3 px-6 rounded-lg transition-colors"
        >
          Начать заново
        </button>
      </div>
    </div>
  );
}