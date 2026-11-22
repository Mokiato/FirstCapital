import React, { useState } from 'react';
import { useGameStore } from '../game/store';
import { CAREERS_BY_ID } from '../data/careers';

export const WorkCard: React.FC<{ onOpenJobMarket: () => void }> = ({ onOpenJobMarket }) => {
  const state = useGameStore();
  const careerId = state.currentCareerId;
  const career = careerId ? CAREERS_BY_ID[careerId] : null;
  const prog = careerId ? state.careerProgress[careerId] : null;
  const [imgError, setImgError] = useState(false);

  if (!career) {
    return (
      <div className="border border-[#D8D0C4] bg-[#FBF9F4] p-8 text-center">
        <div className="font-mono text-xs text-[#776E64] uppercase tracking-widest mb-4">Вы безработный</div>
        <button onClick={onOpenJobMarket} className="bg-[#8B5A3C] px-6 py-2 text-sm font-bold text-white hover:bg-[#73482F]">
          Найти работу
        </button>
      </div>
    );
  }

  const currentLevel = career.levels[prog?.stageIndex ?? 0];
  const nextLevel = career.levels[(prog?.stageIndex ?? 0) + 1];
  const currentMonth = Math.floor(state.totalGameMonths);
  const isWorkedThisMonth = prog ? prog.lastWorkedMonth === currentMonth : false;

  return (
    <div className="border border-[#D8D0C4] bg-[#FBF9F4] flex flex-col">
      <div className="p-6">
        {/* Заголовок */}
        <div className="flex justify-between items-start mb-6 border-b border-[#D8D0C4] pb-4">
          <div>
            <h3 className="text-xl font-bold text-[#332B2B]">{currentLevel}</h3>
            {nextLevel && <p className="font-mono text-xs text-[#4A7C59] mt-1">↓ {nextLevel}</p>}
            <p className="font-mono text-xs text-[#776E64] mt-1 uppercase tracking-widest">{career.name}</p>
          </div>
          <button onClick={onOpenJobMarket} className="font-mono text-xs text-[#776E64] hover:text-[#8B5A3C] uppercase font-bold">
            Сменить
          </button>
        </div>

        {/* Картинка */}
        <div className="w-full h-32 bg-[#F4F1EA] border border-[#D8D0C4] mb-6 flex items-center justify-center overflow-hidden relative">
          {!imgError ? (
            <img
              src={`/assets/careers/${career.id}.png`}
              alt={career.name}
              className="w-full h-full object-cover"
              onError={() => setImgError(true)}
            />
          ) : (
            <span className="text-4xl opacity-50">💼</span>
          )}
        </div>

        {/* Прогресс */}
        <div className="space-y-4 mb-6">
          {nextLevel && (
            <div>
              <div className="flex justify-between font-mono text-xs text-[#776E64] mb-1 uppercase tracking-widest">
                <span>До повышения</span>
                <span>{prog?.experience} / {((prog?.stageIndex ?? 0) + 1) * 100} XP</span>
              </div>
              <div className="h-1 w-full bg-[#D8D0C4]">
                <div className="h-full bg-[#4A7C59]" style={{ width: `${Math.min(100, ((prog?.experience || 0) / (((prog?.stageIndex ?? 0) + 1) * 100)) * 100)}%` }} />
              </div>
            </div>
          )}
          <div>
            <div className="flex justify-between font-mono text-xs text-[#776E64] mb-1 uppercase tracking-widest">
              <span>Энергия</span>
              <span>{state.energy} / 100</span>
            </div>
            <div className="h-1 w-full bg-[#D8D0C4]">
              <div className="h-full bg-[#8B5A3C]" style={{ width: `${Math.min(100, state.energy)}%` }} />
            </div>
          </div>
        </div>
      </div>

      {/* Кнопки */}
      <div className="mt-auto grid grid-cols-2 border-t border-[#D8D0C4]">
        <button
          onClick={() => state.workCareer()}
          disabled={isWorkedThisMonth}
          className={`py-4 font-mono text-sm font-bold uppercase tracking-widest transition-colors ${
            isWorkedThisMonth 
              ? 'bg-[#F4F1EA] text-[#776E64]' 
              : 'bg-[#8B5A3C] text-white hover:bg-[#73482F]'
          }`}
        >
          {isWorkedThisMonth ? 'Ждать' : 'Работать'}
        </button>
        <button
          onClick={() => state.rest()}
          className="py-4 font-mono text-sm font-bold uppercase tracking-widest text-[#332B2B] hover:bg-[#F4F1EA] transition-colors border-l border-[#D8D0C4]"
        >
          Отдых
        </button>
      </div>
    </div>
  );
};