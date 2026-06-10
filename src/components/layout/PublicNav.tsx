import Link from "next/link";
import { Logo } from "../ui/Logo";
import { HelpCircle, Shield, Star, Trophy, Users, WalletCards } from "lucide-react";

const nav = [
  ["Fights", "/contests", Trophy],
  ["Contests", "/contests", Shield],
  ["Leaderboard", "/dashboard", Star],
  ["Tokens", "/wallet", WalletCards],
  ["How to Play", "/how-to-play", HelpCircle],
  ["Affiliates", "/affiliate", Users],
] as const;

export function PublicNav() {
  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-black/85 backdrop-blur-xl">
      <div className="container-wide flex h-20 items-center justify-between">
        <Logo />
        <nav className="hidden items-center gap-7 lg:flex">
          {nav.map(([label, href, Icon]) => (
            <Link key={label} href={href} className="flex items-center gap-2 text-xs font-black uppercase tracking-wide text-white/75 hover:text-white">
              <Icon className="h-4 w-4" /> {label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          <Link href="/login" className="btn-secondary py-2">Login</Link>
          <Link href="/register" className="btn-primary py-2">Sign Up Free</Link>
        </div>
      </div>
    </header>
  );
}
