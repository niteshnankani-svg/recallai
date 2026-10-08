import { MdArrowOutward, MdCopyright, MdFileDownload } from "react-icons/md";
import { contact } from "../data/content";
import "./styles/Contact.css";

// Section 6 — CTA. Adapted from the reference Contact.tsx: link columns + a
// résumé download button in place of a backend form (per the chosen approach).
const Contact = () => {
  return (
    <section className="contact-section" id="contact">
      <div className="contact-container">
        <h2 className="contact-title title">Let's talk</h2>
        <p className="contact-lead">
          Looking for an operator who ships AI systems to production — remotely,
          on your timezone? Let's build something real.
        </p>

        <div className="contact-cta-row">
          <a
            className="contact-primary"
            href={contact.links[0].href}
            data-cursor="disable"
          >
            Email me <MdArrowOutward />
          </a>
          <a
            className="contact-secondary"
            href={contact.resume}
            download
            data-cursor="disable"
          >
            <MdFileDownload /> Download résumé
          </a>
        </div>

        <div className="contact-links">
          {contact.links.map((link) => (
            <a
              key={link.label}
              href={link.href}
              target={link.href.startsWith("http") ? "_blank" : undefined}
              rel="noreferrer"
              className="contact-link"
              data-cursor="disable"
            >
              {link.label} <MdArrowOutward />
            </a>
          ))}
        </div>

        <div className="contact-foot">
          <span>
            <MdCopyright /> 2026 Nitesh Nankani
          </span>
          <span>Pune, Maharashtra · Built with React, three.js & GSAP</span>
        </div>
      </div>
    </section>
  );
};

export default Contact;
