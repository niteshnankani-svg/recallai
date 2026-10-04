import { useEffect, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { EffectComposer, Bloom } from "@react-three/postprocessing";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Person, { PERSON_TRANSFORM } from "./Person";
import PersonParticles from "./PersonParticles";
import { useLoading } from "../../context/LoadingProvider";
import { setProgress } from "../Loading";
import { initialFX } from "../utils/initialFX";
import { smoother } from "../Navbar";
import "./scene.css";

gsap.registerPlugin(ScrollTrigger);

// Hero scene: a visible 3D person (Person) over a particle system sampled from
// its surface (PersonParticles). The "dive" — click / "Dive in" button / scroll —
// dissolves the person into particles that morph into the neural network, then
// scrolls into the site.
const isMobile = typeof window !== "undefined" && window.innerWidth < 768;
const PERSON = isMobile
  ? { position: new THREE.Vector3(0, -3.0, 0), scale: 0.36 }
  : PERSON_TRANSFORM;

const Rig = ({ diveProgress }: { diveProgress: React.MutableRefObject<number> }) => {
  const { camera } = useThree();
  const scroll = useRef(0);
  const click = useRef({ v: 0 });
  const count = isMobile ? 3600 : 7000;

  useEffect(() => {
    camera.position.set(0, 0, 9);

    // scroll over the hero also drives the dive (non-clickers still see it)
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
        duration: 2.6,
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
    // subtle dolly-in during the dive
    camera.position.z += (THREE.MathUtils.lerp(9, 7.6, d) - camera.position.z) * 0.08;
  });

  return (
    <>
      <ambientLight intensity={0.6} />
      <directionalLight position={[4, 6, 6]} intensity={2.2} color="#ffffff" />
      <directionalLight position={[-5, 2, 2]} intensity={1.6} color="#2dd4bf" />
      <pointLight position={[2, -1, 4]} intensity={6} color="#f7a83b" distance={14} />
      <Person
        diveProgress={diveProgress}
        transform={PERSON}
        onDive={() => window.dispatchEvent(new Event("portfolio-dive"))}
      />
      <PersonParticles diveProgress={diveProgress} count={count} transform={PERSON} />
    </>
  );
};

const FlashBloom = ({ diveProgress }: { diveProgress: React.MutableRefObject<number> }) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ref = useRef<any>(null);
  useFrame(() => {
    if (!ref.current) return;
    const d = diveProgress.current;
    const flash = Math.exp(-((d - 0.5) ** 2) / 0.015) * 1.8; // bump at mid-dive
    ref.current.intensity = 0.85 + flash;
  });
  return (
    <EffectComposer>
      <Bloom ref={ref} intensity={0.85} luminanceThreshold={0.12} luminanceSmoothing={0.5} mipmapBlur radius={0.7} />
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
