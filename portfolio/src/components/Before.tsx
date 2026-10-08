import { before } from "../data/content";
import "./styles/Sections.css";

// Section 2 — "The Before". Uses the reference .para reveal (word stagger on
// scroll) via setSplitText. Same reveal engine as the reference About section.
const Before = () => {
  return (
    <section className="story-section before-section" id="before">
      <div className="story-container">
        <span className="section-kicker">{before.kicker}</span>
        <p className="para story-body">{before.body}</p>
      </div>
    </section>
  );
};

export default Before;
