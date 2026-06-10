import Link from "next/link";
import { ShieldCheck, Trophy, Users, WalletCards } from "lucide-react";
import { PublicNav } from "@/components/layout/PublicNav";
import { ContestCard } from "@/components/ui/ContestCard";
import { MetricCard } from "@/components/ui/MetricCard";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { activeContests, leaderboard } from "@/lib/mock-data";
import { money, number } from "@/lib/format";

export default function HomePage() {
  return (
    <div className="page-shell">
      <PublicNav />
      <section className="bg-hero-fade border-b border-white/10">
        <div className="container-wide grid min-h-[620px] items-center gap-10 py-20 lg:grid-cols-[1.05fr_.95fr]">
          <div>
            <p className="mb-4 text-sm font-black uppercase tracking-[.25em] text-madness-red">Fantasy Combat Sports · V2</p>
            <h1 className="max-w-3xl text-5xl font-black uppercase leading-[.95] tracking-tight md:text-7xl">Predict Combat Sports. <span className="text-madness-red">Score Every Round.</span></h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-white/75">Join MMA, boxing, kickboxing, and bare-knuckle prediction contests. Pick winners, methods, rounds, and key stats. Climb live leaderboards and win fantasy rewards.</p>
            <div className="mt-8 flex flex-wrap gap-4"><Link href="/prediction/demo-ufc-302" className="btn-primary">Try Demo Fight</Link><Link href="/contests" className="btn-secondary">Join Free Contest</Link></div>
            <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[["100% Free", "To play"], ["Real Prizes", "Every week"], ["Fast Payouts", "Wallet ledger"], ["Secure & Fair", "Auditable scoring"]].map(([a,b]) => <div key={a} className="glass-card p-3"><p className="font-black">{a}</p><p className="text-xs uppercase text-white/50">{b}</p></div>)}
            </div>
          </div>
          <div className="glass-card bg-black/35 p-6 shadow-glow">
            <p className="text-sm font-black uppercase text-madness-red">Next Big Fight</p>
            <h2 className="mt-3 text-3xl font-black uppercase">Josh Padley <span className="text-madness-red">vs</span> Shakur Stevenson</h2>
            <div className="mt-6 grid grid-cols-4 gap-3 text-center">
              {[["01","Days"],["08","Hrs"],["34","Min"],["12","Sec"]].map(([n,l]) => <div key={l} className="rounded-xl border border-white/10 bg-white/5 p-4"><p className="text-3xl font-black">{n}</p><p className="text-xs uppercase text-white/45">{l}</p></div>)}
            </div>
          </div>
        </div>
      </section>
      <main className="container-wide py-10">
        <SectionHeader title="Active Contests" href="/contests" />
        <div className="grid gap-4 lg:grid-cols-4">{activeContests.map((contest) => <ContestCard key={contest._id} contest={contest} compact />)}</div>
        <div className="mt-8 grid gap-4 lg:grid-cols-3">
          <div className="panel p-6"><h3 className="text-xl font-black uppercase">How It Works</h3>{["Pick winner, method, round and stats", "Score points based on accuracy", "Climb ranks and win rewards"].map((step, i) => <div key={step} className="mt-5 flex gap-4"><span className="flex h-10 w-10 items-center justify-center rounded-full bg-madness-red font-black">{i+1}</span><p className="pt-2 font-bold text-white/80">{step}</p></div>)}</div>
          <div className="panel p-6"><h3 className="text-xl font-black uppercase">Recent Winners</h3>{[["Tasha",2500],["Kelly",1000],["Wajih ul Hassan",750]].map(([name, amount]) => <div key={name} className="mt-4 flex items-center justify-between border-b border-white/10 pb-3"><span className="font-bold">🏆 {name}</span><span className="font-black text-madness-green">{money(Number(amount))}</span></div>)}</div>
          <div className="panel p-6"><h3 className="text-xl font-black uppercase">Live Leaderboard</h3>{leaderboard.map((row) => <div key={row.rank} className={`mt-3 flex items-center justify-between rounded-lg px-3 py-2 ${row.rank === 4 ? "bg-madness-red" : "bg-white/5"}`}><span>#{row.rank} {row.displayName}</span><span className="font-black">{number(row.score)}</span></div>)}</div>
        </div>
        <div className="mt-8 grid gap-4 lg:grid-cols-4">
          <MetricCard label="Players" value="128,547+" sub="Worldwide community" icon={Users} tone="blue" />
          <MetricCard label="Predictions" value="4.2M+" sub="Submitted" icon={Trophy} tone="red" />
          <MetricCard label="Tokens Awarded" value="$1.7M+" sub="To champions" icon={WalletCards} tone="gold" />
          <MetricCard label="Secure & Fair" value="100%" sub="Auditable scoring" icon={ShieldCheck} tone="green" />
        </div>
      </main>
    </div>
  );
}
