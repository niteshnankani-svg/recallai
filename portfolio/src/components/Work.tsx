import { useEffect, useRef, useState } from "react";
import { MdArrowOutward } from "react-icons/md";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { projects, Project } from "../data/projects";
import PipelineDiagram from "./PipelineDiagram";
import ProjectModal from "./ProjectModal";
import "./styles/Work.css";

gsap.registerPlugin(ScrollTrigger);

// Section 4 — "What I Built" (the centerpiece). Glass cards, staggered scroll
// reveal (reference Work.tsx pattern), and on hover each card's architecture
// line animates as a flowing pipeline (see PipelineDiagram). Clicking a card
// opens a deep-dive modal with the full story + metrics.
const ProjectCard = ({
  project,
  index,
  onOpen,
}: {
  project: Project;
  index: number;
  onOpen: () => void;
}) => {
  const [hover, setHover] = useState(false);
  return (
    <button
      type="button"
      className="glass work-card"
      data-cursor="disable"
      aria-label={`${project.title} — view details`}
      onClick={onOpen}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <div className="work-card-index">
        0{index + 1}
        <span
          className={`work-card-status ${project.production ? "is-live" : "is-built"}`}
        >
          {project.production ? "Live" : "Built"}
        </span>
      </div>
      <div className="work-card-body">
        <h3 className="work-card-title font-head">
          {project.title}
          <MdArrowOutward className="work-card-arrow" />
        </h3>
        <p className="work-card-blurb">{project.blurb}</p>
        <PipelineDiagram nodes={project.pipeline} active={hover} />
      </div>
    </button>
  );
};

const Work = () => {
  const rootRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const introRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState<number | null>(null);

  useEffect(() => {
    if (!rootRef.current || !listRef.current) return;
    const desktop = window.innerWidth > 1024;

    const ctx = gsap.context(() => {
      const cards = gsap.utils.toArray<HTMLElement>(".work-card");

      // Pinned "scroll moment" (desktop only): the intro column holds in place
      // while the project list scrolls past it, so the heading anchors the
      // reader as each system flies in. pinSpacing:false keeps layout flow.
      if (desktop && introRef.current) {
        ScrollTrigger.create({
          trigger: rootRef.current,
          start: "top top",
          end: "bottom bottom",
          pin: introRef.current,
          pinSpacing: false,
        });
      }

      // Cards reveal one-by-one as each scrolls into view (individual triggers
      // instead of a single stagger, so the cadence tracks the scroll).
      cards.forEach((card) => {
        gsap.fromTo(
          card,
          { autoAlpha: 0, y: 70, scale: 0.96 },
          {
            autoAlpha: 1,
            y: 0,
            scale: 1,
            duration: 0.8,
            ease: "power3.out",
            scrollTrigger: {
              trigger: card,
              start: desktop ? "top 88%" : "top 90%",
              toggleActions: "play pause resume reverse",
            },
          }
        );
      });
    }, rootRef);

    return () => ctx.revert();
  }, []);

  return (
    <section className="work-section" id="work">
      <div className="work-container" ref={rootRef}>
        <div className="work-intro" ref={introRef}>
          <span className="section-kicker">What I Built</span>
          <h2 className="work-heading title font-head">
            Nine systems, <span className="grad-text">six in production</span>
          </h2>
          <p className="work-sub">
            Hover any project to trace its architecture — each one is clickable.
            <span className="work-sub-legend">
              <span className="dot is-live" /> live in production
              <span className="dot is-built" /> built &amp; evaluated
            </span>
          </p>
        </div>

        <div className="work-list" ref={listRef}>
          {projects.map((project, index) => (
            <ProjectCard
              project={project}
              index={index}
              key={project.id}
              onOpen={() => setActive(index)}
            />
          ))}
        </div>
      </div>

      <ProjectModal
        project={active !== null ? projects[active] : null}
        index={active ?? 0}
        onClose={() => setActive(null)}
      />
    </section>
  );
};

export default Work;
