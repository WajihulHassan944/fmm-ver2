import Link from "next/link";
import { Gift, Trophy, WalletCards } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { MetricCard } from "@/components/ui/MetricCard";
import { walletSummary } from "@/lib/mock-data";

export default function WalletPage() {
  return (
    <AppShell active="Rewards">
      <div className="mb-5 flex items-center justify-between"><div><h1 className="text-4xl font-black uppercase">Wallet & Rewards</h1><p className="text-white/60">Manage tokens, rewards, and payouts in one transparent ledger.</p></div><div className="hidden gap-3 md:flex"><button className="btn-secondary py-2">Rewards FAQ</button><button className="btn-secondary py-2">How Payouts Work</button></div></div>
      <div className="grid gap-4 lg:grid-cols-4">
        <MetricCard label="Token Balance" value={walletSummary.tokenBalance.toLocaleString()} sub="($152.50 USD)" icon={WalletCards} tone="gold" action={<button className="btn-primary py-2">Buy Tokens</button>} />
        <MetricCard label="Withdrawable Rewards" value={walletSummary.withdrawableBalance.toLocaleString()} sub="($24.50 USD)" icon={Trophy} tone="green" action={<button className="btn-secondary py-2">Request Payout</button>} />
        <MetricCard label="Promotional Credits" value={walletSummary.promoCreditBalance.toLocaleString()} sub="($8.50 USD)" icon={Gift} tone="purple" />
        <MetricCard label="Lifetime Winnings" value={walletSummary.lifetimeWinnings.toLocaleString()} sub="($127.80 USD)" icon={Trophy} tone="blue" />
      </div>
      <div className="mt-6 grid gap-6 xl:grid-cols-[1.2fr_.8fr_360px]">
        <div className="panel p-5"><h2 className="section-title">Transaction Ledger</h2><div className="mt-4 flex gap-2">{["All","Tokens","Rewards","Promotions","Payouts"].map((x,i)=><button key={x} className={`rounded-lg px-4 py-2 text-sm font-bold ${i===0 ? "bg-madness-red" : "bg-white/5"}`}>{x}</button>)}</div><div className="mt-5">{walletSummary.transactions.map((tx, i)=><div key={i} className="grid grid-cols-[160px_1fr_160px_160px] items-center border-b border-white/10 py-4 text-sm"><b>{tx.type}</b><span>{tx.description}</span><span className={String(tx.amount).startsWith("-") ? "text-madness-red" : "text-madness-green"}>{tx.amount}</span><span className="text-madness-green">{tx.status}</span></div>)}</div></div>
        <div className="space-y-6"><div className="panel p-5"><h2 className="section-title">Buy Tokens</h2><div className="mt-4 grid grid-cols-2 gap-3">{[[1000,10],[2500,20],[5000,40],[10000,75],[25000,150]].map(([tokens, price]) => <button key={tokens} className={`rounded-xl border p-4 text-left ${tokens===5000 ? "border-madness-red bg-madness-red/10" : "border-white/10 bg-white/5"}`}><p className="text-2xl font-black">{tokens.toLocaleString()}</p><p className="text-sm text-white/50">Tokens</p><p className="mt-2 font-black">${price}</p></button>)}</div></div><div className="panel p-5"><h2 className="section-title">Payout Methods</h2>{["Bank Transfer ****4567", "PayPal fighterfan@gmail.com", "Venmo @fighterfan"].map((m)=><div key={m} className="mt-3 rounded-xl bg-white/5 p-4"><b>{m}</b><p className="text-sm text-madness-green">✓ Verified</p></div>)}</div></div>
        <aside className="space-y-6"><div className="panel p-5"><h2 className="section-title">How Tokens & Rewards Work</h2><p className="mt-3 text-white/60">Tokens enter contests. Withdrawable rewards are real earnings. Promotional credits are bonus credits for promos and free entries.</p>{["Tokens", "Withdrawable Rewards", "Promotional Credits"].map((x)=><div key={x} className="mt-4 rounded-xl bg-white/5 p-4"><b className="text-madness-gold">{x}</b><p className="text-sm text-white/55">Tracked separately for transparency.</p></div>)}<Link href="/faq" className="mt-4 inline-block text-madness-red">Learn More About Payouts →</Link></div><div className="panel p-5"><h2 className="section-title">Referral Rewards</h2><p className="mt-3 text-3xl font-black">FIGHTERFAN</p><p className="text-white/55">Share your link and earn when friends join contests.</p></div></aside>
      </div>
    </AppShell>
  );
}
