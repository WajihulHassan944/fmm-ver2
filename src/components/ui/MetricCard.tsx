import type { LucideIcon } from "lucide-react";
import clsx from "clsx";

export function MetricCard({ label, value, sub, icon: Icon, tone = "red", action }: { label: string; value: string | number; sub?: string; icon?: LucideIcon; tone?: "red" | "green" | "gold" | "blue" | "purple"; action?: React.ReactNode }) {
  const tones = {
    red: "from-red-500/15 text-madness-red",
    green: "from-green-500/15 text-madness-green",
    gold: "from-yellow-500/15 text-madness-gold",
    blue: "from-sky-500/15 text-madness-blue",
    purple: "from-purple-500/15 text-madness-purple",
  };
  return (
    <div className={clsx("glass-card relative overflow-hidden p-5", `bg-gradient-to-br ${tones[tone]} to-transparent`)}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="metric-label">{label}</p>
          <div className="mt-3 text-4xl font-black tracking-tight text-white">{value}</div>
          {sub ? <p className="mt-1 text-sm font-semibold text-madness-green">{sub}</p> : null}
        </div>
        {Icon ? <Icon className={clsx("h-10 w-10 opacity-80", tones[tone].split(" ")[1])} /> : null}
      </div>
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}
