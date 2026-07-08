import { useEffect } from "react";
import { useLoading } from "../../context/LoadingProvider";
import { setProgress } from "../Loading";
import { initialFX } from "../utils/initialFX";
import "./scene.css";

// Lightweight 2D fallback for mobile (skips the R3F canvas). A looping SVG that
// cross-fades a folded-garment outline (amber) into a neural network (teal) —
// still tells the pivot, cheaply. Also dismisses the loading gate since the 3D
// ReadyGate never mounts here.
const nodes = [
  [22, 30], [22, 70],
  [50, 20], [50, 50], [50, 80],
  [78, 35], [78, 65],
];
const edges: [number, number][] = [
  [0, 2], [0, 3], [1, 3], [1, 4],
  [2, 5], [3, 5], [3, 6], [4, 6],
];

const MorphFallback = () => {
  const { setLoading } = useLoading();
  useEffect(() => {
    const progress = setProgress((v) => setLoading(v));
    progress.loaded().then(() => setTimeout(() => initialFX(), 50));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="morph-fallback" data-cursor="disable" aria-hidden>
      <svg viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet">
        <defs>
          <linearGradient id="mf-grad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#2dd4bf" />
            <stop offset="100%" stopColor="#f7a83b" />
          </linearGradient>
        </defs>

        {/* garment (folded) */}
        <g className="mf-garment" stroke="#f7a83b" strokeWidth="1.1" fill="none" strokeLinejoin="round">
          <path d="M35 22 L50 15 L65 22 L72 32 L64 38 L64 78 L36 78 L36 38 L28 32 Z" />
          <path d="M42 40 H58 M42 52 H58 M42 64 H58" strokeWidth="0.7" opacity="0.7" />
        </g>

        {/* neural network */}
        <g className="mf-network">
          {edges.map(([a, b], i) => (
            <line
              key={i}
              x1={nodes[a][0]} y1={nodes[a][1]}
              x2={nodes[b][0]} y2={nodes[b][1]}
              stroke="url(#mf-grad)" strokeWidth="0.8" opacity="0.75"
            />
          ))}
          {nodes.map(([x, y], i) => (
            <circle key={i} cx={x} cy={y} r="2.6" fill="#2dd4bf" style={{ animationDelay: `${i * 0.2}s` }} />
          ))}
        </g>
      </svg>
    </div>
  );
};

export default MorphFallback;
