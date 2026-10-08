import { useEffect, useRef, useState } from "react";
import { useInView, animate } from "framer-motion";
import "./styles/Stats.css";

// A band of count-up stats — concrete numbers recruiters scan for. Counts up when
// scrolled into view (framer-motion).
const STATS = [
  { to: 9, suffix: "", label: "systems built end-to-end" },
  { to: 6, suffix: "", label: "live in production" },
  { to: 7, suffix: "", label: "BERT models fine-tuned" },
  { to: 51000, suffix: "", label: "reviews trained on" },
  { to: 12, suffix: "+", label: "yrs running businesses" },
];

const Stat = ({ to, suffix, label }: { to: number; suffix: string; label: string }) => {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!inView) return;
    const controls = animate(0, to, {
      duration: 1.6,
      ease: "easeOut",
      onUpdate: (v) => setVal(v),
    });
    return () => controls.stop();
  }, [inView, to]);
  return (
    <div className="stat glass" ref={ref}>
      <div className="stat-num grad-text">
        {Math.round(val).toLocaleString()}
        {suffix}
      </div>
      <div className="stat-label">{label}</div>
    </div>
  );
};

const Stats = () => (
  <section className="stats-section" id="stats">
    <div className="stats-row">
      {STATS.map((s) => (
        <Stat key={s.label} {...s} />
      ))}
    </div>
  </section>
);

export default Stats;
