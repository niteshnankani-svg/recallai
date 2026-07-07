import { PropsWithChildren, useEffect } from "react";
import Cursor from "./Cursor";
import Navbar from "./Navbar";
import SocialRail from "./SocialRail";
import Hero from "./Hero";
import Before from "./Before";
import Pivot from "./Pivot";
import Work from "./Work";
import HowIWork from "./HowIWork";
import Contact from "./Contact";
import setSplitText from "./utils/splitText";

// Adapted from the reference MainContainer.tsx: fixed-position 3D scene (children)
// as a background layer, everything else scrolls inside the ScrollSmoother
// wrapper/content pair. setSplitText wires the scroll reveals for .para/.title.
const MainContainer = ({ children }: PropsWithChildren) => {
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
      {/* fixed 3D background */}
      {children}
      <div id="smooth-wrapper">
        <div id="smooth-content">
          <Hero />
          <Before />
          <Pivot />
          <Work />
          <HowIWork />
          <Contact />
        </div>
      </div>
    </div>
  );
};

export default MainContainer;
