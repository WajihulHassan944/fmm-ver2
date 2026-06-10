import Link from "next/link";
import { Bell, Gift, Home, HelpCircle, ListChecks, Medal, Target, Trophy, Users, WalletCards } from "lucide-react";
import { Logo } from "../ui/Logo";

const items = [
  ["Dashboard", "/dashboard", Home],
  ["Fights", "/contests", Trophy],
  ["Contests", "/contests", Target],
  ["Leagues", "/dashboard", Users],
  ["My Entries", "/results/demo-ufc-302", ListChecks],
  ["Rankings", "/dashboard", Medal],
  ["Rewards", "/wallet", Gift],
  ["Help", "/faq", HelpCircle],
] as const;

export function AppShell({ children, active = "Dashboard" }: { children: React.ReactNode; active?: string }) {
  return (
    <div className="min-h-screen bg-madness-black text-white">
      <header className="sticky top-0 z-50 border-b border-white/10 bg-black/85 backdrop-blur-xl">
        <div className="container-wide flex h-20 items-center justify-between gap-6">
          <Logo />
          <nav className="hidden flex-1 items-center justify-center gap-6 xl:flex">
            {items.map(([label, href, Icon]) => (
              <Link key={label} href={href} className={`flex items-center gap-2 text-sm font-bold ${active === label ? "text-madness-red" : "text-white/70 hover:text-white"}`}>
                <Icon className="h-4 w-4" /> {label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-3">
            <button className="relative rounded-xl border border-white/10 bg-white/5 p-3"><Bell className="h-5 w-5" /><span className="absolute -right-1 -top-1 rounded-full bg-madness-red px-1.5 text-xs font-black">3</span></button>
            <Link href="/wallet" className="hidden items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 sm:flex"><WalletCards className="h-5 w-5 text-madness-gold" /><span className="font-black">15,250</span><span className="text-xs text-white/50">Tokens</span></Link>
            <div className="hidden items-center gap-3 md:flex"><div className="h-10 w-10 rounded-full bg-gradient-to-br from-red-500 to-black" /><div><p className="text-sm font-black">FighterFan</p><p className="text-xs font-bold text-madness-red">Pro Level</p></div></div>
          </div>
        </div>
      </header>
      <main className="container-wide py-6">{children}</main>
    </div>
  );
}
