import { useMemo, useState } from 'react';
import { useGameStore } from '../game/store';
import { getMonthLabel } from '../game/simulation/clock';
import { categoryLabel } from '../game/statistics/categories';
import { COMPANY_NAMES_RU } from '../data/companies';
import type { NewsItem } from '../game/domain/types';

type NewsFilter = 'all' | 'event' | 'contract' | 'company';

const FILTERS: { id: NewsFilter; label: string }[] = [
  { id: 'all', label: 'Все' },
  { id: 'event', label: 'События' },
  { id: 'contract', label: 'Контракты' },
  { id: 'company', label: 'Компании' },
];

function NewsPreview({ item, large = false }: { item: NewsItem; large?: boolean }) {
  const [error, setError] = useState(false);
  const fallbackEmoji = getCategoryEmoji(item);
  const className = large ? 'h-48 w-full bg-[#D8D0C4] flex items-center justify-center overflow-hidden' : 'h-32 w-full bg-[#D8D0C4] flex items-center justify-center overflow-hidden';

  if (error) {
    return <div className={`${className} text-6xl`}><span>{fallbackEmoji}</span></div>;
  }

  return (
    <div className={className}>
      <img
        src={`/assets/news/${item.id}.png`}
        alt={item.title}
        className="h-full w-full object-cover"
        onError={() => setError(true)}
        loading="lazy"
      />
    </div>
  );
}

function getCategoryEmoji(item: NewsItem): string {
  if (item.category === 'event' || item.eventId) return '📰';
  if (item.category === 'contract') return '📋';
  if (item.companyId) return '🏢';
  return '📰';
}

export default function NewsScreen() {
  const news = useGameStore((s) => s.news);
  const activeEvents = useGameStore((s) => s.activeEvents);
  const [filter, setFilter] = useState<NewsFilter>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const sorted = [...news].sort((a, b) => b.monthIndex - a.monthIndex);
    if (filter === 'all') return sorted;
    if (filter === 'event') return sorted.filter((n) => n.category === 'event' || n.eventId);
    if (filter === 'contract') return sorted.filter((n) => n.category === 'contract');
    if (filter === 'company') return sorted.filter((n) => n.companyId);
    return sorted;
  }, [news, filter]);

  return (
    <div className="p-6 md:p-8 max-w-[1400px] mx-auto bg-[#FBF9F4] min-h-screen">
      <header className="mb-6 border-b border-[#D8D0C4] pb-4">
        <div>
  <h1 className="text-2xl font-bold text-[#332B2B]">Новости</h1>
  <p className="font-mono text-xs text-[#776E64] uppercase tracking-widest mt-1">MediaWave · MDWV</p>
</div>
      </header>

      {activeEvents.length > 0 && (
        <div className="border border-[#C28B35] bg-[#C28B35]/10 p-4 mb-6">
          <div className="font-mono text-xs text-[#C28B35] uppercase tracking-widest mb-3 font-bold">
            Активные события ({activeEvents.length})
          </div>
          <div className="space-y-2">
            {activeEvents.map((ev) => (
              <div key={ev.id} className="border-b border-[#C28B35]/30 pb-2 last:border-0 last:pb-0">
                <div className="flex justify-between text-sm font-bold text-[#332B2B]">
                  <span>{ev.title}</span>
                  <span className="font-mono text-[#C28B35]">до мес. {ev.endsAtMonth + 1}</span>
                </div>
                <div className="font-mono text-xs text-[#776E64] mt-1">{ev.description}</div>
                {ev.effects.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {ev.effects.map((ef, i) => (
                      <span key={i} className="font-mono text-[10px] bg-[#C28B35]/20 text-[#C28B35] px-2 py-0.5 border border-[#C28B35]/30">
                        {effectLabel(ef)}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex gap-6 border-b border-[#D8D0C4] mb-6">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={`font-mono text-xs uppercase tracking-widest pb-2 transition ${
              filter === f.id
                ? 'text-[#332B2B] font-bold border-b-2 border-[#8B5A3C]'
                : 'text-[#776E64] hover:text-[#332B2B] border-b-2 border-transparent'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="border border-[#D8D0C4] bg-[#F4F1EA] p-8 text-center font-mono text-sm text-[#776E64]">
          Новостей пока нет.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((item) => {
            const expanded = expandedId === item.id;
            return (
              <article key={item.id} className="border border-[#D8D0C4] bg-[#F4F1EA] flex flex-col">
                <NewsPreview item={item} />
                <div className="p-5 flex flex-col flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono text-[10px] uppercase tracking-widest text-[#776E64]">
                      {item.category ? categoryLabel(item.category) : 'Новость'}
                    </span>
                    <span className="font-mono text-[10px] text-[#776E64]">{getMonthLabel(item.monthIndex)}</span>
                  </div>
                  <h2 className="font-bold text-base text-[#332B2B] leading-snug mb-2">{item.title}</h2>
                  {item.companyId && COMPANY_NAMES_RU[item.companyId] && (
                    <div className="font-mono text-xs text-[#8B5A3C] mb-2">{COMPANY_NAMES_RU[item.companyId]}</div>
                  )}
                  <p className={`text-sm text-[#332B2B] leading-relaxed ${expanded ? '' : 'line-clamp-3'}`}>
                    {item.body}
                  </p>
                  {item.body.length > 160 && (
                    <button
                      onClick={() => setExpandedId(expanded ? null : item.id)}
                      className="mt-3 self-start font-mono text-xs font-bold text-[#8B5A3C] hover:underline"
                    >
                      {expanded ? 'СВЕРНУТЬ' : 'ЧИТАТЬ ДАЛЕЕ →'}
                    </button>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}

function effectLabel(ef: { kind: string; targetId: string; multiplier: number }): string {
  const m = ef.multiplier;
  if (ef.kind === 'sectorDemand') return `Спрос ${ef.targetId} ×${m}`;
  if (ef.kind === 'resourcePrice') return `Ресурс ${ef.targetId} ×${m}`;
  if (ef.kind === 'companyPrice') return `Акция ${ef.targetId} ×${m}`;
  if (ef.kind === 'sectorCost') return `Издержки ${ef.targetId} ×${m}`;
  return `${ef.kind} ×${m}`;
}