import { useEffect, useRef } from "react";
import { MdArrowOutward } from "react-icons/md";
import { FaGithub } from "react-icons/fa";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { projects } from "../data/projects";
import "./styles/Work.css";

gsap.registerPlugin(ScrollTrigger);

// Section 4 — "What I Built". Adapted from the reference Work.tsx (project cards
// + WorkImage hover), but rebuilt as a staggered scroll-reveal card list driven
// by ScrollTrigger + gsap stagger — the same reveal feel as the reference Work
// section, with each card clicking through to a live demo / GitHub.
const Work = () => {
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!listRef.current) return;
    const cards = listRef.current.querySelectorAll(".work-card");
    const anim = gsap.fromTo(
      cards,
      { autoAlpha: 0, y: 90 },
      {
        autoAlpha: 1,
        y: 0,
        duration: 0.9,
        ease: "power3.out",
        stagger: 0.12,
        scrollTrigger: {
          trigger: listRef.current,
          start: window.innerWidth <= 1024 ? "top 80%" : "top 70%",
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
    <section className="work-section" id="work">
      <div className="work-container">
        <h2 className="work-heading title">
          What I <span>Built</span>
        </h2>
        <p className="work-sub">
          Five production systems. Every one is live and clickable.
        </p>

        <div className="work-list" ref={listRef}>
          {projects.map((project, index) => (
            <a
              className="work-card"
              key={project.id}
              href={project.link}
              target="_blank"
              rel="noreferrer"
              data-cursor="disable"
            >
              <div className="work-card-index">0{index + 1}</div>
              <div className="work-card-body">
                <h3 className="work-card-title">
                  {project.title}
                  <MdArrowOutward className="work-card-arrow" />
                </h3>
                <p className="work-card-blurb">{project.blurb}</p>
                <div className="work-card-tags">
                  {project.tags.map((tag) => (
                    <span className="work-tag" key={tag}>
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
              {project.github && (
                <span
                  className="work-card-github"
                  onClick={(e) => {
                    e.preventDefault();
                    window.open(project.github, "_blank", "noreferrer");
                  }}
                  aria-label={`${project.title} source on GitHub`}
                >
                  <FaGithub />
                </span>
              )}
            </a>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Work;
