import { useEffect, useMemo, useRef } from "react";
import gsap from "gsap";
import "./styles/PipelineDiagram.css";

// Animated architecture diagram — the "wow that also proves knowledge" moment.
// Renders a project's pipeline as glass node-chips joined by connectors. When
// `active` (card hover), a GSAP timeline lights the nodes left→right in sequence
// and fills each connector with a teal→amber pulse. On touch/hover-less devices
// it renders fully lit and static.

const TEAL: [number, number, number] = [45, 212, 191];
const AMBER: [number, number, number] = [247, 168, 59];
const rgb = (c: number[]) => `rgb(${c[0]}, ${c[1]}, ${c[2]})`;
const mix = (a: number[], b: number[], t: number) =>
  a.map((v, i) => Math.round(v + (b[i] - v) * t));

const PipelineDiagram = ({ nodes, active }: { nodes: string[]; active: boolean }) => {
  const rootRef = useRef<HTMLDivElement>(null);
  const tlRef = useRef<gsap.core.Timeline | null>(null);
  const isStatic = useMemo(
    () => typeof window !== "undefined" && window.matchMedia("(hover: none)").matches,
    []
  );

  const colors = useMemo(
    () => nodes.map((_, i) => rgb(mix(TEAL, AMBER, nodes.length === 1 ? 0 : i / (nodes.length - 1)))),
    [nodes]
  );

  useEffect(() => {
    if (isStatic || !rootRef.current) return;
    const root = rootRef.current;
    const nodeEls = Array.from(root.querySelectorAll<HTMLElement>(".pipe-node"));
    const fillEls = Array.from(root.querySelectorAll<HTMLElement>(".pipe-conn-fill"));

    const tl = gsap.timeline({ paused: true, defaults: { ease: "power2.out" } });
    nodeEls.forEach((el, i) => {
      const c = colors[i];
      tl.set(el, { "--lit": 0 }, i === 0 ? 0 : ">-0.05");
      tl.to(el, { "--lit": 1, duration: 0.28, boxShadow: `0 0 18px -2px ${c}`, borderColor: c }, ">-0.02");
      if (i < fillEls.length) {
        tl.to(fillEls[i], { scaleX: 1, duration: 0.22 }, ">-0.06");
      }
    });
    tlRef.current = tl;
    // start dimmed
    gsap.set(nodeEls, { "--lit": 0, boxShadow: "0 0 0 rgba(0,0,0,0)", borderColor: "rgba(255,255,255,0.12)" });
    gsap.set(fillEls, { scaleX: 0, transformOrigin: "left center" });
    return () => {
      tl.kill();
      tlRef.current = null;
    };
  }, [colors, isStatic]);

  useEffect(() => {
    if (isStatic) return;
    const tl = tlRef.current;
    if (!tl) return;
    if (active) tl.play();
    else tl.reverse();
  }, [active, isStatic]);

  return (
    <div
      ref={rootRef}
      className={`pipe${isStatic ? " pipe--static" : ""}`}
      aria-hidden
    >
      {nodes.map((n, i) => (
        <div className="pipe-step" key={i}>
          <span
            className="pipe-node"
            style={{ "--accent": colors[i] } as React.CSSProperties}
          >
            {n}
          </span>
          {i < nodes.length - 1 && (
            <span
              className="pipe-conn"
              style={{ "--accent": colors[i] } as React.CSSProperties}
            >
              <span className="pipe-conn-fill" />
            </span>
          )}
        </div>
      ))}
    </div>
  );
};

export default PipelineDiagram;
