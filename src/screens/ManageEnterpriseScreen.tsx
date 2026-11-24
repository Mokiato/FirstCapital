// src/screens/ManageEnterpriseScreen.tsx
import { useState } from 'react';
import { useGameStore } from '../store';
import { formatMoney } from '../utils/format';
import { PRODUCTIONS_BY_ID } from '../data/productions';
import { OFFICE_COMPANIES_BY_ID } from '../data/officeCompanies';
import { getOfficeBonuses } from '../selectors';

export function ManageEnterpriseScreen() {
  const enterprises = useGameStore((s) => s.enterprises);
  const updateEnterprise = useGameStore((s) => s.updateEnterprise);
  const bonuses = useGameStore(getOfficeBonuses);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = enterprises.find((e) => e.id === selectedId);

  const hasEngineeringService = bonuses.breakdownReduction > 0;
  const hasInsuranceBureau = bonuses.insuranceCoverage > 0;

  const toggleInsurance = (id: string) => {
    const ent = enterprises.find((e) => e.id === id);
    if (!ent) return;
    updateEnterprise(id, { insured: !ent.insured });
  };

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Управление предприятиями</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Список предприятий */}
        <div className="space-y-2">
          <h2 className="text-lg font-semibold">Предприятия ({enterprises.length})</h2>
          {enterprises.map((ent) => {
            const def = PRODUCTIONS_BY_ID[ent.defId] || OFFICE_COMPANIES_BY_ID[ent.defId];
            if (!def) return null;

            const wearColor =
              ent.wear < 30 ? 'text-green-600' :
              ent.wear < 70 ? 'text-yellow-600' :
              'text-red-600';

            return (
              <div
                key={ent.id}
                onClick={() => setSelectedId(ent.id)}
                className={`p-3 border rounded cursor-pointer transition ${
                  selectedId === ent.id ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:bg-gray-50'
                }`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-medium">{def.name}</div>
                    <div className="text-sm text-gray-600">
                      Статус: {ent.status === 'active' ? '🟢 Активно' : '🔴 Остановлено'}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`text-sm font-mono ${wearColor}`}>
                      Износ: {Math.round(ent.wear || 0)}%
                    </div>
                    <div className="text-xs text-gray-500">
                      {ent.insured ? '🛡️ Застраховано' : '⚠️ Без страховки'}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Детали выбранного предприятия */}
        {selected && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">
              {(PRODUCTIONS_BY_ID[selected.defId] || OFFICE_COMPANIES_BY_ID[selected.defId])?.name}
            </h2>

            <div className="space-y-3">
              {/* Износ */}
              <div>
                <div className="text-sm font-medium mb-1">Износ оборудования</div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-gray-200 rounded-full h-4">
                    <div
                      className={`h-4 rounded-full transition-all ${
                        selected.wear < 30 ? 'bg-green-500' :
                        selected.wear < 70 ? 'bg-yellow-500' :
                        'bg-red-500'
                      }`}
                      style={{ width: `${Math.round(selected.wear || 0)}%` }}
                    />
                  </div>
                  <span className="text-sm font-mono w-12 text-right">
                    {Math.round(selected.wear || 0)}%
                  </span>
                </div>
                <div className="text-xs text-gray-600 mt-1">
                  {selected.wear < 30 && '✅ Состояние хорошее'}
                  {selected.wear >= 30 && selected.wear < 70 && '⚠️ Требуется обслуживание'}
                  {selected.wear >= 70 && '🚨 Высокий риск поломки!'}
                </div>
              </div>

              {/* Страхование */}
              <div className="border-t pt-3">
                <div className="flex justify-between items-center mb-2">
                  <div className="text-sm font-medium">Страхование оборудования</div>
                  <button
                    onClick={() => toggleInsurance(selected.id)}
                    className={`px-3 py-1 rounded text-sm font-medium transition ${
                      selected.insured
                        ? 'bg-green-500 text-white hover:bg-green-600'
                        : 'bg-gray-300 text-gray-700 hover:bg-gray-400'
                    }`}
                  >
                    {selected.insured ? '✓ Активно' : 'Включить'}
                  </button>
                </div>
                <div className="text-xs text-gray-600 space-y-1">
                  <div>
                    Стоимость: {formatMoney(
                      Math.round((PRODUCTIONS_BY_ID[selected.defId] || OFFICE_COMPANIES_BY_ID[selected.defId])?.equipmentCost * 0.004 || 0)
                    )} / мес
                  </div>
                  <div>
                    Покрытие: {hasInsuranceBureau ? '90%' : '70%'} ущерба при поломке
                  </div>
                  {hasInsuranceBureau && (
                    <div className="text-blue-600">
                      🏢 Страховое бюро: +20% покрытия
                    </div>
                  )}
                </div>
              </div>

              {/* Инженерный сервис */}
              {hasEngineeringService && (
                <div className="border-t pt-3">
                  <div className="text-sm font-medium mb-1">🏢 Инженерный сервис</div>
                  <div className="text-xs text-gray-600 space-y-1">
                    <div>✓ Вероятность поломки: −20%</div>
                    <div>✓ Ущерб при поломке: −20%</div>
                  </div>
                </div>
              )}

              {/* Последняя поломка */}
              {selected.lastBreakdownMonth !== undefined && (
                <div className="border-t pt-3">
                  <div className="text-sm font-medium mb-1">Последняя поломка</div>
                  <div className="text-xs text-gray-600">
                    Месяц {selected.lastBreakdownMonth} (cooldown 6 мес)
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}