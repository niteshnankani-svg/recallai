import { howIWork } from "../data/content";
import "./styles/Sections.css";

// Section 5 — "How I Work". Same .para reveal as the reference WhatIDo section.
const HowIWork = () => {
  return (
    <section className="story-section howiwork-section" id="howiwork">
      <div className="story-container">
        <span className="section-kicker">{howIWork.kicker}</span>
        <p className="para story-body howiwork-body">{howIWork.body}</p>
      </div>
    </section>
  );
};

export default HowIWork;
