import { scoringGlossary } from "@/lib/mock-data";

export function ScoringGlossary() {
  return (
    <div className="panel p-5">
      <h3 className="text-lg font-black uppercase">How Scoring Works</h3>
      <p className="mt-1 text-sm text-white/60">Transparent point values for every prediction type.</p>
      <div className="mt-5 space-y-4">
        {scoringGlossary.map(([abbr, title, desc, pts]) => (
          <div key={abbr} className="flex items-start justify-between gap-4 border-b border-white/10 pb-3 last:border-0">
            <div className="flex gap-3">
              <span className="w-8 text-lg font-black text-madness-red">{abbr}</span>
              <div>
                <p className="font-bold">{title}</p>
                <p className="text-sm text-white/55">{desc}</p>
              </div>
            </div>
            <span className="whitespace-nowrap text-sm font-bold text-white/75">{pts}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
