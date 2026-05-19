export const TEMP_MIN = 2;
export const TEMP_MAX = 8;
export const HUM_MIN = 35;
export const HUM_MAX = 45;

export function isAlert(temp: number, hum: number) {
  return temp < TEMP_MIN || temp > TEMP_MAX || hum < HUM_MIN || hum > HUM_MAX;
}

// Generates next sensor reading near a target with some drift and occasional excursions
export function nextReading(prev?: { temperature: number; humidity: number }) {
  const baseT = prev?.temperature ?? 5;
  const baseH = prev?.humidity ?? 40;
  const driftT = (Math.random() - 0.5) * 0.8;
  const driftH = (Math.random() - 0.5) * 2;
  // 6% chance of excursion
  const spike = Math.random() < 0.06 ? (Math.random() < 0.5 ? -2.5 : 2.5) : 0;
  const t = Math.round((baseT + driftT + spike) * 10) / 10;
  const h = Math.round((baseH + driftH) * 10) / 10;
  return { temperature: t, humidity: h };
}

export function formatTime(d: Date | string) {
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}
