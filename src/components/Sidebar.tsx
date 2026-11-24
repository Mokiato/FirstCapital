import { cn } from '../utils/cn';
import { 
  Building2, Briefcase, Globe, FileText, 
  Trophy 
} from 'lucide-react';

export type Tab = 'office' | 'businesses' | 'internet' | 'contracts' | 'rating';

const BASE_TABS: { id: Tab; label: string; icon: any }[] = [
  { id: 'office', label: 'Офис', icon: Building2 },
  { id: 'businesses', label: 'Бизнесы', icon: Briefcase },
  { id: 'internet', label: 'Интернет', icon: Globe },
  { id: 'contracts', label: 'Контракты', icon: FileText },
  { id: 'rating', label: 'Рейтинг', icon: Trophy },
];

export default function Sidebar({ active, onChange }: { active: Tab; onChange: (t: Tab) => void }) {
  return (
    <aside className="flex w-[240px] flex-col border-r border-[#D8D0C4] bg-[#FBF9F4]">
      {/* Логотип */}
      <div className="flex items-center border-b border-[#D8D0C4] p-6">
        <div className="text-lg font-bold text-[#332B2B] tracking-widest uppercase">
          Первый Капитал
        </div>
      </div>
      {/* Меню */}
      <nav className="flex-1 py-4">
        <div className="space-y-1">
          {BASE_TABS.map((t) => {
            const Icon = t.icon;
            const isActive = active === t.id;
            return (
              <button
                key={t.id}
                onClick={() => onChange(t.id)}
                className={cn(
                  'flex w-full items-center gap-3 px-6 py-3 text-left text-sm font-medium transition-colors border-l-2',
                  isActive
                    ? 'border-[#8B5A3C] text-[#8B5A3C] bg-[#8B5A3C]/5'
                    : 'border-transparent text-[#776E64] hover:text-[#332B2B] hover:bg-black/5'
                )}
              >
                <Icon size={18} strokeWidth={isActive ? 2 : 1.5} />
                <span>{t.label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      <div className="border-t border-[#D8D0C4] p-4 text-center font-mono text-[10px] text-[#776E64]">
        v1.0.0 • EDITION 2026
      </div>
    </aside>
  );
}