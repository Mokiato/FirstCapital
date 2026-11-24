// src/game/economy/b2cDemand.ts
// GDD v2.0 §6.2–6.3: отдельный контур B2C-спроса и пропорциональное
// распределение остаточного спроса методом наибольших остатков
// (детерминированно, независимо от порядка бизнесов в массиве).

export interface DemandQuota {
  instanceId: string;
  defId: string;
  sectorId: string;
  /** Потенциальная выручка месяца при 100% загрузке, ₽. */
  quota: number;
}

export interface DemandAllocation {
  /** Распределённая выручка, целые ₽. */
  revenue: number;
  /** Доля удовлетворения квоты: 1 = полный спрос, <1 = дефицит спроса. */
  ratio: number;
}

/** Метод наибольших остатков: целые рубли, детерминированные тай-брейки. */
export function distributeByLargestRemainder(
  quotas: DemandQuota[],
  pool: number,
): Record<string, number> {
  const out: Record<string, number> = {};
  const total = quotas.reduce((s, q) => s + q.quota, 0);
  if (total <= 0) return out;

  // Спрос покрывает всё предложение — каждый получает свою квоту.
  if (total <= pool) {
    for (const q of quotas) out[q.instanceId] = Math.round(q.quota);
    return out;
  }

  const poolInt = Math.round(pool);
  const rows: Array<{ id: string; frac: number; base: number }> = [];
  let allocated = 0;
  for (const q of quotas) {
    const raw = (poolInt * q.quota) / total;
    const base = Math.floor(raw);
    allocated += base;
    rows.push({ id: q.instanceId, frac: raw - base, base });
  }

  let rest = Math.max(0, poolInt - allocated);
  // Сортировка: дробная часть убывает, при равенстве — id возрастает (детерминизм).
  const ordered = [...rows].sort(
    (a, b) => b.frac - a.frac || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0),
  );
  for (let i = 0; rest > 0 && i < ordered.length; i++) {
    ordered[i].base += 1;
    rest -= 1;
  }
  for (const r of rows) out[r.id] = r.base;
  return out;
}

/** Распределяет B2C-спрос: группировка по типу бизнеса (defId), пул на тип. */
export function allocateB2CDemand(
  quotas: DemandQuota[],
  poolByDefId: Record<string, number>,
): Record<string, DemandAllocation> {
  const byCategory = new Map<string, DemandQuota[]>();
  for (const q of quotas) {
    const list = byCategory.get(q.defId) ?? [];
    list.push(q);
    byCategory.set(q.defId, list);
  }

  const out: Record<string, DemandAllocation> = {};
  for (const [defId, list] of byCategory) {
    const pool = poolByDefId[defId] ?? 0;
    const allocated = distributeByLargestRemainder(list, pool);
    for (const q of list) {
      const revenue = allocated[q.instanceId] ?? 0;
      out[q.instanceId] = {
        revenue,
        ratio: q.quota > 0 ? Math.min(1, revenue / q.quota) : 0,
      };
    }
  }
  return out;
}