import { SplitText } from "gsap/SplitText";
import gsap from "gsap";
import { smoother } from "../Navbar";

// Adapted from the reference initialFX.ts: once loading finishes, un-pause the
// smoother, fade in the body/nav, and run the hero char reveal.
export function initialFX() {
  document.body.style.overflowY = "auto";
  smoother?.paused(false);
  document.getElementsByTagName("main")[0]?.classList.add("main-active");

  gsap.to("body", { backgroundColor: "#070b14", duration: 0.6, delay: 0.4 });

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
      delay: 0.2,
    }
  );

  gsap.fromTo(
    [".header", ".social-rail", ".nav-fade", ".scroll-hint"],
    { opacity: 0 },
    { opacity: 1, duration: 1.2, ease: "power1.inOut", delay: 0.3 }
  );
}
