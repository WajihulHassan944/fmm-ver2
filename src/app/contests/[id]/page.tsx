import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { ScoringGlossary } from "@/components/ui/ScoringGlossary";
import { SportBadge } from "@/components/ui/SportBadge";
import { activeContests } from "@/lib/mock-data";
import { money, number, shortDate, timeLeft } from "@/lib/format";

export default function ContestDetailPage({ params }: any) {
  const contest = activeContests.find((c) => c._id === params.id || c.slug === params.id) || activeContests[0];
  return (
    <AppShell active="Contests">
      <Link href="/contests" className="text-sm text-white/60">← Back to Contests</Link>
      <section className="bg-hero-fade mt-4 rounded-3xl border border-white/10 p-8 shadow-glow">
        <div className="max-w-3xl">
          <div className="flex gap-2"><SportBadge sport={contest.sport} /><span className="rounded bg-white/10 px-2 py-1 text-[11px] font-black uppercase">Main Event</span></div>
          <h1 className="mt-5 text-5xl font-black uppercase">{contest.title}</h1>
          <p className="mt-2 text-white/65">{contest.eventName}</p>
          <div className="mt-8 grid max-w-4xl grid-cols-2 gap-4 md:grid-cols-4">
            <div><p className="metric-label">Locks In</p><p className="text-2xl font-black">{timeLeft(contest.lockAt)}</p></div>
            <div><p className="metric-label">Players</p><p className="text-2xl font-black">{number(contest.entries)}</p></div>
            <div><p className="metric-label">Prize Pool</p><p className="text-2xl font-black text-madness-green">{money(contest.prizePool)}</p></div>
            <div><p className="metric-label">Entry Fee</p><p className="text-2xl font-black text-madness-green">{contest.entryFee} Tokens</p></div>
          </div>
          <div className="mt-8 flex gap-4"><Link href={`/prediction/${contest._id}`} className="btn-primary">Join Contest</Link><Link href={`/prediction/${contest._id}?demo=1`} className="btn-secondary">Try Demo</Link></div>
        </div>
      </section>
      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_420px]">
        <div className="space-y-6">
          <div className="panel p-6"><h2 className="text-xl font-black uppercase">Contest Overview</h2><p className="mt-3 text-white/65">Pick the winner and score points based on how the fight plays out. Predict the method, round, and stats for the most points. Climb the leaderboard and win big.</p><div className="mt-6 grid gap-4 md:grid-cols-4">{["Predict", "Score Points", "Climb Ranks", "Win Big"].map((x) => <div key={x} className="glass-card p-4"><p className="font-black text-madness-red">{x}</p><p className="text-sm text-white/55">Transparent rules and live updates.</p></div>)}</div></div>
          <div className="grid gap-6 md:grid-cols-2"><div className="panel p-6"><h3 className="text-lg font-black uppercase">Scoring Preview</h3>{[["Correct Winner",100],["Correct Method",75],["Correct Round",50],["Exact Score",25],["Perfect Fight",250]].map(([k,v]) => <div key={k} className="flex justify-between border-b border-white/10 py-3"><span>{k}</span><span className="font-black text-madness-green">{v}</span></div>)}</div><div className="panel p-6"><h3 className="text-lg font-black uppercase">Prize Distribution</h3><div className="mt-4 flex h-44 items-center justify-center rounded-full border-[22px] border-red-500/80 text-center"><div><p className="text-3xl font-black text-madness-green">{money(contest.prizePool)}</p><p className="text-xs uppercase text-white/50">Total Pool</p></div></div></div></div>
          <div className="panel p-6"><h3 className="text-lg font-black uppercase">Recent Entrants</h3><div className="mt-5 flex flex-wrap gap-4">{["KOtally", "StrikeKing", "MMAGuru", "TopNotch402", "FightNightPro", "CageSide"].map((name) => <div key={name} className="flex items-center gap-2 rounded-full bg-white/5 px-3 py-2"><span className="h-8 w-8 rounded-full bg-gradient-to-br from-red-500 to-black" />{name}</div>)}</div></div>
        </div>
        <div className="space-y-6"><ScoringGlossary /><div className="panel p-6"><h3 className="font-black uppercase">Token Requirements</h3><div className="mt-4 flex justify-between"><span>Entry Fee</span><b>{contest.entryFee} Tokens</b></div><div className="mt-2 flex justify-between"><span>Your Balance</span><b className="text-madness-green">15,250 Tokens</b></div><Link href={`/prediction/${contest._id}`} className="btn-primary mt-5 w-full">Join Contest</Link></div><div className="panel p-6"><h3 className="font-black uppercase">Secure & Fair Play</h3><p className="mt-2 text-white/60">Server-side scoring, immutable locked predictions, anti-cheat monitoring, and wallet ledger audit trail.</p></div></div>
      </div>
    </AppShell>
  );
}
