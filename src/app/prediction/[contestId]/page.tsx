"use client";
import { useState } from "react";
import Link from "next/link";
import { Lock, ShieldCheck } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { ScoringGlossary } from "@/components/ui/ScoringGlossary";
import { activeContests } from "@/lib/mock-data";

export default function PredictionBuilderPage({ params }: any) {
  const contest = activeContests.find((c) => c._id === params.contestId || c.slug === params.contestId) || activeContests[0];
  const [winner, setWinner] = useState(contest.matchup?.fighterA || "Makhachev");
  const [method, setMethod] = useState("ko_tko");
  const [round, setRound] = useState<string | number>(5);
  return (
    <AppShell active="Fights">
      <div className="mb-5 flex items-center justify-between"><div><h1 className="text-3xl font-black uppercase">Prediction Builder</h1><p className="text-white/60">Make your predictions. Earn points. Climb the leaderboard.</p></div><Link href="/how-to-play" className="btn-secondary py-2">How Scoring Works</Link></div>
      <div className="mb-6 grid grid-cols-5 gap-2">{["Winner", "Method", "Round", "Fight Stats", "Review"].map((s,i)=><div key={s} className={`rounded-xl border p-3 text-center text-xs font-black uppercase ${i===0 ? "border-madness-red bg-madness-red/15" : "border-white/10 bg-white/5"}`}>{i+1}. {s}</div>)}</div>
      <div className="grid gap-6 xl:grid-cols-[1fr_360px_320px]">
        <div className="space-y-5">
          <section className="panel p-6"><h2 className="text-2xl font-black uppercase">Step 1 · Predict the Winner</h2><div className="mt-5 grid gap-4 md:grid-cols-[1fr_auto_1fr]"><button onClick={()=>setWinner(contest.matchup?.fighterA || "Makhachev")} className={`rounded-2xl border p-6 text-left ${winner===contest.matchup?.fighterA ? "border-madness-red bg-madness-red/15" : "border-white/10 bg-white/5"}`}><p className="text-2xl font-black uppercase">{contest.matchup?.fighterA || "Makhachev"}</p><p className="text-madness-red">68% Fan Pick</p></button><div className="self-center text-4xl font-black text-white/30">VS</div><button onClick={()=>setWinner(contest.matchup?.fighterB || "Poirier")} className={`rounded-2xl border p-6 text-left ${winner===contest.matchup?.fighterB ? "border-madness-blue bg-sky-500/15" : "border-white/10 bg-white/5"}`}><p className="text-2xl font-black uppercase">{contest.matchup?.fighterB || "Poirier"}</p><p className="text-madness-blue">32% Fan Pick</p></button></div><p className="mt-4 rounded-xl bg-yellow-500/10 p-3 text-sm text-yellow-100">💡 Most points come from correct winner and method. Choose wisely.</p></section>
          <section className="panel p-6"><h2 className="text-2xl font-black uppercase">Step 2 · Predict the Method</h2><div className="mt-5 grid gap-4 md:grid-cols-3">{[["ko_tko","KO / TKO","Knockout or technical knockout"],["submission","Submission","Opponent taps or referee stops fight"],["decision","Decision","Fight goes to judges' decision"]].map(([key,title,desc])=><button key={key} onClick={()=>setMethod(key)} className={`rounded-xl border p-5 text-left ${method===key ? "border-madness-red bg-madness-red/15" : "border-white/10 bg-white/5"}`}><p className="font-black uppercase">{title}</p><p className="text-sm text-white/55">{desc}</p></button>)}</div></section>
          <section className="panel p-6"><h2 className="text-2xl font-black uppercase">Step 3 · Predict the Round</h2><div className="mt-5 flex flex-wrap gap-3">{[1,2,3,4,5,"decision"].map((r)=><button key={String(r)} onClick={()=>setRound(r)} className={`rounded-lg border px-7 py-3 font-black uppercase ${round===r ? "border-madness-red bg-madness-red" : "border-white/10 bg-white/5"}`}>{String(r).startsWith("d") ? "Decision" : `R${r}`}</button>)}</div></section>
          <section className="panel p-6"><h2 className="text-2xl font-black uppercase">Step 4 · Fight Stats</h2>{[["HP","Hit Prediction",112],["BP","Bonus Pick",3],["TP","Total Points",2]].map(([abbr,label,val]) => <div key={abbr} className="mt-4 grid grid-cols-[64px_1fr_160px] items-center gap-4 rounded-xl bg-white/5 p-4"><span className="font-black text-madness-red">{abbr}</span><span>{label}</span><div className="flex items-center justify-between rounded-lg bg-black/30 px-3 py-2"><button>−</button><b>{val}</b><button>+</button></div></div>)}</section>
        </div>
        <aside className="panel h-max p-5"><h3 className="text-xl font-black uppercase">Prediction Summary</h3><p className="mt-4 text-xs uppercase text-white/45">Locks in</p><p className="font-mono text-4xl font-black text-madness-red">01:24:36</p><div className="mt-5 rounded-xl bg-white/5 p-4"><p className="font-black">{contest.title}</p><p className="text-white/55">{contest.eventName}</p></div><div className="mt-4 grid grid-cols-2 gap-3"><div className="rounded-xl bg-white/5 p-4"><p className="metric-label">Entry Fee</p><p className="text-2xl font-black text-madness-green">${contest.entryFee}</p></div><div className="rounded-xl bg-white/5 p-4"><p className="metric-label">Max Points</p><p className="text-2xl font-black text-madness-gold">1,420 🏆</p></div></div><div className="mt-5 space-y-2 text-sm"><p>Winner: <b>{winner}</b></p><p>Method: <b>{method}</b></p><p>Round: <b>{round}</b></p></div><Link href={`/live/${contest._id}`} className="btn-primary mt-5 w-full"><Lock className="h-4 w-4" /> Submit Prediction</Link><div className="mt-4 rounded-xl bg-green-500/10 p-4 text-sm text-green-100"><ShieldCheck className="mb-2 h-5 w-5" /> Predictions lock when the fight starts.</div></aside>
        <ScoringGlossary />
      </div>
    </AppShell>
  );
}
