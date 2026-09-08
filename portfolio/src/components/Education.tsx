import { education } from "../data/content";
import "./styles/Education.css";

// Compact education block.
const Education = () => {
  return (
    <section className="edu-section" id="education">
      <div className="edu-container">
        <span className="section-kicker">{education.kicker}</span>
        <div className="edu-list">
          {education.items.map((item) => (
            <div className="edu-item" key={item.title}>
              <div className="edu-item-main">
                <h3>{item.title}</h3>
                <p>{item.org}</p>
              </div>
              <span className="edu-period">{item.period}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Education;
