/** Usuario online si estuvo activo en los últimos 3 minutos */
export const ONLINE_THRESHOLD_MS = 3 * 60 * 1000;

export function isUserOnline(lastSeenAt?: string | null): boolean {
  if (!lastSeenAt) return false;
  return Date.now() - new Date(lastSeenAt).getTime() < ONLINE_THRESHOLD_MS;
}
