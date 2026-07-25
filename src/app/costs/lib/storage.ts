import { Calculation } from "./types";

const STORAGE_KEY = "shipping-cost-calculations";

export function getCalculations(): Calculation[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Calculation[]) : [];
  } catch {
    return [];
  }
}

export function getCalculation(id: string): Calculation | undefined {
  return getCalculations().find((c) => c.id === id);
}

export function saveCalculation(calc: Calculation): void {
  if (typeof window === "undefined") return;
  const all = getCalculations();
  all.unshift(calc);
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
}

export function deleteCalculation(id: string): void {
  if (typeof window === "undefined") return;
  const all = getCalculations().filter((c) => c.id !== id);
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
}

export function duplicateCalculation(id: string): Calculation | undefined {
  const original = getCalculation(id);
  if (!original) return undefined;
  const copy: Calculation = {
    ...original,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString().slice(0, 10),
  };
  saveCalculation(copy);
  return copy;
}
