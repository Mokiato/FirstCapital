import { useEffect, useState } from 'react';
import { useGameStore } from './game/store';
import TopBar from './components/TopBar';
import Sidebar from './components/Sidebar';
import OfficeScreen from './screens/OfficeScreen';
import InternetScreen from './screens/InternetScreen';
import BusinessesScreen from './screens/BusinessesScreen';
import ContractsScreen from './screens/ContractsScreen';
import RatingScreen from './screens/RatingScreen';
import { type Tab } from './components/Sidebar';
import SettingsModal from './components/SettingsModal';
import { loadFromStorage } from './game/persistence/save';
import { browserStorage } from './game/persistence/browserStorage';
import { LoadingScreen } from './components/LoadingScreen';
import { GameOverScreen } from './screens/GameOverScreen';

export default function App() {
  const [tab, setTab] = useState<Tab>('office');
  const [booting, setBooting] = useState(true);
    useEffect(() => {
    const handler = (e: Event) => {
      const custom = e as CustomEvent<string>;
      if (custom.detail) setTab(custom.detail as Tab);
    };
    window.addEventListener('firstcapital:navigate', handler);
    return () => window.removeEventListener('firstcapital:navigate', handler);
  }, []);
  const [settingsOpen, setSettingsOpen] = useState(false);
  // GDD v2.0 §3.1: время пошаговое. Ход делает кнопка «Завершить месяц»
  // (endTurn в gameStore): закрытие месяца → новый месяц → тик рынка.
const saveGame = useGameStore((s) => s.saveGame);
const loadGame = useGameStore((s) => s.loadGame);

// Загрузка сохранения при старте (один раз)
useEffect(() => {
  const saved = loadFromStorage<unknown>(browserStorage);
  if (saved) loadGame(saved);
}, [loadGame]);

// Сохранение при скрытии вкладки
useEffect(() => {
  const handleHide = () => {
    if (document.visibilityState === 'hidden') {
      saveGame();
    }
  };
  document.addEventListener('visibilitychange', handleHide);
  return () => document.removeEventListener('visibilitychange', handleHide);
}, [saveGame]);

// Сохранение при закрытии
useEffect(() => {
  const handleBeforeUnload = () => {
    saveGame();
  };
  window.addEventListener('beforeunload', handleBeforeUnload);
  return () => window.removeEventListener('beforeunload', handleBeforeUnload);
}, [saveGame]);

  const gameOver = useGameStore((s) => s.gameOver ?? false);
  // Загрузочный экран: минимум 5 секунд
  if (booting) {
    return <LoadingScreen onReady={() => setBooting(false)} />;
  }
  if (gameOver) {
    return <GameOverScreen />;
  }
  return (
    <div className="flex h-screen w-full bg-[#F4F1EA] text-[#332B2B]"> 
      <Sidebar active={tab} onChange={setTab} />

      {/* Main content area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <TopBar onOpenSettings={() => setSettingsOpen(true)} />
        <main className="flex-1 overflow-y-auto">
          {tab === 'office' && <OfficeScreen />}
          {tab === 'businesses' && <BusinessesScreen />}
          {tab === 'contracts' && <ContractsScreen />}
          {tab === 'internet' && <InternetScreen />}
          {tab === 'rating' && <RatingScreen />}
        </main>
      </div>

      <SettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </div>
  );
}