import React, { useState } from 'react';
import { useGameStore } from '../game/store';
import { formatMoney, formatNumber } from '../utils/format';
import { getCompanyLevel, getReputation } from '../game/selectors';
import { StatisticsContent } from './StatisticsContent';
import Modal from './Modal';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({ isOpen, onClose }) => {
  const state = useGameStore();
  const [showEditName, setShowEditName] = useState(false);
  const [nameInput, setNameInput] = useState(state.companyName);

  const level = getCompanyLevel(state);
  const reputation = getReputation(state);

  // Формула XP для уровня компании
  const getXpForLevel = (lvl: number) => Math.floor(10000 * Math.pow(1.2, lvl));
  const nextLevelXp = getXpForLevel(level + 1);
  const xpProgress = (state.totalEarned / nextLevelXp) * 100;

  return (
    <Modal open={isOpen} onClose={onClose} title="Профиль">
      {/* Аватар и название */}
      <div className="bg-neutral-800 rounded-xl p-4 mb-4">
        <div className="flex items-center gap-4 mb-4">
          <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-600 to-emerald-800 text-5xl">
            {state.avatarEmoji}
          </div>
          <div className="flex-1">
            <button onClick={() => setShowEditName(true)} className="text-left mb-1">
              <div className="text-xl font-bold text-white">{state.companyName} ✏️</div>
            </button>
            <div className="text-sm text-neutral-400">Уровень компании {level} / 100</div>
            <div className="text-sm font-semibold text-amber-400">
              {level >= 50 ? 'VIP статус' : 'Обычный статус'}
            </div>
          </div>
        </div>

        {/* Прогресс-бар уровня компании */}
        <div className="mb-3">
          <div className="flex justify-between text-xs mb-1">
            <span className="text-neutral-400">Прогресс уровня</span>
            <span className="text-neutral-400">{formatMoney(state.totalEarned)}</span>
          </div>
          <div className="h-3 bg-neutral-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 via-emerald-400 to-emerald-300 transition-all duration-300"
              style={{ width: `${Math.min(xpProgress, 100)}%` }}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="bg-neutral-900 rounded-lg p-2">
            <div className="text-xs text-neutral-500">Капитал</div>
            <div className="font-bold text-white">{formatMoney(state.balance)}</div>
          </div>
          <div className="bg-neutral-900 rounded-lg p-2">
            <div className="text-xs text-neutral-500">Квинты</div>
          </div>
          <div className="bg-neutral-900 rounded-lg p-2">
            <div className="text-xs text-neutral-500">Репутация</div>
            <div className="font-bold text-sky-400">★ {formatNumber(reputation)}</div>
          </div>
          <div className="bg-neutral-900 rounded-lg p-2">
            <div className="text-xs text-neutral-500">Биткоины</div>
            <div className="font-bold text-yellow-500">{state.bitcoins.toFixed(4)}</div>
          </div>
        </div>
      </div>

      {/* Ежедневные задания */}
      <div className="bg-neutral-800 rounded-xl p-4 mb-4">
        <h3 className="font-semibold text-white mb-3">Ежедневные задания</h3>
        <div className="space-y-2">
          {state.quests.map((q) => {
            const done = q.progress >= q.target;
            return (
              <div key={q.id} className="bg-neutral-900 rounded-lg p-3">
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-neutral-200">{q.text}</span>
                  <span className="text-xs text-amber-400">+{formatMoney(q.reward)}</span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-neutral-700 mb-2">
                  <div
                    className="h-full bg-emerald-500"
                    style={{ width: `${Math.min(100, (q.progress / q.target) * 100)}%` }}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-neutral-500">
                    {formatNumber(q.progress)} / {formatNumber(q.target)}
                  </span>
                  <button
                    disabled={!done || q.claimed}
                    onClick={() => state.claimQuest(q.id)}
                    className="rounded-lg bg-amber-600 px-3 py-1 text-xs font-semibold text-white disabled:bg-neutral-700 disabled:text-neutral-500"
                  >
                    {q.claimed ? 'Получено' : 'Забрать'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Статистика (Блок 3) */}
      <div className="bg-neutral-800 rounded-xl p-4 mb-4">
        <StatisticsContent />
      </div>

      <Modal open={showEditName} onClose={() => setShowEditName(false)} title="Название компании">
        <div className="space-y-3">
          <input
            value={nameInput}
            onChange={(e) => setNameInput(e.target.value)}
            maxLength={24}
            className="w-full rounded-xl bg-neutral-800 px-4 py-3 text-white outline-none ring-1 ring-neutral-700 focus:ring-emerald-500"
          />
          <button
            onClick={() => {
              state.setCompanyName(nameInput);
              setShowEditName(false);
            }}
            className="w-full rounded-xl bg-emerald-600 py-3 font-semibold text-white"
          >
            Сохранить
          </button>
        </div>
      </Modal>
    </Modal>
  );
};
