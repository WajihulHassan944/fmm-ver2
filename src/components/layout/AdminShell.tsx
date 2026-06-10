import Link from "next/link";
import { Activity, AlertTriangle, Bell, ClipboardList, Gift, HeartPulse, LayoutDashboard, LockKeyhole, Newspaper, Settings, Shield, Ticket, Users, WalletCards } from "lucide-react";
import { Logo } from "../ui/Logo";

const sections = [
  ["Dashboard", "/admin", LayoutDashboard],
  ["Users", "/admin", Users],
  ["Contests", "/admin/moderation", Ticket],
  ["Fights & Events", "/admin/moderation", ClipboardList],
  ["Tokens & Economy", "/wallet", WalletCards],
  ["Payouts", "/admin/moderation", Gift],
  ["News & Blogs", "/faq", Newspaper],
  ["Support Tickets", "/admin", Bell],
  ["Verifications", "/admin/fraud", Shield],
  ["Fraud Detection", "/admin/fraud", AlertTriangle],
  ["System Health", "/admin", HeartPulse],
  ["Security Center", "/admin/fraud", LockKeyhole],
  ["Settings", "/admin", Settings],
] as const;

export function AdminShell({ children, active = "Dashboard" }: { children: React.ReactNode; active?: string }) {
  return (
    <div className="min-h-screen bg-madness-black text-white">
      <aside className="fixed inset-y-0 left-0 hidden w-64 border-r border-white/10 bg-black/70 p-5 xl:block">
        <Logo />
        <nav className="mt-10 space-y-1">
          {sections.map(([label, href, Icon]) => (
            <Link key={label} href={href} className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold ${active === label ? "bg-madness-red/20 text-madness-red" : "text-white/65 hover:bg-white/5 hover:text-white"}`}>
              <Icon className="h-4 w-4" /> {label}
            </Link>
          ))}
        </nav>
        <div className="absolute bottom-5 left-5 right-5 rounded-xl border border-green-500/25 bg-green-500/10 p-3 text-sm"><span className="inline-flex h-2 w-2 rounded-full bg-madness-green" /> LIVE<br /><span className="text-white/55">May 25, 2025 · 12:45 AM EST</span></div>
      </aside>
      <div className="xl:pl-64">
        <header className="sticky top-0 z-40 border-b border-white/10 bg-black/85 backdrop-blur-xl">
          <div className="flex h-20 items-center justify-between px-6">
            <div><h1 className="text-xl font-black uppercase">Admin Dashboard</h1><p className="text-sm text-white/50">Platform Control Center</p></div>
            <div className="flex items-center gap-4"><input className="hidden rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm outline-none lg:block" placeholder="Search users, contests, tickets..." /><Bell className="h-5 w-5" /><Activity className="h-5 w-5" /><div className="h-10 w-10 rounded-full bg-gradient-to-br from-red-500 to-black" /></div>
          </div>
        </header>
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
