import gsap from "gsap";
import { smoother } from "../Navbar";

// Richer scroll motion: parallax depth via ScrollSmoother effects. Kickers drift
// up a touch faster, big headings lag a touch slower, and the stat tiles float
// with a staggered lag — so the page has depth and life as you scroll.
// Desktop only (mobile stays light); skipped on ?flat and reduced-motion.
export function scrollMotion() {
  if (typeof window === "undefined") return;
  if (new URLSearchParams(window.location.search).has("flat")) return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  if (!smoother) return;

  // Gentler parallax on small screens so nothing overlaps on the narrow layout.
  const mobile = window.innerWidth < 768;
  const kicker = mobile ? 1.1 : 1.18;
  const heading = mobile ? 0.97 : 0.94;
  const statLag = (i: number) => (mobile ? 0.04 + i * 0.03 : 0.08 + i * 0.05);

  // parallax drift (speed > 1 = faster than scroll, < 1 = slower/lagging).
  // The Work section's kicker + heading live in a GSAP-pinned column, so they
  // must be excluded here — a parallax transform would fight the pin.
  const notInWork = (el: Element) => !el.closest(".work-section");
  const kickers = gsap.utils.toArray<Element>(".section-kicker").filter(notInWork);
  smoother.effects(kickers, { speed: kicker });
  smoother.effects(".skills-heading, .xp-heading", { speed: heading });
  // stat tiles float with a staggered trailing lag
  smoother.effects(".stat", { lag: statLag });
  // social rail drifts gently (desktop only — it's hidden/compact on mobile)
  if (!mobile) smoother.effects(".social-rail", { speed: 1.08 });
}
