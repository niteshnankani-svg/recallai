import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { experience } from "../data/experience";
import "./styles/Experience.css";

gsap.registerPlugin(ScrollTrigger);

// Work-experience timeline — a vertical spine that grows as you scroll and
// entries that stagger in. Adapted from the reference site's Career section
// (the growing `.career-timeline` + staggered `.career-info-box`).
const Experience = () => {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!rootRef.current) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        ".xp-spine-fill",
        { scaleY: 0 },
        {
          scaleY: 1,
          ease: "none",
          scrollTrigger: {
            trigger: rootRef.current,
            start: "top 65%",
            end: "bottom 70%",
            scrub: true,
          },
        }
      );
      gsap.fromTo(
        ".xp-entry",
        { autoAlpha: 0, y: 60 },
        {
          autoAlpha: 1,
          y: 0,
          duration: 0.7,
          ease: "power3.out",
          stagger: 0.15,
          scrollTrigger: {
            trigger: rootRef.current,
            start: window.innerWidth <= 1024 ? "top 80%" : "top 70%",
            toggleActions: "play pause resume reverse",
          },
        }
      );
    }, rootRef);
    return () => ctx.revert();
  }, []);

  return (
    <section className="xp-section" id="experience">
      <div className="xp-container">
        <span className="section-kicker">Experience</span>
        <h2 className="title xp-heading">
          Twelve years of <span>building businesses</span>
        </h2>
        <div className="xp-timeline" ref={rootRef}>
          <div className="xp-spine">
            <div className="xp-spine-fill" />
          </div>
          {experience.map((job) => (
            <div className="xp-entry" key={job.role + job.org}>
              <div className="xp-dot" />
              <div className="xp-card glass">
                <div className="xp-card-head">
                  <h3 className="font-head">
                    {job.role} <span className="xp-org">· {job.org}</span>
                  </h3>
                  <span className="xp-period">{job.period}</span>
                </div>
                <p className="xp-tag">{job.tag}</p>
                <ul className="xp-points">
                  {job.points.map((p, i) => (
                    <li key={i}>{p}</li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Experience;
