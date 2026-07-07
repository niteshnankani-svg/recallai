import { hero } from "../data/content";
import "./styles/Hero.css";

// Section 1 — adapted from the reference Landing.tsx. The 3D morph object is the
// fixed background (Scene3D); this is the copy layer that sits over it. The
// .hero-section is also the ScrollTrigger scrub target that drives the morph.
const Hero = () => {
  return (
    <section className="hero-section" id="hero">
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
