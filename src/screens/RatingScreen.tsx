import { useMemo, useState } from 'react';
import { useGameStore } from '../game/store';
import { formatMoney } from '../game/domain/money';
import { getCompetitorPressure } from '../game/selectors';
import { SECTOR_BY_ID } from '../data/sectors';

type RatingTab = 'top' | 'competitors';

export default function RatingScreen() {
  const [tab, setTab] = useState<RatingTab>('top');

  const companies = useGameStore((s) => s.marketCompanies);
  const companyName = useGameStore((s) => s.companyName);
  const competitors = useGameStore((s) => s.competitors);
  const businesses = useGameStore((s) => s.businesses);
  const getPlayerCapital = useGameStore((s) => s.getPlayerCapital);
  const getCompanyRating = useGameStore((s) => s.getCompanyRating);

  const rating = useMemo(() => getCompanyRating(50), [companies, companyName, getCompanyRating]);
  const playerCapital = useMemo(() => getPlayerCapital(), [businesses, getPlayerCapital]);

  const playerSectors = useMemo(() => [...new Set(businesses.map((b) => b.sectorId).filter(Boolean))], [businesses]);
  const pressure = useMemo(() => getCompetitorPressure(competitors, playerSectors), [competitors, playerSectors]);

  const playerRank = rating.find((r) => r.isPlayer)?.rank ?? '—';

  return (
    <div className="p-6 md:p-8 max-w-[1200px] mx-auto bg-[#FBF9F4] min-h-screen">
      
      <div className="mb-6 border-b border-[#D8D0C4] pb-4 flex flex-wrap justify-between items-end gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#332B2B]">Рейтинг</h1>
          <p className="font-mono text-xs text-[#776E64] uppercase tracking-widest mt-1">Соревнование с NPC-корпорациями</p>
        </div>
        <div className="flex gap-8 text-right">
          <div>
            <div className="data-label mb-1">Ваше место</div>
            <div className="font-mono text-2xl font-bold text-[#8B5A3C]">#{playerRank}</div>
          </div>
          <div>
            <div className="data-label mb-1">Чистый капитал</div>
            <div className="font-mono text-2xl font-bold text-[#332B2B]">{formatMoney(playerCapital)}</div>
          </div>
        </div>
      </div>

      <div className="flex gap-6 border-b border-[#D8D0C4] mb-6">
        <button onClick={() => setTab('top')} className={`font-mono text-xs uppercase tracking-widest pb-2 transition ${tab === 'top' ? 'text-[#332B2B] font-bold border-b-2 border-[#8B5A3C]' : 'text-[#776E64] hover:text-[#332B2B] border-b-2 border-transparent'}`}>
          Топ-50
        </button>
        <button onClick={() => setTab('competitors')} className={`font-mono text-xs uppercase tracking-widest pb-2 transition ${tab === 'competitors' ? 'text-[#332B2B] font-bold border-b-2 border-[#8B5A3C]' : 'text-[#776E64] hover:text-[#332B2B] border-b-2 border-transparent'}`}>
          Конкуренты ({competitors.length})
        </button>
      </div>

      {tab === 'top' && (
        <div className="border border-[#D8D0C4] bg-[#F4F1EA]">
          <div className="grid grid-cols-12 gap-4 p-3 border-b border-[#D8D0C4] font-mono text-xs text-[#776E64] uppercase tracking-widest">
            <div className="col-span-1">#</div>
            <div className="col-span-7">Компания</div>
            <div className="col-span-4 text-right">Капитал</div>
          </div>
          {rating.map((row) => {
            const sector = SECTOR_BY_ID[row.sectorId as keyof typeof SECTOR_BY_ID];
            return (
              <div key={row.companyId} className={`grid grid-cols-12 gap-4 items-center p-3 border-b border-[#D8D0C4] last:border-0 ${row.isPlayer ? 'bg-[#8B5A3C]/10' : ''}`}>
                <div className="col-span-1 font-mono text-sm font-bold text-[#776E64]">{row.rank}</div>
                <div className="col-span-7 flex items-center gap-3">
                  <div className={`font-bold text-sm ${row.isPlayer ? 'text-[#8B5A3C]' : 'text-[#332B2B]'}`}>{row.companyName}</div>
                  <div className="font-mono text-[10px] text-[#776E64] uppercase tracking-wider">{sector?.name || 'Игрок'}</div>
                </div>
                <div className="col-span-4 text-right font-mono text-sm font-bold text-[#332B2B]">
                  {formatMoney(String(row.capital))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {tab === 'competitors' && (
        <div className="space-y-6">
          {playerSectors.length > 0 && (
            <div>
              <div className="font-mono text-xs text-[#776E64] uppercase tracking-widest mb-3">Давление по секторам</div>
              <div className="border border-[#D8D0C4] bg-[#F4F1EA] p-4 space-y-3">
                {playerSectors.map((sector) => {
                  const pressureVal = pressure[sector] ?? 0;
                  const sectorDef = SECTOR_BY_ID[sector as keyof typeof SECTOR_BY_ID];
                  return (
                    <div key={sector}>
                      <div className="flex justify-between font-mono text-xs mb-1">
                        <span className="text-[#332B2B]">{sectorDef?.name ?? sector}</span>
                        <span className={pressureVal > 60 ? 'text-[#A84A4A]' : pressureVal > 30 ? 'text-[#C28B35]' : 'text-[#4A7C59]'}>{pressureVal}%</span>
                      </div>
                      <div className="h-1 w-full bg-[#D8D0C4]">
                        <div className={`h-full ${pressureVal > 60 ? 'bg-[#A84A4A]' : pressureVal > 30 ? 'bg-[#C28B35]' : 'bg-[#4A7C59]'}`} style={{ width: `${Math.min(100, pressureVal)}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {competitors.length === 0 ? (
            <div className="border border-[#D8D0C4] bg-[#F4F1EA] p-8 text-center font-mono text-sm text-[#776E64]">
              У вас пока нет активных конкурентов.
            </div>
          ) : (
            <div className="border border-[#D8D0C4] bg-[#F4F1EA]">
              <div className="grid grid-cols-12 gap-4 p-3 border-b border-[#D8D0C4] font-mono text-xs text-[#776E64] uppercase tracking-widest">
                <div className="col-span-4">Компания</div>
                <div className="col-span-3">Сектор</div>
                <div className="col-span-2 text-center">Цена</div>
                <div className="col-span-3 text-right">Репутация</div>
              </div>
              {competitors
                .slice()
                .sort((a, b) => b.aggressiveness - a.aggressiveness)
                .map((comp) => {
                  const sectorDef = SECTOR_BY_ID[comp.sectorId as keyof typeof SECTOR_BY_ID];
                  return (
                    <div key={comp.id} className="grid grid-cols-12 gap-4 items-center p-3 border-b border-[#D8D0C4] last:border-0">
                      <div className="col-span-4 font-bold text-sm text-[#332B2B]">{comp.companyName}</div>
                      <div className="col-span-3 font-mono text-xs text-[#776E64]">{sectorDef?.name ?? comp.sectorId}</div>
                      <div className="col-span-2 text-center font-mono text-xs text-[#332B2B]">×{comp.priceMultiplier.toFixed(2)}</div>
                      <div className="col-span-3 text-right font-mono text-xs text-[#332B2B]">{Math.round(comp.reputation)}</div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}