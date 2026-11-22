import { useEffect, useState } from 'react';
import { useGameStore } from '../game/store';
import { getCompanyLevel } from '../game/selectors';
import { WorkCard } from '../components/WorkCard';
import { JobMarketModal } from '../components/JobMarketModal';
import { ProfileModal } from '../components/ProfileModal';
import { FOOD_ITEMS_BY_ID } from '../data/food';
import garageImg from '../assets/offices/garage.jpg';
import officeImg from '../assets/offices/office.jpg';
import skyscraperImg from '../assets/offices/skyscraper.jpg';
import penthouseImg from '../assets/offices/penthouse.jpg';

export default function OfficeScreen() {
  const state = useGameStore();
  const [showJobMarket, setShowJobMarket] = useState(false);
  const [showProfile, setShowProfile] = useState(false);

  const level = getCompanyLevel(state);

  const getOfficeBg = () => {
    if (level >= 61) return penthouseImg;
    if (level >= 31) return skyscraperImg;
    if (level >= 11) return officeImg;
    return garageImg;
  };

  useEffect(() => {
    state.refreshQuestsIfNeeded();
  }, []);

  return (
    <div className="p-6 md:p-8 max-w-[1400px] mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

        {/* ЛЕВАЯ КОЛОНКА: Фото офиса */}
        <div className="lg:col-span-7 hidden lg:block">
          <div
            className="w-full h-[600px] border border-[#D8D0C4] bg-cover bg-center relative"
            style={{ backgroundImage: `url(${getOfficeBg()})` }}
          >
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
            <div className="absolute bottom-8 left-8 right-8">
              <h3 className="text-white font-bold text-3xl mb-2 tracking-tight">{state.companyName}</h3>
              <p className="text-[#D8D0C4] font-mono text-sm uppercase tracking-widest">Штаб-квартира (Ур. {level})</p>
            </div>
          </div>
        </div>

        {/* ПРАВАЯ КОЛОНКА: Панели */}
        <div className="lg:col-span-5 space-y-6">
          <WorkCard onOpenJobMarket={() => setShowJobMarket(true)} />

          {/* Инвентарь */}
          <div className="border border-[#D8D0C4] bg-[#FBF9F4] p-6">
            <div className="flex items-center gap-2 mb-4 border-b border-[#D8D0C4] pb-2">
              <span className="font-mono text-xs text-[#776E64] uppercase tracking-widest">Инвентарь</span>
            </div>
            {Object.keys(state.personalInventory ?? {}).length === 0 ? (
              <p className="font-mono text-sm text-[#776E64]">
                Пусто. Закажите еду в «Доставке на дом».
              </p>
            ) : (
              <div className="space-y-2">
                {Object.entries(state.personalInventory).map(([foodId, qty]) => {
                  const def = FOOD_ITEMS_BY_ID[foodId];
                  if (!def) return null;
                  return (
                    <div key={foodId} className="flex items-center justify-between border-b border-[#D8D0C4] py-2 last:border-0">
                      <div className="flex items-center gap-3">
                        <span className="text-lg">{def.emoji}</span>
                        <span className="font-mono text-sm text-[#332B2B]">{def.name} <span className="text-[#776E64]">×{qty}</span></span>
                      </div>
                      <button
                        onClick={() => state.consumeFoodItem(foodId)}
                        className="font-mono text-xs font-bold text-[#8B5A3C] hover:underline"
                      >
                        СЪЕСТЬ
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      <JobMarketModal isOpen={showJobMarket} onClose={() => setShowJobMarket(false)} />
      <ProfileModal isOpen={showProfile} onClose={() => setShowProfile(false)} />
    </div>
  );
}