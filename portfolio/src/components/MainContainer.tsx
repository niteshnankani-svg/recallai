import { useEffect } from "react";
import Cursor from "./Cursor";
import Navbar from "./Navbar";
import SocialRail from "./SocialRail";
import Hero from "./Hero";
import Summary from "./Summary";
import Before from "./Before";
import Pivot from "./Pivot";
import Work from "./Work";
import Skills from "./Skills";
import Experience from "./Experience";
import Education from "./Education";
import HowIWork from "./HowIWork";
import Contact from "./Contact";
import setSplitText from "./utils/splitText";

// Everything scrolls inside the ScrollSmoother wrapper/content pair. The 3D hero
// scene lives inside <Hero>; the tech-stack ball-pit inside <TechStack>.
const MainContainer = () => {
  useEffect(() => {
    const handler = () => setSplitText();
    handler();
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);

  return (
    <div className="container-main">
      <Cursor />
      <Navbar />
      <SocialRail />
      <div id="smooth-wrapper">
        <div id="smooth-content">
          <Hero />
          <Summary />
          <Before />
          <Pivot />
          <Work />
          <Skills />
          <Experience />
          <Education />
          <HowIWork />
          <Contact />
        </div>
      </div>
    </div>
  );
};

export default MainContainer;
