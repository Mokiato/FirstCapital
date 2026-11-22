import React from 'react';
import { useGameStore } from '../game/store';
import { CAREERS } from '../data/careers';
import { formatMoney } from '../utils/format';
import { getCompanyLevel } from '../game/selectors';
import Modal from './Modal';

export const JobMarketModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const state = useGameStore();
  const companyLevel = getCompanyLevel(state);

  const handleHire = (careerId: string) => {
    state.changeCareer(careerId);
    onClose();
  };

  return (
    <Modal open={isOpen} onClose={onClose} title="Рынок труда" wide>
      <div className="bg-[#FBF9F4] text-[#332B2B]">
        
        <div className="border border-[#D8D0C4] bg-[#F4F1EA]">
          {CAREERS.map((career) => {
            const isUnlocked = companyLevel >= career.unlockCompanyLevel;
            const isCurrent = state.currentCareerId === career.id;
            const prog = state.careerProgress[career.id];
            const currentLevel = prog ? career.levels[prog.stageIndex] : null;

            return (
              <div key={career.id} className={`p-4 border-b border-[#D8D0C4] last:border-0 transition ${!isUnlocked ? 'opacity-50' : ''}`}>
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="font-bold text-lg text-[#332B2B]">{career.name}</h3>
                      <span className="font-mono text-[10px] uppercase tracking-widest text-[#776E64] border border-[#D8D0C4] px-2 py-0.5">{career.sphere}</span>
                    </div>
                    <div className="font-mono text-sm text-[#776E64]">
                      Базовый доход: <span className="text-[#4A7C59] font-bold">{formatMoney(career.baseIncome)}</span> / мес
                    </div>
                    
                    {prog && currentLevel && (
                      <div className="mt-2 font-mono text-xs text-[#8B5A3C]">
                        Ваша должность: {currentLevel}
                      </div>
                    )}
                  </div>

                  <div className="shrink-0 w-full md:w-48">
                    {isUnlocked ? (
                      <button
                        onClick={() => handleHire(career.id)}
                        disabled={isCurrent}
                        className={`w-full py-2 font-mono text-xs font-bold transition ${
                          isCurrent 
                            ? 'bg-[#D8D0C4] text-[#776E64] cursor-not-allowed' 
                            : 'bg-[#8B5A3C] text-white hover:bg-[#73482F]'
                        }`}
                      >
                        {isCurrent ? 'ТЕКУЩАЯ' : 'УСТРОИТЬСЯ'}
                      </button>
                    ) : (
                      <div className="w-full py-2 text-center font-mono text-[10px] uppercase tracking-widest text-[#776E64] border border-[#D8D0C4] bg-[#F4F1EA]">
                        С ур. {career.unlockCompanyLevel}
                      </div>
                    )}
                  </div>

                </div>
              </div>
            );
          })}
        </div>

      </div>
    </Modal>
  );
};