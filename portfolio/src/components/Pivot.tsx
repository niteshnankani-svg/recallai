import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { pivot } from "../data/content";
import "./styles/Sections.css";

gsap.registerPlugin(ScrollTrigger);

// Section 3 — "The Pivot". A single-line left→right mask/wipe reveal (clip-path),
// deliberately not a fade — the line "wipes" in like a decision being made.
const Pivot = () => {
  const lineRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    const el = lineRef.current;
    if (!el) return;
    const anim = gsap.fromTo(
      el,
      { clipPath: "inset(0 100% 0 0)", y: 12 },
      {
        clipPath: "inset(0 0% 0 0)",
        y: 0,
        ease: "power3.out",
        duration: 1.1,
        scrollTrigger: {
          trigger: el,
          start: window.innerWidth <= 1024 ? "top 80%" : "top 68%",
          toggleActions: "play none none reverse",
        },
      }
    );
    return () => {
      anim.scrollTrigger?.kill();
      anim.kill();
    };
  }, []);

  return (
    <section className="story-section pivot-section" id="pivot">
      <div className="story-container">
        <span className="section-kicker">{pivot.kicker}</span>
        <h2 className="pivot-line font-head" ref={lineRef}>
          {pivot.line}
        </h2>
      </div>
    </section>
  );
};

export default Pivot;
