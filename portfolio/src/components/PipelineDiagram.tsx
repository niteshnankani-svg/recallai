import { useEffect, useMemo, useRef } from "react";
import gsap from "gsap";
import "./styles/PipelineDiagram.css";

// Animated architecture diagram. A continuous "data pulse" always flows along the
// connectors (systems in motion). On desktop hover a GSAP timeline lights the
// nodes left→right in sequence; on touch (no hover) that light-up auto-loops.
const TEAL: [number, number, number] = [45, 212, 191];
const AMBER: [number, number, number] = [247, 168, 59];
const rgb = (c: number[]) => `rgb(${c[0]}, ${c[1]}, ${c[2]})`;
const mix = (a: number[], b: number[], t: number) =>
  a.map((v, i) => Math.round(v + (b[i] - v) * t));

const PipelineDiagram = ({ nodes, active }: { nodes: string[]; active: boolean }) => {
  const rootRef = useRef<HTMLDivElement>(null);
  const tlRef = useRef<gsap.core.Timeline | null>(null);
  const isTouch = useMemo(
    () => typeof window !== "undefined" && window.matchMedia("(hover: none)").matches,
    []
  );

  const colors = useMemo(
    () => nodes.map((_, i) => rgb(mix(TEAL, AMBER, nodes.length === 1 ? 0 : i / (nodes.length - 1)))),
    [nodes]
  );

  useEffect(() => {
    if (!rootRef.current) return;
    const root = rootRef.current;
    const nodeEls = Array.from(root.querySelectorAll<HTMLElement>(".pipe-node"));
    const fillEls = Array.from(root.querySelectorAll<HTMLElement>(".pipe-conn-fill"));

    gsap.set(nodeEls, { "--lit": 0, boxShadow: "0 0 0 rgba(0,0,0,0)", borderColor: "rgba(255,255,255,0.12)" });
    gsap.set(fillEls, { scaleX: 0, transformOrigin: "left center" });

    const tl = gsap.timeline({ paused: true, defaults: { ease: "power2.out" } });
    nodeEls.forEach((el, i) => {
      const c = colors[i];
      tl.to(el, { "--lit": 1, duration: 0.28, boxShadow: `0 0 18px -2px ${c}`, borderColor: c }, i === 0 ? 0 : ">-0.06");
      if (i < fillEls.length) tl.to(fillEls[i], { scaleX: 1, duration: 0.22 }, ">-0.05");
    });
    tlRef.current = tl;

    if (isTouch) {
      // no hover on touch — auto-loop the light-up so it's never frozen
      tl.repeat(-1).repeatDelay(1.4).yoyo(true).play();
    }
    return () => {
      tl.kill();
      tlRef.current = null;
    };
  }, [colors, isTouch]);

  useEffect(() => {
    if (isTouch) return;
    const tl = tlRef.current;
    if (!tl) return;
    if (active) tl.play();
    else tl.reverse();
  }, [active, isTouch]);

  return (
    <div ref={rootRef} className="pipe" aria-hidden>
      {nodes.map((n, i) => (
        <div className="pipe-step" key={i}>
          <span className="pipe-node" style={{ "--accent": colors[i] } as React.CSSProperties}>
            {n}
          </span>
          {i < nodes.length - 1 && (
            <span className="pipe-conn" style={{ "--accent": colors[i] } as React.CSSProperties}>
              <span className="pipe-conn-fill" />
              <span className="pipe-conn-pulse" style={{ animationDelay: `${i * 0.28}s` }} />
            </span>
          )}
        </div>
      ))}
    </div>
  );
};

export default PipelineDiagram;
