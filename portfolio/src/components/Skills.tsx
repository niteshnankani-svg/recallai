import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { skillGroups } from "../data/skills";
import "./styles/Skills.css";

gsap.registerPlugin(ScrollTrigger);

// Skills grid — six categories, staggered scroll reveal (same feel as the Work
// cards). Renders straight from data/skills.ts.
const Skills = () => {
  const gridRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!gridRef.current) return;
    const cards = gridRef.current.querySelectorAll(".skill-card");
    const anim = gsap.fromTo(
      cards,
      { autoAlpha: 0, y: 60 },
      {
        autoAlpha: 1,
        y: 0,
        duration: 0.7,
        ease: "power3.out",
        stagger: 0.08,
        scrollTrigger: {
          trigger: gridRef.current,
          start: window.innerWidth <= 1024 ? "top 85%" : "top 75%",
          toggleActions: "play pause resume reverse",
        },
      }
    );
    return () => {
      anim.scrollTrigger?.kill();
      anim.kill();
    };
  }, []);

  return (
    <section className="skills-section" id="skills">
      <div className="skills-container">
        <span className="section-kicker">Skills</span>
        <h2 className="title skills-heading">
          What I <span>work with</span>
        </h2>
        <div className="skills-grid" ref={gridRef}>
          {skillGroups.map((group) => (
            <div className="skill-card" key={group.title}>
              <h3 className="skill-card-title">{group.title}</h3>
              <ul className="skill-card-list">
                {group.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Skills;
