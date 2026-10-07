import React, { useMemo, useState } from "react";
import Head from "next/head";
import FighterMotion from "@/Components/FighterMotion/FighterMotion";

const SAMPLE_A = "/images/fmm-experience/fighter-action-blue.webp";
const SAMPLE_B = "/images/fmm-experience/fighter-action-red.webp";

export default function FighterMotionPrototype() {
  const [sport, setSport] = useState("mma");
  const [enabled, setEnabled] = useState(true);
  const label = useMemo(() => sport === "bareknuckle" ? "Bare Knuckle" : sport === "kickboxing" ? "Kickboxing / Muay Thai" : sport.toUpperCase(), [sport]);

  return (
    <>
      <Head><title>Fighter Motion Prototype | FANTASY MMADNESS</title></Head>
      <main className="prototype">
        <section className="shell">
          <p className="eyebrow">FANTASY MMADNESS LAB</p>
          <h1>FIGHTER MOTION ENGINE</h1>
          <p className="sub">Private visual prototype. This route does not change the live fight cards.</p>

          <div className="controls">
            {["boxing","mma","kickboxing","bareknuckle"].map((item) => (
              <button key={item} className={sport === item ? "active" : ""} onClick={() => setSport(item)}>{item}</button>
            ))}
            <button className={enabled ? "stop" : "active"} onClick={() => setEnabled((v) => !v)}>{enabled ? "Pause" : "Play"}</button>
          </div>

          <div className="arena">
            <div className="lights" />
            <div className="fighter left">
              <FighterMotion src={SAMPLE_A} alt="Fighter A" sport={sport} side="left" enabled={enabled} demoControls />
            </div>
            <div className="vs"><span>{label}</span><strong>VS</strong><small>WARM-UP MOTION PROTOTYPE</small></div>
            <div className="fighter right">
              <FighterMotion src={SAMPLE_B} alt="Fighter B" sport={sport} side="right" enabled={enabled} demoControls />
            </div>
          </div>

          <div className="note">
            <strong>Prototype stage:</strong> this proves automatic sport-based sequencing, independent timing, visibility pausing and the visual rhythm. Full articulated arms/legs require segmented or rigged fighter assets; this prototype intentionally does not pretend a flat photo can bend at joints.
          </div>
        </section>
      </main>
      <style jsx>{`
        .prototype{min-height:100vh;background:#05070b;color:#fff;padding:28px 14px 60px;font-family:Arial,sans-serif}
        .shell{max-width:980px;margin:0 auto}
        .eyebrow{color:#f2b544;font-weight:900;letter-spacing:.16em;margin:0 0 6px}
        h1{font-size:clamp(32px,7vw,70px);line-height:.95;margin:0;font-weight:1000;letter-spacing:-.04em}
        .sub{color:#aeb6c5;margin:12px 0 18px}
        .controls{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:16px}
        button{border:1px solid #39404d;background:#121720;color:#fff;padding:10px 14px;border-radius:9px;text-transform:uppercase;font-weight:900;cursor:pointer}
        button.active{background:#e4312b;border-color:#ff5a54}button.stop{border-color:#f2b544}
        .arena{position:relative;overflow:hidden;min-height:560px;border:1px solid #252b35;border-radius:18px;background:radial-gradient(circle at 50% 28%,#222a3a 0,#0b0e14 42%,#030405 78%);display:grid;grid-template-columns:1fr .34fr 1fr;align-items:end}
        .lights{position:absolute;inset:0;background:linear-gradient(115deg,rgba(30,102,255,.16),transparent 34%),linear-gradient(245deg,rgba(255,45,45,.16),transparent 34%);pointer-events:none}
        .fighter{height:530px;position:relative;z-index:2;min-width:0}.fighter :global(.fmm-fighter-motion){height:100%}
        .left{filter:drop-shadow(0 0 28px rgba(46,112,255,.25))}.right{filter:drop-shadow(0 0 28px rgba(255,55,55,.25))}
        .vs{align-self:center;text-align:center;z-index:3}.vs span,.vs small{display:block;color:#aeb6c5;font-size:11px;font-weight:900;letter-spacing:.08em}.vs strong{display:block;font-size:52px;font-style:italic;color:#f2b544;text-shadow:0 0 22px rgba(242,181,68,.25)}
        .note{margin-top:14px;border-left:3px solid #f2b544;background:#10141b;padding:13px 15px;color:#c8ced8;line-height:1.45}.note strong{color:#fff}
        @media(max-width:640px){.prototype{padding:18px 8px 40px}.arena{min-height:430px;grid-template-columns:1fr 64px 1fr}.fighter{height:400px}.vs strong{font-size:34px}.vs span,.vs small{font-size:8px}.controls button{flex:1 1 42%;min-height:44px}}
      `}</style>
    </>
  );
}
