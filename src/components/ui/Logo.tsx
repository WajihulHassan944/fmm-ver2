import Link from "next/link";

export function Logo() {
  return (
    <Link href="/" className="group inline-flex items-center gap-3">
      <div className="relative flex h-14 w-16 items-center justify-center rounded-xl border border-red-500/40 bg-gradient-to-br from-red-950 to-black shadow-glow">
        <span className="absolute -top-2 text-[10px] font-black uppercase tracking-wider text-white">Fantasy</span>
        <span className="text-xl font-black italic tracking-tighter text-white">MM</span>
        <span className="absolute -bottom-2 rounded bg-madness-red px-2 py-0.5 text-[10px] font-black uppercase">Madness</span>
      </div>
    </Link>
  );
}
