import { lazy, Suspense } from "react";
import { hero } from "../data/content";
import "./styles/Hero.css";

// Section 1 — the 3D character scene sits behind the copy and scrolls away with
// the hero. Lazy-loaded so the heavy three.js bundle doesn't block first paint.
const Scene3D = lazy(() => import("./Scene3D"));

const Hero = () => {
  return (
    <section className="hero-section" id="hero">
      <div className="hero-canvas">
        <Suspense fallback={null}>
          <Scene3D />
        </Suspense>
      </div>
      <div className="hero-container">
        <p className="hero-eyebrow">{hero.eyebrow}</p>
        <div className="hero-name">
          <h1>
            {hero.name.first}
            <br />
            <span>{hero.name.last}</span>
          </h1>
        </div>
        <p className="hero-sub">{hero.subline}</p>
      </div>
      <div className="scroll-hint" data-cursor="disable">
        <span>scroll</span>
        <div className="scroll-hint-line" />
      </div>
    </section>
  );
};

export default Hero;
