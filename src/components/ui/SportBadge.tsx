import clsx from "clsx";
import type { SportType } from "@/lib/types";

export function SportBadge({ sport }: { sport: SportType | string }) {
  const label = String(sport).replace("bare_knuckle", "bare knuckle");
  const tone: Record<string, string> = {
    mma: "bg-madness-red/95 text-white",
    boxing: "bg-madness-blue/90 text-white",
    kickboxing: "bg-madness-gold/90 text-black",
    bare_knuckle: "bg-madness-purple/90 text-white",
  };
  return <span className={clsx("rounded-md px-2 py-1 text-[11px] font-black uppercase tracking-wide", tone[String(sport)] || "bg-white/10")}>{label}</span>;
}
