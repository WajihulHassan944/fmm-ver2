import React, { useEffect, useMemo, useRef, useState } from "react";

const profiles = {
  boxing: ["breathe", "bounce", "shoulders", "guard", "slip", "jab", "cross", "hook"],
  mma: ["breathe", "bounce", "guard", "feint", "jab", "cross", "lowKick", "bodyKick", "knee"],
  kickboxing: ["breathe", "bounce", "guard", "jab", "cross", "lowKick", "bodyKick", "knee", "check"],
  bareknuckle: ["breathe", "bounce", "shoulders", "guard", "slip", "jab", "cross", "hook"],
};

const duration = {
  breathe: 1900, bounce: 1100, shoulders: 850, guard: 950, slip: 650, feint: 700,
  jab: 520, cross: 620, hook: 680, lowKick: 900, bodyKick: 980, knee: 820, check: 720,
};

const normalizeSport = (sport = "mma") => {
  const s = String(sport).toLowerCase();
  if (s.includes("bare") || s.includes("bkfc")) return "bareknuckle";
  if (s.includes("kick") || s.includes("muay")) return "kickboxing";
  if (s.includes("box")) return "boxing";
  return "mma";
};

const nextMove = (sport, previous) => {
  const pool = profiles[sport] || profiles.mma;
  // Keep the experience mostly alive/warming up, with techniques as surprise beats.
  const idle = pool.filter((m) => ["breathe", "bounce", "shoulders", "guard", "slip", "feint"].includes(m));
  const attacks = pool.filter((m) => !idle.includes(m));
  const source = Math.random() < 0.76 ? idle : attacks;
  const choices = source.filter((m) => m !== previous);
  return choices[Math.floor(Math.random() * choices.length)] || "breathe";
};

export default function FighterMotion({
  src,
  alt = "Fighter",
  sport = "mma",
  side = "left",
  className = "",
  enabled = true,
  demoControls = false,
}) {
  const rootRef = useRef(null);
  const timerRef = useRef(null);
  const [visible, setVisible] = useState(true);
  const [pageVisible, setPageVisible] = useState(true);
  const [move, setMove] = useState("breathe");
  const normalizedSport = useMemo(() => normalizeSport(sport), [sport]);

  useEffect(() => {
    const node = rootRef.current;
    if (!node || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), { rootMargin: "120px" });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const onVisibility = () => setPageVisible(!document.hidden);
    onVisibility();
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  useEffect(() => {
    clearTimeout(timerRef.current);
    if (!enabled || !visible || !pageVisible) return undefined;
    const schedule = () => {
      setMove((previous) => {
        const selected = nextMove(normalizedSport, previous);
        timerRef.current = setTimeout(schedule, (duration[selected] || 900) + 350 + Math.random() * 1250);
        return selected;
      });
    };
    timerRef.current = setTimeout(schedule, side === "right" ? 720 : 260);
    return () => clearTimeout(timerRef.current);
  }, [enabled, normalizedSport, pageVisible, side, visible]);

  const active = enabled && visible && pageVisible;

  return (
    <div
      ref={rootRef}
      className={`fmm-fighter-motion is-${side} is-${normalizedSport} ${active ? `move-${move}` : "is-paused"} ${className}`}
      data-motion={move}
      data-sport={normalizedSport}
    >
      <div className="fmm-fighter-motion-stage">
        <img src={src} alt={alt} draggable="false" />
      </div>
      {demoControls ? (
        <div className="fmm-motion-demo-label" aria-live="polite">
          <strong>{alt}</strong><span>{move.replace(/([A-Z])/g, " $1")}</span>
        </div>
      ) : null}
      <style jsx>{`
        .fmm-fighter-motion{position:relative;min-width:0;isolation:isolate}
        .fmm-fighter-motion-stage{height:100%;width:100%;transform-origin:50% 82%;will-change:transform}
        .fmm-fighter-motion img{display:block;width:100%;height:100%;object-fit:contain;object-position:center bottom;user-select:none;pointer-events:none;transform-origin:50% 76%;will-change:transform,filter}
        .is-right .fmm-fighter-motion-stage{animation-delay:-.37s}
        .move-breathe .fmm-fighter-motion-stage{animation:fmmBreathe 1.9s ease-in-out infinite}
        .move-bounce .fmm-fighter-motion-stage{animation:fmmBounce 1.1s ease-in-out infinite}
        .move-shoulders .fmm-fighter-motion-stage{animation:fmmShoulders .85s ease-in-out 1}
        .move-guard .fmm-fighter-motion-stage{animation:fmmGuard .95s ease-in-out 1}
        .move-slip .fmm-fighter-motion-stage,.move-feint .fmm-fighter-motion-stage{animation:fmmSlip .68s ease-in-out 1}
        .move-jab .fmm-fighter-motion-stage{animation:fmmJab .52s cubic-bezier(.2,.85,.25,1) 1}
        .move-cross .fmm-fighter-motion-stage{animation:fmmCross .62s cubic-bezier(.2,.85,.25,1) 1}
        .move-hook .fmm-fighter-motion-stage{animation:fmmHook .68s ease-in-out 1}
        .move-lowKick .fmm-fighter-motion-stage,.move-bodyKick .fmm-fighter-motion-stage{animation:fmmKick .95s cubic-bezier(.2,.8,.25,1) 1}
        .move-knee .fmm-fighter-motion-stage{animation:fmmKnee .82s ease-in-out 1}
        .move-check .fmm-fighter-motion-stage{animation:fmmCheck .72s ease-in-out 1}
        .is-right.move-jab .fmm-fighter-motion-stage,.is-right.move-cross .fmm-fighter-motion-stage{animation-direction:reverse}
        .fmm-motion-demo-label{position:absolute;left:8px;right:8px;bottom:8px;display:flex;justify-content:space-between;gap:8px;padding:7px 9px;border-radius:8px;background:rgba(0,0,0,.72);color:#fff;font-size:12px;text-transform:uppercase}
        .fmm-motion-demo-label span{color:#f2b544}
        @keyframes fmmBreathe{0%,100%{transform:translateY(0) scale(1)}50%{transform:translateY(-2px) scale(1.006,1.011)}}
        @keyframes fmmBounce{0%,100%{transform:translateY(0)}45%{transform:translateY(-5px)}70%{transform:translateY(-1px)}}
        @keyframes fmmShoulders{0%,100%{transform:rotate(0)}25%{transform:rotate(-.65deg) translateX(-1px)}65%{transform:rotate(.7deg) translateX(1px)}}
        @keyframes fmmGuard{0%,100%{transform:translate(0,0) scale(1)}40%{transform:translateY(-3px) scale(1.008)}65%{transform:translateY(-1px) scale(1.003)}}
        @keyframes fmmSlip{0%,100%{transform:translateX(0) rotate(0)}45%{transform:translateX(-7px) rotate(-1.2deg)}70%{transform:translateX(3px) rotate(.45deg)}}
        @keyframes fmmJab{0%,100%{transform:translateX(0) rotate(0)}42%{transform:translateX(8px) rotate(.6deg) scale(1.008)}58%{transform:translateX(11px) rotate(.8deg) scale(1.012)}}
        @keyframes fmmCross{0%,100%{transform:translateX(0) rotate(0)}35%{transform:translateX(5px) rotate(.7deg)}55%{transform:translateX(13px) rotate(1.25deg) scale(1.014)}}
        @keyframes fmmHook{0%,100%{transform:rotate(0) translateX(0)}48%{transform:rotate(-1.6deg) translateX(6px) scale(1.01)}}
        @keyframes fmmKick{0%,100%{transform:translate(0,0) rotate(0)}30%{transform:translate(-3px,-2px) rotate(-.7deg)}58%{transform:translate(8px,-5px) rotate(1.8deg) scale(1.012)}}
        @keyframes fmmKnee{0%,100%{transform:translateY(0) scale(1)}50%{transform:translateY(-8px) scale(1.012) rotate(.6deg)}}
        @keyframes fmmCheck{0%,100%{transform:translate(0,0) rotate(0)}50%{transform:translate(-4px,-6px) rotate(-1deg)}}
        @media (prefers-reduced-motion:reduce){.fmm-fighter-motion-stage{animation:none!important;transform:none!important}}
      `}</style>
    </div>
  );
}
