import { lazy, Suspense, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { hero } from "../data/content";
import MorphFallback from "./Scene3D/MorphFallback";
import "./styles/Hero.css";

// Section 1 — the garment→neural-network morph sits behind the copy. We run the
// real R3F morph on every device that supports WebGL (fewer particles on small
// screens); the 2D SVG is only a no-WebGL fallback.
const Scene3D = lazy(() => import("./Scene3D"));

function hasWebGL(): boolean {
  try {
    const c = document.createElement("canvas");
    return !!(
      window.WebGLRenderingContext &&
      (c.getContext("webgl") || c.getContext("experimental-webgl"))
    );
  } catch {
    return false;
  }
}

const Hero = () => {
  const [is3D, setIs3D] = useState(false);
  useEffect(() => {
    setIs3D(hasWebGL());
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

        <motion.button
          className="hero-dive-btn"
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.1, duration: 0.6 }}
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => window.dispatchEvent(new Event("portfolio-dive"))}
        >
          Dive in
          <span className="hero-dive-arrow">↓</span>
        </motion.button>
      </div>

      <div className="scroll-hint" data-cursor="disable">
        <span>scroll</span>
        <div className="scroll-hint-line" />
      </div>
    </section>
  );
};

export default Hero;
