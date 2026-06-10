import Link from "next/link";
import { Clock, Trophy, Users, WalletCards } from "lucide-react";
import type { Contest } from "@/lib/types";
import { money, number, shortDate, timeLeft } from "@/lib/format";
import { SportBadge } from "./SportBadge";

export function ContestCard({ contest, compact = false }: { contest: Contest; compact?: boolean }) {
  return (
    <div className="panel group overflow-hidden border-red-500/20 p-4 transition hover:border-madness-red/70 hover:shadow-glow">
      <div className="flex items-start justify-between gap-3">
        <SportBadge sport={contest.sport} />
        <span className="rounded bg-white/10 px-2 py-1 text-[10px] font-bold uppercase text-white/70">{contest.type}</span>
      </div>
      <h3 className="mt-4 line-clamp-2 text-lg font-black text-white">{contest.title}</h3>
      <p className="mt-1 text-sm text-white/60">{contest.eventName || "Main Card"}</p>
      <div className="mt-4 grid grid-cols-2 gap-3 text-sm text-white/75">
        <span className="flex items-center gap-2"><Clock className="h-4 w-4 text-madness-red" /> {shortDate(contest.startsAt)}</span>
        <span className="flex items-center gap-2"><Users className="h-4 w-4 text-madness-blue" /> {number(contest.entries)} players</span>
        <span className="flex items-center gap-2"><WalletCards className="h-4 w-4 text-madness-green" /> {contest.entryFee ? `${contest.entryFee} tokens` : "Free"}</span>
        <span className="flex items-center gap-2"><Trophy className="h-4 w-4 text-madness-gold" /> {money(contest.prizePool)}</span>
      </div>
      <div className="mt-5 flex items-center justify-between gap-3">
        <div>
          <p className="text-[10px] font-bold uppercase text-white/45">Locks in</p>
          <p className="font-mono text-lg font-black text-white">{timeLeft(contest.lockAt)}</p>
        </div>
        <div className="flex gap-2">
          {!compact && <Link href={`/contests/${contest._id || contest.slug}`} className="btn-secondary px-4 py-2">Rules</Link>}
          <Link href={`/prediction/${contest._id || contest.slug}`} className="btn-primary px-4 py-2">Make Prediction</Link>
        </div>
      </div>
    </div>
  );
}
