import { summary } from "../data/content";
import "./styles/Sections.css";

// Short professional summary — uses the shared .para scroll reveal.
const Summary = () => {
  return (
    <section className="story-section summary-section" id="summary">
      <div className="story-container">
        <span className="section-kicker">{summary.kicker}</span>
        <p className="para story-body summary-body">{summary.body}</p>
      </div>
    </section>
  );
};

export default Summary;
