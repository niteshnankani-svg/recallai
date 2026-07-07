import { useEffect, useRef, Suspense } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { ContactShadows, Sparkles } from "@react-three/drei";
import Character from "./Character";
import { useLoading } from "../../context/LoadingProvider";
import { setProgress } from "../Loading";
import { initialFX } from "../utils/initialFX";
import "./scene.css";

// Hero 3D scene: a rigged human character at a lit "workstation", framed like
// the reference site's character scene. Contained to the hero section (it
// scrolls away naturally) rather than fixed behind the whole page.

const Rig = ({ mouse }: { mouse: React.MutableRefObject<{ x: number; y: number }> }) => {
  const { camera } = useThree();
  const dolly = useRef(0);
  useEffect(() => {
    camera.position.set(0, 0.3, 9);
    camera.lookAt(0, -0.1, 0);
    const onMove = (e: MouseEvent) => {
      mouse.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouse.current.y = (e.clientY / window.innerHeight) * 2 - 1;
    };
    document.addEventListener("mousemove", onMove);
    return () => document.removeEventListener("mousemove", onMove);
  }, [camera, mouse]);
  useFrame((_, delta) => {
    // faint parallax so the frame breathes with the cursor
    dolly.current += (mouse.current.x * 0.25 - dolly.current) * Math.min(1, delta * 2);
    camera.position.x = dolly.current;
    camera.lookAt(0, -0.1, 0);
  });
  return null;
};

// A subtle glowing pedestal ring so the character reads as "on stage" rather
// than floating (procedural — no extra assets).
const Pedestal = () => (
  <group position={[0, -1.75, 0]}>
    <mesh rotation={[-Math.PI / 2, 0, 0]}>
      <ringGeometry args={[1.15, 1.35, 64]} />
      <meshStandardMaterial
        color="#0a2233"
        emissive="#22d3ee"
        emissiveIntensity={1.4}
        toneMapped={false}
        transparent
        opacity={0.9}
      />
    </mesh>
  </group>
);

const ReadyGate = () => {
  const { setLoading } = useLoading();
  useEffect(() => {
    const progress = setProgress((v) => setLoading(v));
    requestAnimationFrame(() => {
      progress.loaded().then(() => setTimeout(() => initialFX(), 50));
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return null;
};

const Scene3D = () => {
  const mouse = useRef({ x: 0, y: 0 });
  return (
    <div className="scene3d-container" data-cursor="disable">
      <Canvas
        dpr={[1, 2]}
        camera={{ fov: 32, position: [0, 0.2, 6.6] }}
        gl={{ antialias: true, alpha: true }}
      >
        {/* lighting: soft ambient + warm key + cyan rim + screen glow */}
        <hemisphereLight args={["#cfefff", "#0a0e17", 0.55]} />
        <ambientLight intensity={0.35} />
        <directionalLight position={[4, 6, 4]} intensity={1.5} color="#fff2e0" />
        <pointLight position={[-3.5, 1.2, 3]} intensity={26} color="#22d3ee" />
        <pointLight position={[3.5, 0.4, 2]} intensity={12} color="#e08a3c" />
        <pointLight position={[0, 0.4, 2.2]} intensity={8} color="#8bd8ff" />

        <Suspense fallback={null}>
          <Character mouse={mouse} />
          <Pedestal />
          <ReadyGate />
        </Suspense>

        <ContactShadows
          position={[0, -2.13, 0]}
          opacity={0.55}
          scale={9}
          blur={2.6}
          far={4}
          color="#020308"
        />
        <Sparkles count={70} scale={[10, 6, 4]} size={2.4} speed={0.3} color="#22d3ee" opacity={0.5} />
        <Rig mouse={mouse} />
      </Canvas>
    </div>
  );
};

export default Scene3D;
