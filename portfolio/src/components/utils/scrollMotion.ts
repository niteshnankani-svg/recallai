import { smoother } from "../Navbar";

// Richer scroll motion: parallax depth via ScrollSmoother effects. Kickers drift
// up a touch faster, big headings lag a touch slower, and the stat tiles float
// with a staggered lag — so the page has depth and life as you scroll.
// Desktop only (mobile stays light); skipped on ?flat and reduced-motion.
export function scrollMotion() {
  if (typeof window === "undefined") return;
  if (new URLSearchParams(window.location.search).has("flat")) return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  if (window.innerWidth < 768 || !smoother) return;

  // parallax drift (speed > 1 = faster than scroll, < 1 = slower/lagging)
  smoother.effects(".section-kicker", { speed: 1.18 });
  smoother.effects(".work-heading, .skills-heading, .xp-heading", { speed: 0.94 });
  // stat tiles float with a staggered trailing lag
  smoother.effects(".stat", { lag: (i: number) => 0.08 + i * 0.05 });
  // social rail drifts gently
  smoother.effects(".social-rail", { speed: 1.08 });
}
