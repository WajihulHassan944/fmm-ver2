import { AppShell } from "@/components/layout/AppShell";
import { ContestCard } from "@/components/ui/ContestCard";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { activeContests } from "@/lib/mock-data";

export default function ContestsPage() {
  return (
    <AppShell active="Contests">
      <SectionHeader title="All Fight Contests" />
      <div className="mb-6 flex flex-wrap gap-2">{["All", "MMA", "Boxing", "Kickboxing", "Bare Knuckle"].map((tab, i) => <button key={tab} className={`rounded-lg px-4 py-2 text-sm font-bold ${i === 0 ? "bg-madness-red" : "bg-white/5"}`}>{tab}</button>)}</div>
      <div className="grid gap-5 lg:grid-cols-2">{activeContests.map((contest) => <ContestCard key={contest._id} contest={contest} />)}</div>
    </AppShell>
  );
}
