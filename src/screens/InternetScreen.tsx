import { useState } from 'react';
import BankScreen from './BankScreen';
import ShopScreen from './ShopScreen';
import DeliveryScreen from './DeliveryScreen';
import NewsScreen from './NewsScreen';
import MarketScreen from './MarketScreen';
import AssetShopScreen from './AssetShopScreen';

type Site = 'home' | 'bank' | 'shop' | 'delivery' | 'news' | 'games' | 'car' | 'realestate' | 'yacht' | 'plane' | 'market';

export default function InternetScreen() {
  const [site, setSite] = useState<Site>('home');

    const firstRow = [
    { id: 'bank', label: 'КапиталТрастБанк', icon: '🏦', color: 'bg-[#8B5A3C]' },
    { id: 'shop', label: 'МагистральОпт', icon: '🛒', color: 'bg-[#A87B5E]' },
    { id: 'news', label: 'МедиаВэйв24', icon: '📰', color: 'bg-[#C28B35]' },
    { id: 'games', label: 'Игры', icon: '🎮', color: 'bg-[#4A7C59]' },
    { id: 'market', label: 'БрокерПро', icon: '📈', color: 'bg-[#332B2B]' },
  ];

  const secondRow = [
    { id: 'delivery', label: 'ФрешМаркет', icon: '🛵', color: 'bg-[#776E64]' },
    { id: 'car', label: 'МекВорксДилер', icon: '🚗', color: 'bg-[#8B5A3C]' },
    { id: 'realestate', label: 'КвартираПлюс', icon: '🏠', color: 'bg-[#A87B5E]' },
    { id: 'yacht', label: 'ТитанМарин', icon: '🛥️', color: 'bg-[#332B2B]' },
    { id: 'plane', label: 'АэроЛюкс', icon: '✈️', color: 'bg-[#4A7C59]' },
  ];

  return (
    <div className="flex flex-col h-[calc(100vh-100px)] bg-[#F4F1EA] overflow-hidden m-4 md:m-6 border border-[#D8D0C4]">
      
      {/* Шапка браузера */}
      <div className="flex items-center gap-2 bg-[#FBF9F4] border-b border-[#D8D0C4] p-3">
        <button onClick={() => setSite('home')} disabled={site === 'home'} className="p-2 text-[#776E64] hover:text-[#332B2B] disabled:opacity-30">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
        </button>
        <button onClick={() => setSite('home')} className="p-2 text-[#776E64] hover:text-[#332B2B]">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
        </button>
        <div className="flex-1 bg-[#F4F1EA] border border-[#D8D0C4] px-4 py-1.5 font-mono text-xs text-[#776E64] truncate">
          {site === 'home' ? 'Главная страница' : site === 'bank' ? 'kapitaltrust.ru' : site === 'market' ? 'brokerpro.ru' : `https://${site}.ru`}
        </div>
      </div>

      {/* Контент */}
      <div className="flex-1 overflow-y-auto bg-[#FBF9F4] relative">
        {site === 'home' && (
          <div className="p-8 max-w-[1200px] mx-auto">
            <div className="flex justify-between items-center mb-8 border-b border-[#D8D0C4] pb-4">
              <div className="text-2xl font-bold text-[#332B2B]">Рабочий стол инвестора</div>
              <div className="font-mono text-xs text-[#776E64]">15.11.2026</div>
            </div>
            
            {/* Первый ряд */}
            <div className="grid grid-cols-5 gap-4 mb-6">
              {firstRow.map(s => (
                <button key={s.id} onClick={() => setSite(s.id as Site)} className="flex flex-col items-center gap-3 group">
                  <div 
                    className={`w-20 h-20 ${s.color} text-white flex items-center justify-center text-3xl shadow-sm group-hover:-translate-y-1 transition-transform`}
                    style={{ borderRadius: '16px' }}
                  >
                    {s.icon}
                  </div>
                  <span className="font-semibold text-xs text-[#332B2B] text-center">{s.label}</span>
                </button>
              ))}
            </div>

            {/* Второй ряд */}
            <div className="grid grid-cols-5 gap-4">
              {secondRow.map(s => (
                <button key={s.id} onClick={() => setSite(s.id as Site)} className="flex flex-col items-center gap-3 group">
                  <div 
                    className={`w-20 h-20 ${s.color} text-white flex items-center justify-center text-3xl shadow-sm group-hover:-translate-y-1 transition-transform`}
                    style={{ borderRadius: '16px' }}
                  >
                    {s.icon}
                  </div>
                  <span className="font-semibold text-xs text-[#332B2B] text-center">{s.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Страницы */}
        <div className="min-h-full bg-[#FBF9F4] text-[#332B2B] p-0">
          {site === 'bank' && <BankScreen />}
          {site === 'market' && <MarketScreen />}
          {site === 'shop' && <ShopScreen />}
          {site === 'delivery' && <DeliveryScreen />}
          {site === 'news' && <NewsScreen />}
          {site === 'car' && <AssetShopScreen mode="car" />}
          {site === 'realestate' && <AssetShopScreen mode="realestate" />}
          {site === 'yacht' && <AssetShopScreen mode="yacht" />}
          {site === 'plane' && <AssetShopScreen mode="plane" />}
        </div>
      </div>
    </div>
  );
}