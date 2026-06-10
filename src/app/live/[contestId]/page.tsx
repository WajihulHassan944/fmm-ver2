"use client";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { leaderboard as baseLeaderboard } from "@/lib/mock-data";
import { getLiveSocket } from "@/lib/socket";

export default function LiveFightRoomPage({ params }: any) {
  const [board, setBoard] = useState(baseLeaderboard);
  const [feed, setFeed] = useState(["Makhachev secures another takedown and is working from half guard.", "Poirier lands a clean right hand.", "Prediction hit: Makhachev by Decision +50 pts"]);
  useEffect(() => {
    const socket = getLiveSocket();
    socket.emit("contest:join", { contestId: params.contestId });
    socket.on("leaderboard:update", (payload) => payload?.leaderboard && setBoard(payload.leaderboard));
    socket.on("scoring:update", (payload) => setFeed((f) => [`${payload?.event?.type || "Scoring update"} posted`, ...f].slice(0, 8)));
    return () => { socket.off("leaderboard:update"); socket.off("scoring:update"); };
  }, [params.contestId]);
  return (
    <AppShell active="Fights">
      <section className="bg-hero-fade rounded-3xl border border-white/10 p-6"><div className="grid items-center gap-4 lg:grid-cols-[1fr_300px_1fr]"><div><p className="metric-label">Live Fight Room</p><h1 className="text-2xl font-black uppercase">UFC 302: Makhachev vs Poirier</h1><p className="text-white/55">Main Card · Las Vegas, NV · <span className="text-madness-red">● LIVE</span></p></div><div className="rounded-2xl border border-white/10 bg-black/50 p-5 text-center"><p className="metric-label">Round 3 of 5</p><p className="font-mono text-5xl font-black">2:34</p><p className="text-madness-red">LIVE</p></div><div className="grid grid-cols-3 gap-3 text-center"><div><p className="metric-label">Entries</p><b>125,842</b></div><div><p className="metric-label">Players</p><b>98,710</b></div><div><p className="metric-label">Prize Pool</p><b className="text-madness-green">$1,258,420</b></div></div></div></section>
      <div className="mt-6 grid gap-6 xl:grid-cols-[330px_1fr_420px]">
        <aside className="space-y-5"><div className="panel p-5"><h2 className="text-lg font-black uppercase">Live Leaderboard</h2>{board.map((row) => <div key={row.rank} className={`mt-3 flex items-center justify-between rounded-xl px-3 py-2 ${row.rank===4 ? "bg-madness-red" : "bg-white/5"}`}><span>#{row.rank} {row.displayName}</span><b>{row.score}</b></div>)}</div><div className="panel border-madness-red/40 p-6"><p className="metric-label">Your Current Rank</p><p className="mt-2 text-6xl font-black text-madness-red">#4</p><p className="text-madness-green">▲ 3 from #7</p><p className="mt-4 text-3xl font-black">2,987.5</p><p className="text-white/55">Total Points · Top 1.3%</p><p className="mt-4 text-3xl font-black text-madness-green">$3,750</p><p className="text-white/55">Current Payout</p></div></aside>
        <main className="space-y-5"><div className="panel p-5"><h2 className="text-lg font-black uppercase">Live Scoring Updates</h2><div className="mt-4 grid grid-cols-5 gap-3">{[["Total Points","2,987.5"],["Round Points","452.5"],["Prediction","100.0"],["Bonus","75.0"],["Winnings","$3,750"]].map(([a,b])=><div key={a} className="rounded-xl bg-white/5 p-4"><p className="metric-label">{a}</p><p className="text-2xl font-black text-white">{b}</p></div>)}</div><h3 className="mt-6 font-black uppercase">Scoring Feed</h3>{feed.map((item,i)=><div key={i} className="mt-3 grid grid-cols-[70px_1fr_auto] rounded-xl bg-white/5 p-3"><span className="font-mono text-madness-red">{["2:36","2:58","3:21","3:45","4:10"][i] || "live"}</span><span>{item}</span><b className="text-madness-green">+{[5,3,50,2.5,1.5][i] || 1} pts</b></div>)}</div><div className="panel p-5"><h2 className="text-lg font-black uppercase">Round-by-Round Scorecard</h2><div className="mt-4 grid grid-cols-7 gap-2 text-center text-sm"><b></b>{[1,2,3,4,5,"TOT"].map(x=><b key={x}>{x}</b>)}<b>Islam Makhachev</b><span>10-9</span><span>10-8</span><span>—</span><span>—</span><span>—</span><b>20-17</b><b>Dustin Poirier</b><span>9-10</span><span>8-10</span><span>—</span><span>—</span><span>—</span><b>17-20</b></div></div></main>
        <aside className="space-y-5"><div className="panel p-5"><h2 className="text-lg font-black uppercase">Your Picks vs Current Results</h2>{[["Fight Winner","Makhachev","Makhachev","+100"],["Method","Decision","Decision","+50"],["Goes Distance","Yes","Yes","+25"],["Takedowns","Over 2.5","4","+30"]].map((r)=><div key={r[0]} className="mt-3 grid grid-cols-4 gap-2 border-b border-white/10 pb-3 text-sm"><span>{r[0]}</span><b>{r[1]}</b><b>{r[2]}</b><b className="text-madness-green">{r[3]}</b></div>)}</div><div className="panel p-5"><h2 className="text-lg font-black uppercase">Live Chat</h2>{["Makhachev looking unstoppable!", "Poirier needs a finish here", "That takedown was slick 🔥", "Let’s go Islam!"].map((msg)=><p key={msg} className="mt-3 rounded-xl bg-white/5 p-3 text-sm">{msg}</p>)}<input className="mt-4 w-full rounded-xl border border-white/10 bg-black/30 p-3 outline-none" placeholder="Type a message..." /></div></aside>
      </div>
    </AppShell>
  );
}
