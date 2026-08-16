import { useEffect, useRef, useState } from "react";
import { MdArrowOutward } from "react-icons/md";
import { FaGithub } from "react-icons/fa";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { projects, Project } from "../data/projects";
import PipelineDiagram from "./PipelineDiagram";
import "./styles/Work.css";

gsap.registerPlugin(ScrollTrigger);

// Section 4 — "What I Built" (the centerpiece). Glass cards, staggered scroll
// reveal (reference Work.tsx pattern), and on hover each card's architecture
// line animates as a flowing pipeline (see PipelineDiagram).
const ProjectCard = ({ project, index }: { project: Project; index: number }) => {
  const [hover, setHover] = useState(false);
  return (
    <a
      className="glass work-card"
      href={project.link}
      target="_blank"
      rel="noreferrer"
      data-cursor="disable"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <div className="work-card-index">0{index + 1}</div>
      <div className="work-card-body">
        <h3 className="work-card-title font-head">
          {project.title}
          <MdArrowOutward className="work-card-arrow" />
        </h3>
        <p className="work-card-blurb">{project.blurb}</p>
        <PipelineDiagram nodes={project.pipeline} active={hover} />
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
  );
};

const Work = () => {
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!listRef.current) return;
    const cards = listRef.current.querySelectorAll(".work-card");
    const anim = gsap.fromTo(
      cards,
      { autoAlpha: 0, y: 70 },
      {
        autoAlpha: 1,
        y: 0,
        duration: 0.85,
        ease: "power3.out",
        stagger: 0.12,
        scrollTrigger: {
          trigger: listRef.current,
          start: window.innerWidth <= 1024 ? "top 82%" : "top 74%",
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
        <span className="section-kicker">What I Built</span>
        <h2 className="work-heading title font-head">
          Six systems, <span className="grad-text">in production</span>
        </h2>
        <p className="work-sub">
          Hover any project to trace its architecture — each one is clickable.
        </p>

        <div className="work-list" ref={listRef}>
          {projects.map((project, index) => (
            <ProjectCard project={project} index={index} key={project.id} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default Work;
