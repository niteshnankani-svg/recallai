import { lazy, Suspense, useEffect, useState } from "react";
import { hero } from "../data/content";
import MorphFallback from "./Scene3D/MorphFallback";
import "./styles/Hero.css";

// Section 1 — the garment→neural-network morph sits behind the copy and scrolls
// away with the hero. Desktop loads the R3F scene lazily; mobile (<768) degrades
// to a lightweight 2D SVG morph (keeps the hero fast on phones).
const Scene3D = lazy(() => import("./Scene3D"));

const Hero = () => {
  const [is3D, setIs3D] = useState(false);
  useEffect(() => {
    setIs3D(window.matchMedia("(min-width: 768px)").matches);
  }, []);

  return (
    <section className="hero-section" id="hero">
      <div className="hero-canvas">
        {is3D ? (
          <Suspense fallback={null}>
            <Scene3D />
          </Suspense>
        ) : (
          <MorphFallback />
        )}
      </div>

      <div className="hero-container">
        <p className="hero-eyebrow">{hero.eyebrow}</p>
        <div className="hero-name">
          <h1 className="font-head">
            {hero.name.first}
            <br />
            <span className="grad-text">{hero.name.last}</span>
          </h1>
        </div>
        <p className="hero-sub">{hero.subline}</p>
        <ul className="hero-trust">
          {hero.trust.map((t) => (
            <li key={t}>{t}</li>
          ))}
        </ul>
      </div>

      <div className="scroll-hint" data-cursor="disable">
        <span>scroll</span>
        <div className="scroll-hint-line" />
      </div>
    </section>
  );
};

export default Hero;
