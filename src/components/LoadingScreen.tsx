import { useEffect, useState } from 'react';

export function LoadingScreen({ onReady }: { onReady: () => void }) {
  const [minTimePassed, setMinTimePassed] = useState(false);

  useEffect(() => {
    // Минимум 5 секунд
    const timer = setTimeout(() => setMinTimePassed(true), 5000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    // Если прошло 5 секунд, сообщаем родителю
    if (minTimePassed) onReady();
  }, [minTimePassed, onReady]);

  return (
    <div className="fixed inset-0 z-[9999] bg-black flex items-center justify-center overflow-hidden">
      <img
        src="/assets/loading.png"
        alt="Загрузка"
        className="w-full h-full object-cover"
        onError={(e) => { e.currentTarget.style.display = 'none'; }}
      />
      <div className="absolute bottom-6 left-6 text-neutral-400 font-mono text-sm animate-pulse">
        Загрузка...
      </div>
    </div>
  );
}