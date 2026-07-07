import { useEffect, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import MorphPoints from "./MorphPoints";
import { useLoading } from "../../context/LoadingProvider";
import { setProgress } from "../Loading";
import { initialFX } from "../utils/initialFX";
import "./scene.css";

gsap.registerPlugin(ScrollTrigger);

// R3F rig: owns the scroll->progress value (shared with MorphPoints) and applies
// a gentle mouse-lerp parallax to the whole group — the same "subtle 3D
// reactivity" idea as the reference Scene.tsx head-tracking.
const Rig = ({ progressRef }: { progressRef: React.MutableRefObject<number> }) => {
  const group = useRef<THREE.Group>(null);
  const mouse = useRef({ x: 0, y: 0 });
  const { camera } = useThree();

  useEffect(() => {
    camera.position.set(0, 0, 9);
    const onMove = (e: MouseEvent) => {
      mouse.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouse.current.y = (e.clientY / window.innerHeight) * 2 - 1;
    };
    document.addEventListener("mousemove", onMove);

    // Scroll-scrub over the hero section drives the morph, mirroring the
    // reference GsapScroll.ts scrub timelines (tl1/tl2). Delay + refresh so the
    // ScrollSmoother set up in Navbar is live first.
    const st = ScrollTrigger.create({
      trigger: ".hero-section",
      start: "top top",
      end: "bottom top",
      scrub: true,
      onUpdate: (self) => {
        progressRef.current = self.progress;
      },
    });
    const id = setTimeout(() => ScrollTrigger.refresh(), 300);
    return () => {
      document.removeEventListener("mousemove", onMove);
      clearTimeout(id);
      st.kill();
    };
  }, [camera, progressRef]);

  useFrame((_, delta) => {
    if (!group.current) return;
    const targetRotY = mouse.current.x * 0.35 + progressRef.current * 0.5;
    const targetRotX = mouse.current.y * 0.2;
    group.current.rotation.y +=
      (targetRotY - group.current.rotation.y) * Math.min(1, delta * 3);
    group.current.rotation.x +=
      (targetRotX - group.current.rotation.x) * Math.min(1, delta * 3);
  });

  return (
    <group ref={group}>
      <MorphPoints progressRef={progressRef} />
    </group>
  );
};

// Flips the loading gate off and fires the intro FX once the scene has rendered
// its first frame (R3F renders automatically once the canvas mounts).
const ReadyGate = () => {
  const { setLoading } = useLoading();
  useEffect(() => {
    const progress = setProgress((v) => setLoading(v));
    requestAnimationFrame(() => {
      progress.loaded().then(() => {
        setTimeout(() => initialFX(), 50);
      });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return null;
};

const Scene3D = () => {
  const progressRef = useRef(0);
  return (
    <div className="scene3d-container" data-cursor="disable">
      <Canvas
        dpr={[1, 2]}
        camera={{ fov: 40, position: [0, 0, 9] }}
        gl={{ antialias: true, alpha: true }}
      >
        <Rig progressRef={progressRef} />
        <ReadyGate />
      </Canvas>
    </div>
  );
};

export default Scene3D;
