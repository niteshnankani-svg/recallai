import { pivot } from "../data/content";
import "./styles/Sections.css";

// Section 3 — "The Pivot". Single-line reveal using the reference .title char
// stagger (via setSplitText).
const Pivot = () => {
  return (
    <section className="story-section pivot-section" id="pivot">
      <div className="story-container">
        <span className="section-kicker">{pivot.kicker}</span>
        <h2 className="title pivot-line">{pivot.line}</h2>
      </div>
    </section>
  );
};

export default Pivot;
