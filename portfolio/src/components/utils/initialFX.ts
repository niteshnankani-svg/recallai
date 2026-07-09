import { SplitText } from "gsap/SplitText";
import gsap from "gsap";
import { smoother } from "../Navbar";

// Adapted from the reference initialFX.ts: once loading finishes, un-pause the
// smoother, fade in the body/nav, and run the hero char reveal.
export function initialFX() {
  document.body.style.overflowY = "auto";
  smoother?.paused(false);
  document.getElementsByTagName("main")[0]?.classList.add("main-active");

  // Text reveal is timed to land as the particle garment coalesces (~0.9s into
  // the intro), so the sequence reads: burst → form → name → trust pills.
  const landingText = new SplitText(
    [".hero-eyebrow", ".hero-name h1", ".hero-sub"],
    { type: "chars,lines", linesClass: "split-line" }
  );
  gsap.fromTo(
    landingText.chars,
    { opacity: 0, y: 80, filter: "blur(6px)" },
    {
      opacity: 1,
      y: 0,
      filter: "blur(0px)",
      duration: 1.2,
      ease: "power3.inOut",
      stagger: 0.02,
      delay: 0.9,
    }
  );

  gsap.fromTo(
    ".hero-trust li",
    { opacity: 0, y: 12 },
    { opacity: 1, y: 0, duration: 0.6, ease: "power2.out", stagger: 0.06, delay: 1.5 }
  );

  gsap.fromTo(
    [".header", ".social-rail", ".nav-fade", ".scroll-hint"],
    { opacity: 0 },
    { opacity: 1, duration: 1.2, ease: "power1.inOut", delay: 0.5 }
  );
}
