import { getItem, setItem, KEYS } from "@/lib/storage";

/** Totales solo en este navegador si no hay API Supabase. */
export function getLocalColorTotal(userId: string): number {
  const m = getItem<Record<string, number>>(KEYS.colorGameTotals) ?? {};
  return m[userId] ?? 0;
}

export function addLocalColorTotal(userId: string, delta: number): number {
  const m = { ...(getItem<Record<string, number>>(KEYS.colorGameTotals) ?? {}) };
  m[userId] = (m[userId] ?? 0) + delta;
  setItem(KEYS.colorGameTotals, m);
  return m[userId];
}
