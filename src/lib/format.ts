export function money(value: number | string | undefined) {
  const n = Number(value || 0);
  return n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
}

export function number(value: number | string | undefined) {
  return Number(value || 0).toLocaleString("en-US");
}

export function shortDate(value: string | Date | undefined) {
  if (!value) return "TBD";
  return new Date(value).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

export function timeLeft(lockAt?: string) {
  if (!lockAt) return "00:00:00";
  const diff = Math.max(0, new Date(lockAt).getTime() - Date.now());
  const h = Math.floor(diff / 3600_000);
  const m = Math.floor((diff % 3600_000) / 60_000);
  const s = Math.floor((diff % 60_000) / 1000);
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}
