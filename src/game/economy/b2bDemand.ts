// src/game/economy/b2bDemand.ts
// GDD v2.0 §6.2–6.3: распределение остаточного B2B-спроса между предприятиями
// игрока методом наибольших остатков (детерминированно, независимо от порядка).

export interface B2BDemandAllocation {
  /** Распределённая выручка, целые ₽. */
  revenue: number;
  /** Доля удовлетворения спроса: 1 = весь выпуск продан, <1 = дефицит. */
  ratio: number;
}

export interface ShareClaim {
  /** Уникальный ключ получателя (instanceId). */
  id: string;
  /** Заявленное количество (единицы ресурса). */
  want: number;
}

/** Метод наибольших остатков: целое распределение пула между заявками. */
export function distributeByLargestRemainder(
  claims: ShareClaim[],
  pool: number,
): Record<string, number> {
  const out: Record<string, number> = {};
  const total = claims.reduce((s, c) => s + c.want, 0);
  if (total <= 0) return out;

  const poolInt = Math.max(0, Math.floor(pool));
  if (poolInt <= 0) return out;

  // Спрос покрывает всё предложение — каждый продаёт сколько произвёл.
  if (total <= poolInt) {
    for (const c of claims) out[c.id] = Math.floor(c.want);
    return out;
  }

  const rows: Array<{ id: string; frac: number; base: number }> = [];
  let allocated = 0;
  for (const c of claims) {
    const raw = (poolInt * c.want) / total;
    const base = Math.floor(raw);
    allocated += base;
    rows.push({ id: c.id, frac: raw - base, base });
  }

  let rest = Math.max(0, poolInt - allocated);
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