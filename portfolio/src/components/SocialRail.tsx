import { FaGithub, FaLinkedinIn } from "react-icons/fa";
import { SiHuggingface } from "react-icons/si";
import { MdMailOutline } from "react-icons/md";
import { contact } from "../data/content";
import "./styles/SocialRail.css";

// Adapted from the reference SocialIcons.tsx: a fixed vertical rail of social
// links. Uses data-cursor="icons" so the custom cursor stretches over it.
const SocialRail = () => {
  return (
    <div className="social-rail" data-cursor="icons">
      <a href="mailto:niteshnankani@gmail.com" aria-label="Email" data-cursor="icons">
        <MdMailOutline />
      </a>
      <a
        href="https://www.linkedin.com/in/nitesh-nankani-96014389/"
        target="_blank"
        rel="noreferrer"
        aria-label="LinkedIn"
        data-cursor="icons"
      >
        <FaLinkedinIn />
      </a>
      <a
        href="https://github.com/niteshnankani-svg"
        target="_blank"
        rel="noreferrer"
        aria-label="GitHub"
        data-cursor="icons"
      >
        <FaGithub />
      </a>
      <a
        href="https://huggingface.co/spaces/nitz0219"
        target="_blank"
        rel="noreferrer"
        aria-label="HuggingFace"
        data-cursor="icons"
      >
        <SiHuggingface />
      </a>
      <span className="social-rail-line" aria-hidden />
      <span className="social-rail-label">{contact.email}</span>
    </div>
  );
};

export default SocialRail;
