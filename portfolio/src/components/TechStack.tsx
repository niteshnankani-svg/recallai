import { useMemo } from "react";
import { Canvas } from "@react-three/fiber";
import { Physics, useSphere, usePlane } from "@react-three/cannon";
import * as THREE from "three";
import { techStack, Tech } from "../data/techStack";
import "./styles/TechStack.css";

// Section — "My Tech Stack": a physics ball-pit of labelled spheres (one per
// tool), echoing the reference site's floating tech-stack cluster. Labels are
// baked onto each sphere as a canvas texture, so there are no external font
// requests (works offline / inside the artifact sandbox).

const RADIUS = 0.6;

function makeLabelTexture(label: string, color: string): THREE.CanvasTexture {
  const c = document.createElement("canvas");
  c.width = 512;
  c.height = 256;
  const ctx = c.getContext("2d")!;
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, 512, 256);
  // subtle top sheen
  const g = ctx.createLinearGradient(0, 0, 0, 256);
  g.addColorStop(0, "rgba(255,255,255,0.22)");
  g.addColorStop(0.5, "rgba(255,255,255,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 512, 256);
  ctx.font = "bold 60px Inter, Arial, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.lineWidth = 8;
  ctx.strokeStyle = "rgba(4,7,13,0.75)";
  ctx.strokeText(label, 256, 132);
  ctx.fillStyle = "#ffffff";
  ctx.fillText(label, 256, 132);
  const tex = new THREE.CanvasTexture(c);
  tex.anisotropy = 4;
  tex.needsUpdate = true;
  return tex;
}

const Ball = ({ tech, position }: { tech: Tech; position: [number, number, number] }) => {
  const [ref] = useSphere(() => ({
    mass: 1,
    position,
    args: [RADIUS],
    linearDamping: 0.28,
    angularDamping: 0.7,
    velocity: [(Math.random() - 0.5) * 1.5, 0, (Math.random() - 0.5) * 1.2],
  }));
  const tex = useMemo(() => makeLabelTexture(tech.label, tech.color), [tech]);
  return (
    <mesh ref={ref as React.Ref<THREE.Mesh>} castShadow>
      <sphereGeometry args={[RADIUS, 44, 44]} />
      <meshStandardMaterial map={tex} roughness={0.32} metalness={0.12} />
    </mesh>
  );
};

// Invisible container walls that keep the balls in frame.
const Bounds = () => {
  usePlane(() => ({ position: [0, -2.3, 0], rotation: [-Math.PI / 2, 0, 0] }));
  usePlane(() => ({ position: [0, 4.5, 0], rotation: [Math.PI / 2, 0, 0] }));
  usePlane(() => ({ position: [-3.6, 0, 0], rotation: [0, Math.PI / 2, 0] }));
  usePlane(() => ({ position: [3.6, 0, 0], rotation: [0, -Math.PI / 2, 0] }));
  usePlane(() => ({ position: [0, 0, -1.5], rotation: [0, 0, 0] }));
  usePlane(() => ({ position: [0, 0, 1.6], rotation: [0, Math.PI, 0] }));
  return null;
};

const TechStack = () => {
  return (
    <section className="tech-section" id="tech">
      <div className="tech-header">
        <span className="section-kicker">My Tech Stack</span>
        <h2 className="title tech-title">
          The tools behind the <span>five systems</span>
        </h2>
      </div>
      <div className="tech-canvas">
        <Canvas dpr={[1, 2]} camera={{ fov: 42, position: [0, -1.35, 8.2] }} gl={{ alpha: true, antialias: true }}>
          <ambientLight intensity={0.6} />
          <directionalLight position={[3, 6, 4]} intensity={1.3} color="#fff4e6" />
          <pointLight position={[-4, 2, 4]} intensity={22} color="#22d3ee" />
          <pointLight position={[4, -1, 3]} intensity={12} color="#e08a3c" />
          <Physics
            gravity={[0, -6, 0]}
            defaultContactMaterial={{ restitution: 0.4, friction: 0.35 }}
          >
            <Bounds />
            {techStack.map((tech, i) => (
              <Ball
                key={tech.label}
                tech={tech}
                position={[
                  (Math.random() - 0.5) * 4.5,
                  -1.4 + (i % 6) * 0.75,
                  (Math.random() - 0.5) * 1.6,
                ]}
              />
            ))}
          </Physics>
        </Canvas>
      </div>
    </section>
  );
};

export default TechStack;
