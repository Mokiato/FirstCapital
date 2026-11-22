import { useMemo, useState } from 'react';
import type { MarketCompany, StockPosition } from '../game/domain/types';
import { formatMoney, moneyMul, moneySub } from '../game/domain/money';
import { StockPriceChart } from '../components/StockPriceChart';
import { COMPANY_NAMES_RU } from '../data/companies';
import { COMPANY_INFO } from '../data/companyInfo';

interface StockMarketScreenProps {
  cash: string;
  companies: MarketCompany[];
  portfolio: StockPosition[];
  onBuy: (companyId: string, shares: number) => void;
  onSell: (companyId: string, shares: number) => void;
}

const SECTOR_NAMES: Record<string, string> = {
  it: 'IT', healthcare: 'Медицина', finance: 'Финансы',
  consumer: 'Потреб.', industrial: 'Промышленность', energy: 'Энергетика',
  raw: 'Сырьё', utilities: 'ЖКХ', realestate: 'Недвижимость',
  communications: 'Связь',
};

const VOLATILITY_NAMES: Record<string, string> = {
  stable: 'Стабильная', moderate: 'Умеренная',
  volatile: 'Волатильная', speculative: 'Спекулятивная',
};

export function StockMarketScreen({
  cash, companies, portfolio, onBuy, onSell,
}: StockMarketScreenProps) {
  const categories = useMemo(
    () => [...new Set(companies.map((company) => company.sectorId))],
    [companies],
  );

  const [selectedSector, setSelectedSector] = useState<string>('all');
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>(
    companies[0]?.id ?? '',
  );
  const [sharesInput, setSharesInput] = useState('1');

  const filteredCompanies = selectedSector === 'all'
    ? companies
    : companies.filter((c) => c.sectorId === selectedSector);

  const selectedCompany = companies.find((c) => c.id === selectedCompanyId);
  const selectedPosition = portfolio.find((p) => p.companyId === selectedCompanyId);

  const shares = Math.max(0, Number.parseFloat(sharesInput) || 0);
  const currentValue = selectedPosition ? moneyMul(selectedCompany?.price ?? '0', selectedPosition.shares) : '0';
  const costBasis = selectedPosition ? moneyMul(selectedPosition.averageBuyPrice, selectedPosition.shares) : '0';
  const unrealizedPnl = moneySub(currentValue, costBasis);
  const pnlPositive = Number(unrealizedPnl) >= 0;

  const portfolioCompanies = companies.filter(c => portfolio.some(p => p.companyId === c.id && p.shares > 0));

  return (
    <div className="p-6 md:p-8 space-y-6 bg-[#FBF9F4]">
      
      {/* Шапка */}
      <header className="flex flex-wrap items-end justify-between gap-3 border-b border-[#D8D0C4] pb-4">
        <div>
          <h1 className="text-2xl font-bold text-[#332B2B]">БрокерПро</h1>
          <p className="font-mono text-xs text-[#776E64] uppercase tracking-widest mt-1">
            Торговый терминал
          </p>
        </div>
        <div className="font-mono text-sm text-[#776E64] bg-[#F4F1EA] px-4 py-2 border border-[#D8D0C4]">
          Свободные средства: <span className="font-bold text-[#332B2B]">{formatMoney(cash)}</span>
        </div>
      </header>

      {/* Две колонки: Мой портфель и Доступные акции */}
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)]">
        
        {/* ЛЕВАЯ КОЛОНКА: Мой портфель */}
        <div>
          <h2 className="font-mono text-xs text-[#776E64] uppercase tracking-widest mb-3">Мой портфель</h2>
          <div className="border border-[#D8D0C4] bg-[#F4F1EA]">
            {portfolioCompanies.length === 0 ? (
              <div className="p-6 text-center font-mono text-sm text-[#776E64]">У вас пока нет акций</div>
            ) : (
              portfolioCompanies.map(company => {
                const pos = portfolio.find(p => p.companyId === company.id)!;
                const val = moneyMul(company.price, pos.shares);
                return (
                  <button
                    key={company.id}
                    onClick={() => setSelectedCompanyId(company.id)}
                    className={`w-full flex items-center justify-between p-3 border-b border-[#D8D0C4] last:border-0 transition text-left ${
                      selectedCompanyId === company.id ? 'bg-[#FBF9F4] border-l-2 border-l-[#8B5A3C]' : 'hover:bg-[#FBF9F4] border-l-2 border-l-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#D8D0C4] flex items-center justify-center text-xs font-bold text-[#332B2B]">
                        {COMPANY_NAMES_RU[company.id]?.substring(0, 2) || company.name.substring(0, 2)}
                      </div>
                      <div>
<div className="flex items-baseline gap-2">
  <div className="text-sm font-bold text-[#332B2B]">
    {COMPANY_NAMES_RU[company.id] || company.name}
  </div>
  <div className="font-mono text-[10px] text-[#776E64]">
    ({COMPANY_INFO[company.id]?.nameEn || company.name}) — {COMPANY_INFO[company.id]?.ticker}
  </div>
</div>
                        <div className="font-mono text-xs text-[#776E64]">{pos.shares} шт.</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono text-sm text-[#332B2B]">{formatMoney(val)}</div>
                      <div className={`font-mono text-[10px] ${company.lastChangePct >= 0 ? 'text-[#4A7C59]' : 'text-[#A84A4A]'}`}>
                        {company.lastChangePct >= 0 ? '+' : ''}{company.lastChangePct.toFixed(2)}%
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* ПРАВАЯ КОЛОНКА: Доступные акции */}
        <div>
          <h2 className="font-mono text-xs text-[#776E64] uppercase tracking-widest mb-3">Доступные акции</h2>
          
          {/* Фильтры по секторам (в виде вкладок с подчеркиванием) */}
          <div className="flex flex-wrap gap-4 mb-3 border-b border-[#D8D0C4] pb-1">
            <button
              onClick={() => setSelectedSector('all')}
              className={`font-mono text-xs uppercase tracking-widest pb-1 transition ${
                selectedSector === 'all' ? 'text-[#332B2B] font-bold border-b-2 border-[#8B5A3C]' : 'text-[#776E64] hover:text-[#332B2B] border-b-2 border-transparent'
              }`}
            >
              Все
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedSector(cat)}
                className={`font-mono text-xs uppercase tracking-widest pb-1 transition ${
                  selectedSector === cat ? 'text-[#332B2B] font-bold border-b-2 border-[#8B5A3C]' : 'text-[#776E64] hover:text-[#332B2B] border-b-2 border-transparent'
                }`}
              >
                {SECTOR_NAMES[cat] || cat}
              </button>
            ))}
          </div>

          <div className="border border-[#D8D0C4] bg-[#F4F1EA] max-h-[400px] overflow-y-auto">
            {filteredCompanies.map((company) => (
              <button
                key={company.id}
                onClick={() => setSelectedCompanyId(company.id)}
                className={`w-full flex items-center justify-between p-3 border-b border-[#D8D0C4] last:border-0 transition text-left ${
                  selectedCompanyId === company.id ? 'bg-[#FBF9F4] border-l-2 border-l-[#8B5A3C]' : 'hover:bg-[#FBF9F4] border-l-2 border-l-transparent'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#D8D0C4] flex items-center justify-center text-xs font-bold text-[#332B2B]">
                    {COMPANY_NAMES_RU[company.id]?.substring(0, 2) || company.name.substring(0, 2)}
                  </div>
                  <div>
                    <div className="flex items-baseline gap-2">
  <div className="text-sm font-bold text-[#332B2B]">
    {COMPANY_NAMES_RU[company.id] || company.name}
  </div>
  <div className="font-mono text-[10px] text-[#776E64]">
    ({COMPANY_INFO[company.id]?.nameEn || company.name}) — {COMPANY_INFO[company.id]?.ticker}
  </div>
</div>
                    <div className="font-mono text-xs text-[#776E64]">
                      {SECTOR_NAMES[company.sectorId]} · {VOLATILITY_NAMES[company.volatility]}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-mono text-sm text-[#332B2B]">{formatMoney(company.price)}</div>
                  <div className={`font-mono text-[10px] ${company.lastChangePct >= 0 ? 'text-[#4A7C59]' : 'text-[#A84A4A]'}`}>
                    {company.lastChangePct >= 0 ? '+' : ''}{company.lastChangePct.toFixed(2)}%
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* НИЖНЯЯ ЧАСТЬ: График и Детали выбранной компании */}
      <section className="mt-6">
        {selectedCompany ? (
          <div className="border border-[#D8D0C4] bg-[#F4F1EA]">
            
            {/* График */}
            <div className="p-4 border-b border-[#D8D0C4] bg-[#FBF9F4]">
              <StockPriceChart company={selectedCompany} />
            </div>

            {/* Информация о компании */}
            <div className="p-6">
              <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[#D8D0C4] pb-4">
                <div>
                  <div className="flex flex-wrap items-baseline gap-2">
  <h2 className="text-xl font-bold text-[#332B2B]">
    {COMPANY_NAMES_RU[selectedCompany.id] || selectedCompany.name}
  </h2>
  <span className="font-mono text-sm text-[#776E64]">
    ({COMPANY_INFO[selectedCompany.id]?.nameEn}) — {COMPANY_INFO[selectedCompany.id]?.ticker}
  </span>
</div>
                  <div className="font-mono text-xs text-[#776E64] mt-1">
                    Сектор: {SECTOR_NAMES[selectedCompany.sectorId]} · {VOLATILITY_NAMES[selectedCompany.volatility]}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-mono text-lg font-bold text-[#332B2B]">{formatMoney(selectedCompany.price)}</div>
                  <div className="font-mono text-xs text-[#776E64]">
                    Годовой рост: {(selectedCompany.annualGrowth * 100).toFixed(1)}%
                  </div>
                </div>
              </div>

              {/* Блок описания */}
              <div className="py-4 font-sans text-sm text-[#332B2B] leading-relaxed border-b border-[#D8D0C4] text-justify">
  <p>{COMPANY_INFO[selectedCompany.id]?.description || 'Описание отсутствует.'}</p>
</div>

              {/* Блок портфеля выбранной компании */}
              {selectedPosition && (
                <div className="grid gap-4 sm:grid-cols-3 my-4">
                  <div>
                    <div className="data-label mb-1">Количество</div>
                    <div className="data-value">{selectedPosition.shares} шт.</div>
                  </div>
                  <div>
                    <div className="data-label mb-1">Рыночная стоимость</div>
                    <div className="data-value">{formatMoney(currentValue)}</div>
                  </div>
                  <div>
                    <div className="data-label mb-1">Нереализованная прибыль</div>
                    <div className={`data-value ${pnlPositive ? 'text-[#4A7C59]' : 'text-[#A84A4A]'}`}>
                      {formatMoney(unrealizedPnl)}
                    </div>
                  </div>
                </div>
              )}

              {/* Блок покупки / продажи */}
              <div className="flex flex-wrap items-end gap-3 pt-4">
                <label className="block">
                  <span className="data-label block mb-1">Количество акций</span>
                  <input
                    type="number"
                    min="0.000001"
                    step="1"
                    value={sharesInput}
                    onChange={(event) => setSharesInput(event.target.value)}
                    className="w-36 border border-[#D8D0C4] bg-[#FBF9F4] px-3 py-2 font-mono text-sm text-[#332B2B] outline-none focus:border-[#8B5A3C]"
                  />
                </label>
                <button
                  type="button"
                  disabled={shares <= 0}
                  onClick={() => onBuy(selectedCompany.id, shares)}
                  className="bg-[#8B5A3C] px-5 py-2 font-mono text-sm font-bold text-white hover:bg-[#73482F] disabled:opacity-40 transition-colors"
                >
                  КУПИТЬ
                </button>
                <button
                  type="button"
                  disabled={shares <= 0 || !selectedPosition || shares > (selectedPosition?.shares ?? 0)}
                  onClick={() => onSell(selectedCompany.id, shares)}
                  className="border border-[#A84A4A] px-5 py-2 font-mono text-sm font-bold text-[#A84A4A] hover:bg-[#A84A4A] hover:text-white disabled:opacity-40 transition-colors"
                >
                  ПРОДАТЬ
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="border border-[#D8D0C4] bg-[#F4F1EA] p-8 text-center font-mono text-sm text-[#776E64]">
            Выберите компанию для просмотра деталей.
          </div>
        )}
      </section>
    </div>
  );
}