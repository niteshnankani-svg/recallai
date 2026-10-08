import { useEffect } from "react";
import { createPortal } from "react-dom";
import { MdArrowOutward, MdClose } from "react-icons/md";
import { FaGithub } from "react-icons/fa";
import { Project } from "../data/projects";
import PipelineDiagram from "./PipelineDiagram";
import { smoother } from "./Navbar";
import "./styles/ProjectModal.css";

// Click-to-expand deep-dive. Portaled to <body> so its fixed overlay isn't
// trapped inside ScrollSmoother's transformed #smooth-content. Pauses the
// smoother + locks scroll while open; closes on Esc, backdrop click, or ✕.
//
// Enter/exit use CSS animation + plain conditional render (NOT framer-motion
// AnimatePresence): the modal's visibility must never depend on a
// requestAnimationFrame-driven JS tween, which a heavy WebGL frame can starve —
// that would leave the overlay stuck open (or stuck invisible). CSS animations
// composite independently of the GSAP/framer ticker, and a null render removes
// the overlay synchronously.
const ProjectModal = ({
  project,
  index,
  onClose,
}: {
  project: Project | null;
  index: number;
  onClose: () => void;
}) => {
  const open = !!project;

  useEffect(() => {
    if (!open) return;
    smoother?.paused(true);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
      smoother?.paused(false);
    };
  }, [open, onClose]);

  if (typeof document === "undefined" || !project) return null;

  return createPortal(
    <div
      className="pm-overlay"
      onClick={onClose}
      data-cursor="disable"
      role="presentation"
    >
      <div
        className="pm-panel glass"
        role="dialog"
        aria-modal="true"
        aria-label={`${project.title} details`}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          className="pm-close"
          onClick={onClose}
          aria-label="Close"
          data-cursor="disable"
        >
          <MdClose />
        </button>

        <div className="pm-head">
          <span className="pm-index">0{index + 1}</span>
          <span
            className={`work-card-status ${
              project.production ? "is-live" : "is-built"
            }`}
          >
            {project.production ? "Live in production" : "Built & evaluated"}
          </span>
        </div>

        <h2 className="pm-title font-head">{project.title}</h2>
        <p className="pm-overview">{project.details.overview}</p>

        <div className="pm-section-label">Architecture</div>
        <div className="pm-pipe">
          <PipelineDiagram nodes={project.pipeline} active />
        </div>

        <div className="pm-section-label">Highlights</div>
        <ul className="pm-highlights">
          {project.details.highlights.map((h, i) => (
            <li key={i}>{h}</li>
          ))}
        </ul>

        <div className="pm-links">
          {project.link && (
            <a
              className="pm-link pm-link-primary"
              href={project.link}
              target="_blank"
              rel="noreferrer"
              data-cursor="disable"
            >
              {project.production && project.link !== project.github
                ? "Open live demo"
                : "View on GitHub"}
              <MdArrowOutward />
            </a>
          )}
          {project.github && project.github !== project.link && (
            <a
              className="pm-link pm-link-ghost"
              href={project.github}
              target="_blank"
              rel="noreferrer"
              data-cursor="disable"
            >
              <FaGithub />
              Source
            </a>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};

export default ProjectModal;
