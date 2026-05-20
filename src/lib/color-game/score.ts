/** RGB en 0..255. Puntos 1..10 según cercanía (distancia euclídea normalizada en el cubo RGB). */

export type RGB = { r: number; g: number; b: number };

export function clamp255(n: number): number {
  return Math.max(0, Math.min(255, Math.round(n)));
}

function parseRgbComponent(v: unknown): number | null {
  if (typeof v !== "number" || !Number.isFinite(v)) return null;
  const x = Math.round(v);
  if (x < 0 || x > 255) return null;
  return x;
}

export function parseRgbBody(
  v: unknown
): RGB | null {
  if (!v || typeof v !== "object") return null;
  const o = v as Record<string, unknown>;
  const r = parseRgbComponent(o.r);
  const g = parseRgbComponent(o.g);
  const b = parseRgbComponent(o.b);
  if (r === null || g === null || b === null) return null;
  return { r, g, b };
}

/** Distancia 0 = igualdad, 1 = máximo alejamiento en el cubo (esquina opuesta). */
export function rgbNormalizedDistance(a: RGB, b: RGB): number {
  const dr = (a.r - b.r) / 255;
  const dg = (a.g - b.g) / 255;
  const db = (a.b - b.b) / 255;
  return Math.sqrt(dr * dr + dg * dg + db * db) / Math.sqrt(3);
}

/** Puntos enteros de 1 a 10. */
export function scoreFromDistance(normalizedDist: number): number {
  const d = Math.max(0, Math.min(1, normalizedDist));
  const points = Math.round(10 * (1 - d));
  return Math.max(1, Math.min(10, points));
}

export function roundScoreForGuess(target: RGB, guess: RGB): number {
  return scoreFromDistance(rgbNormalizedDistance(target, guess));
}

export function rgbToCss(rgb: RGB): string {
  return `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;
}
