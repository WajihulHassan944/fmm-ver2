import Link from "next/link";
import { Activity, DollarSign, Shield, WalletCards } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { ContestCard } from "@/components/ui/ContestCard";
import { MetricCard } from "@/components/ui/MetricCard";
import { ScoringGlossary } from "@/components/ui/ScoringGlossary";
import { activeContests } from "@/lib/mock-data";

export default function DashboardPage() {
  return (
    <AppShell active="Dashboard">
      <div className="grid gap-4 lg:grid-cols-4">
        <MetricCard label="Token Balance" value="15,250" sub="($152.50 USD)" icon={WalletCards} tone="gold" action={<Link href="/wallet" className="btn-primary py-2">Buy Tokens</Link>} />
        <MetricCard label="Live Contests Entered" value="5" sub="12 picks active" icon={Activity} tone="red" />
        <MetricCard label="Winnings This Week" value="2,450" sub="($24.50 USD)" icon={DollarSign} tone="green" />
        <MetricCard label="Your Rank" value="#47" sub="Top 1.3% of players" icon={Shield} tone="red" />
      </div>
      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_420px]">
        <div>
          <div className="panel p-5">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3"><div className="flex gap-6 text-sm font-black uppercase"><span className="text-madness-red">Available Fights</span><span className="text-white/45">My Active Entries</span><span className="text-white/45">Completed</span><span className="text-white/45">Pending</span></div><button className="btn-secondary py-2">Sort by Lock Time</button></div>
            <div className="grid gap-4">{activeContests.map((contest) => <ContestCard key={contest._id} contest={contest} />)}</div>
          </div>
          <div className="panel mt-6 p-5"><div className="flex justify-between"><h2 className="section-title">Recent Results</h2><Link href="/results/demo-ufc-302" className="text-sm font-bold text-madness-red">View All Results →</Link></div>{["UFC Fight Night: Santos vs Imavov", "Haney vs Garcia", "ONE Fight Night 22", "BKFC 62: Albuquerque"].map((title, i) => <div key={title} className="mt-4 grid grid-cols-[1fr_auto_auto_auto] items-center gap-4 rounded-xl bg-white/5 p-4"><span className="font-bold">{title}<br /><span className="text-xs text-white/45">Completed · Score breakdown ready</span></span><span className="font-black">{[1420,1050,1260,820][i]} pts</span><span className="font-black">#{[128,275,164,342][i]}</span><span className="font-black text-madness-green">+{[250,150,200,100][i]} 🪙</span></div>)}</div>
        </div>
        <div className="space-y-6"><ScoringGlossary /><div className="panel p-5"><h3 className="text-lg font-black uppercase">Live Activity</h3>{["MMA_Junkie23 joined UFC 302", "StrikeKing joined Davis vs Roach", "TopNotch402 joined Glory 93", "KnockoutKid joined BKFC 63"].map((x, i) => <div key={x} className="mt-4 flex justify-between border-b border-white/10 pb-3"><span>{x}</span><span className="text-white/45">{i+2}m ago</span></div>)}</div></div>
      </div>
    </AppShell>
  );
}
