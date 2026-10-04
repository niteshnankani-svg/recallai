import { useEffect, useRef } from "react";
import { useGLTF, useAnimations } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

// The visible 3D person in the hero. Idles, waves periodically, looks toward the
// cursor, and is clickable to trigger the "dive". As the dive progresses it
// dissolves (materials fade) while PersonParticles takes over the silhouette.
const MODEL = "/models/RobotExpressive.glb";

export const PERSON_TRANSFORM = {
  position: new THREE.Vector3(1.9, -2.2, 0),
  scale: 0.5,
};

export default function Person({
  diveProgress,
  onDive,
  transform,
}: {
  diveProgress: React.MutableRefObject<number>;
  onDive: () => void;
  transform: { position: THREE.Vector3; scale: number };
}) {
  const group = useRef<THREE.Group>(null);
  const { scene, animations } = useGLTF(MODEL);
  const { actions } = useAnimations(animations, group);
  const mouse = useRef({ x: 0, y: 0 });
  const mats = useRef<THREE.Material[]>([]);

  useEffect(() => {
    scene.traverse((o) => {
      const mesh = o as THREE.Mesh;
      if (mesh.isMesh) {
        mesh.frustumCulled = false;
        const m = mesh.material;
        (Array.isArray(m) ? m : [m]).forEach((mm) => {
          mm.transparent = true;
          mats.current.push(mm);
        });
      }
    });

    actions["Idle"]?.reset().fadeIn(0.5).play();

    const wave = () => {
      if (diveProgress.current > 0.05) return;
      const w = actions["Wave"];
      if (!w) return;
      w.reset().setLoop(THREE.LoopOnce, 1).play();
      w.clampWhenFinished = true;
      window.setTimeout(() => actions["Idle"]?.reset().fadeIn(0.4).play(), 2600);
    };
    const first = window.setTimeout(wave, 1800);
    const id = window.setInterval(wave, 8000);

    const onMove = (e: MouseEvent) => {
      mouse.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouse.current.y = (e.clientY / window.innerHeight) * 2 - 1;
    };
    document.addEventListener("mousemove", onMove);
    return () => {
      clearTimeout(first);
      clearInterval(id);
      document.removeEventListener("mousemove", onMove);
    };
  }, [actions, scene, diveProgress]);

  useFrame(() => {
    if (!group.current) return;
    const d = diveProgress.current;
    const targetY = mouse.current.x * 0.5 * (1 - d);
    group.current.rotation.y += (targetY - group.current.rotation.y) * 0.08;
    // dissolve: fade the mesh out as the dive starts
    const op = 1 - THREE.MathUtils.clamp((d - 0.06) / 0.42, 0, 1);
    for (const m of mats.current) (m as THREE.Material).opacity = op;
    group.current.visible = op > 0.01;
  });

  return (
    <group
      ref={group}
      position={transform.position}
      scale={transform.scale}
      onClick={(e) => {
        e.stopPropagation();
        onDive();
      }}
    >
      <primitive object={scene} />
    </group>
  );
}

useGLTF.preload(MODEL);
