import { useEffect, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { EffectComposer, Bloom } from "@react-three/postprocessing";
import MorphPoints from "./MorphPoints";
import { useLoading } from "../../context/LoadingProvider";
import { setProgress } from "../Loading";
import { initialFX } from "../utils/initialFX";
import "./scene.css";

// Hero 3D scene. The garment→neural morph AUTO-PLAYS once the loading overlay
// lifts (see MorphPoints intro timeline), then loops. Slow group drift + mouse
// parallax on top.
const Rig = ({
  introRef,
  count,
}: {
  introRef: React.MutableRefObject<boolean>;
  count: number;
}) => {
  const group = useRef<THREE.Group>(null);
  const mouse = useRef({ x: 0, y: 0 });
  const spin = useRef(0);
  const { camera } = useThree();

  useEffect(() => {
    camera.position.set(0, 0, 9);
    const onMove = (e: MouseEvent) => {
      mouse.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouse.current.y = (e.clientY / window.innerHeight) * 2 - 1;
    };
    document.addEventListener("mousemove", onMove);
    return () => document.removeEventListener("mousemove", onMove);
  }, [camera]);

  useFrame((_, delta) => {
    if (!group.current) return;
    spin.current += delta * 0.1;
    const ty = mouse.current.x * 0.35 + spin.current;
    const tx = mouse.current.y * 0.2;
    group.current.rotation.y += (ty - group.current.rotation.y) * Math.min(1, delta * 3);
    group.current.rotation.x += (tx - group.current.rotation.x) * Math.min(1, delta * 3);
  });

  return (
    <group ref={group}>
      <MorphPoints introRef={introRef} count={count} />
    </group>
  );
};

const ReadyGate = ({ introRef }: { introRef: React.MutableRefObject<boolean> }) => {
  const { setLoading } = useLoading();
  useEffect(() => {
    const progress = setProgress((v) => setLoading(v));
    requestAnimationFrame(() => {
      progress.loaded().then(() => {
        // wait for the overlay to fade out, THEN play the intro in full view
        setTimeout(() => {
          introRef.current = true;
          initialFX();
        }, 720);
      });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return null;
};

const Scene3D = () => {
  const introRef = useRef(false);
  const count = window.innerWidth < 768 ? 3800 : 7500;
  return (
    <div className="scene3d-container" data-cursor="disable">
      <Canvas dpr={[1, 2]} camera={{ fov: 35, position: [0, 0, 9] }} gl={{ antialias: true, alpha: true }}>
        <Rig introRef={introRef} count={count} />
        <ReadyGate introRef={introRef} />
        <EffectComposer>
          <Bloom
            intensity={0.8}
            luminanceThreshold={0.12}
            luminanceSmoothing={0.5}
            mipmapBlur
            radius={0.7}
          />
        </EffectComposer>
      </Canvas>
    </div>
  );
};

export default Scene3D;
