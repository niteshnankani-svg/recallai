import { useEffect } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ScrollSmoother } from "gsap/ScrollSmoother";
import HoverLinks from "./HoverLinks";
import "./styles/Navbar.css";

// Adapted from the reference Navbar.tsx: sets up ScrollSmoother over the
// #smooth-wrapper/#smooth-content pair and wires anchor links to smooth-scroll.
gsap.registerPlugin(ScrollSmoother, ScrollTrigger);
export let smoother: ScrollSmoother;

const Navbar = () => {
  useEffect(() => {
    // `?flat` skips smooth-scroll (used for automated screenshot verification).
    if (new URLSearchParams(window.location.search).has("flat")) {
      document.body.style.overflowY = "auto";
      return;
    }
    smoother = ScrollSmoother.create({
      wrapper: "#smooth-wrapper",
      content: "#smooth-content",
      smooth: 1.6,
      speed: 1.6,
      effects: true,
      autoResize: true,
      ignoreMobileResize: true,
    });
    smoother.scrollTop(0);
    smoother.paused(true);

    const links = document.querySelectorAll<HTMLAnchorElement>(".header ul a");
    links.forEach((element) => {
      element.addEventListener("click", (e) => {
        e.preventDefault();
        const section = element.getAttribute("data-href");
        if (section) smoother.scrollTo(section, true, "top top");
      });
    });

    const onResize = () => ScrollSmoother.refresh(true);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  return (
    <>
      <div className="header">
        <a href="/#" className="navbar-title" data-cursor="disable">
          NN
        </a>
        <a
          href="https://www.linkedin.com/in/nitesh-nankani-96014389/"
          className="navbar-connect"
          data-cursor="disable"
          target="_blank"
          rel="noreferrer"
        >
          linkedin.com/in/nitesh-nankani
        </a>
        <ul>
          <li>
            <a data-href="#before" href="#before">
              <HoverLinks text="STORY" />
            </a>
          </li>
          <li>
            <a data-href="#work" href="#work">
              <HoverLinks text="WORK" />
            </a>
          </li>
          <li>
            <a data-href="#contact" href="#contact">
              <HoverLinks text="CONTACT" />
            </a>
          </li>
        </ul>
      </div>
      <div className="nav-fade"></div>
    </>
  );
};

export default Navbar;
