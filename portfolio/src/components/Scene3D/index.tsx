import { useEffect, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { EffectComposer, Bloom } from "@react-three/postprocessing";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import PersonImage, { PERSON_PLANE, Plane } from "./PersonImage";
import ImageParticles from "./ImageParticles";
import { useLoading } from "../../context/LoadingProvider";
import { setProgress } from "../Loading";
import { initialFX } from "../utils/initialFX";
import { smoother } from "../Navbar";
import "./scene.css";

gsap.registerPlugin(ScrollTrigger);

// Hero scene: the business-casual photo over particles sampled from it. The dive
// (click / "Dive in" / scroll) dissolves the photo into glowing particles that
// rise and morph into the neural network, while the code-rain intensifies.
const isMobile = typeof window !== "undefined" && window.innerWidth < 768;
const PLANE: Plane = isMobile
  ? { px: 0.2, py: -1.35, w: 2.25, h: 4.0 }
  : PERSON_PLANE;

const Rig = ({ diveProgress }: { diveProgress: React.MutableRefObject<number> }) => {
  const { camera } = useThree();
  const scroll = useRef(0);
  const click = useRef({ v: 0 });
  const count = isMobile ? 5000 : 9000;

  useEffect(() => {
    camera.position.set(0, 0, 9);
    const st = ScrollTrigger.create({
      trigger: ".hero-section",
      start: "top top",
      end: "bottom top",
      scrub: true,
      onUpdate: (self) => {
        scroll.current = self.progress;
      },
    });
    const startDive = () => {
      if (click.current.v > 0.01) return;
      gsap.to(click.current, {
        v: 1,
        duration: 2.8,
        ease: "power2.inOut",
        onComplete: () => smoother?.scrollTo("#summary", true, "top top"),
      });
    };
    window.addEventListener("portfolio-dive", startDive);
    const t = window.setTimeout(() => ScrollTrigger.refresh(), 300);
    return () => {
      window.removeEventListener("portfolio-dive", startDive);
      clearTimeout(t);
      st.kill();
    };
  }, [camera]);

  useFrame(() => {
    const d = Math.max(scroll.current, click.current.v);
    diveProgress.current = d;
    (window as unknown as { __dive?: number }).__dive = d;
    camera.position.z += (THREE.MathUtils.lerp(9, 7.8, d) - camera.position.z) * 0.08;
  });

  return (
    <>
      <PersonImage
        diveProgress={diveProgress}
        plane={PLANE}
        onDive={() => window.dispatchEvent(new Event("portfolio-dive"))}
      />
      <ImageParticles diveProgress={diveProgress} count={count} plane={PLANE} />
    </>
  );
};

const FlashBloom = ({ diveProgress }: { diveProgress: React.MutableRefObject<number> }) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ref = useRef<any>(null);
  useFrame(() => {
    if (!ref.current) return;
    const d = diveProgress.current;
    const flash = Math.exp(-((d - 0.5) ** 2) / 0.02) * 1.6;
    ref.current.intensity = 0.8 + flash;
  });
  return (
    <EffectComposer>
      <Bloom ref={ref} intensity={0.8} luminanceThreshold={0.1} luminanceSmoothing={0.5} mipmapBlur radius={0.75} />
    </EffectComposer>
  );
};

const ReadyGate = () => {
  const { setLoading } = useLoading();
  useEffect(() => {
    const progress = setProgress((v) => setLoading(v));
    requestAnimationFrame(() => {
      progress.loaded().then(() => setTimeout(() => initialFX(), 150));
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return null;
};

const Scene3D = () => {
  const diveProgress = useRef(0);
  return (
    <div className="scene3d-container" data-cursor="disable">
      <Canvas dpr={[1, 2]} camera={{ fov: 35, position: [0, 0, 9] }} gl={{ antialias: true, alpha: true }}>
        <Rig diveProgress={diveProgress} />
        <ReadyGate />
        <FlashBloom diveProgress={diveProgress} />
      </Canvas>
    </div>
  );
};

export default Scene3D;
