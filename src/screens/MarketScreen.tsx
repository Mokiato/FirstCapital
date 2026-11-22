import { useState } from 'react';
import { useGameStore } from '../game/store';
import { StockMarketScreen } from './StockMarketScreen';

// Для простоты вынесем Фонды/Облигации/Металлы в отдельные компоненты внутри MarketScreen
import { FundsSection, BondsSection, MetalsSection } from '../components/InvestmentsUI'; 

export default function MarketScreen() {
  const [tab, setTab] = useState<'stocks' | 'funds' | 'bonds' | 'metals'>('stocks');
  const cash = useGameStore((s) => s.balanceDecimal);
  const companies = useGameStore((s) => s.marketCompanies);
  const portfolio = useGameStore((s) => s.marketPositions);
  const buyShares = useGameStore((s) => s.buyShares);
  const sellShares = useGameStore((s) => s.sellShares);

  return (
    <div className="space-y-4">
      {/* Вкладки рынка */}
      <div className="flex gap-1 rounded-xl bg-neutral-900 p-1 mx-3 md:mx-6 mt-3">
        {[
          ['stocks', '📈 Акции'],
          ['funds', '📊 Фонды'],
          ['bonds', '📜 Облигации'],
          ['metals', '🥇 Металлы'],
        ].map(([id, label]) => (
          <button
            key={id}
            onClick={() => setTab(id as any)}
            className={`flex-1 rounded-lg py-2 text-xs font-semibold transition ${
              tab === id ? 'bg-emerald-600 text-white' : 'text-neutral-400'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="px-3 md:px-6 pb-6">
        {tab === 'stocks' && (
          <StockMarketScreen
            cash={cash}
            companies={companies}
            portfolio={portfolio}
            onBuy={(id, amount) => buyShares(id, amount)}
            onSell={(id, amount) => sellShares(id, amount)}
          />
        )}
        {tab === 'funds' && <FundsSection />}
        {tab === 'bonds' && <BondsSection />}
        {tab === 'metals' && <MetalsSection />}
      </div>
    </div>
  );
}