import Link from "next/link";

export function SectionHeader({ title, href, action = "View All" }: { title: string; href?: string; action?: string }) {
  return (
    <div className="mb-4 flex items-center justify-between gap-4">
      <h2 className="section-title">{title}</h2>
      {href ? <Link href={href} className="text-sm font-bold uppercase tracking-wide text-madness-red hover:text-white">{action} →</Link> : null}
    </div>
  );
}
