import { useEffect, useRef } from "react";
import { useTexture } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

export interface Plane {
  px: number;
  py: number;
  w: number;
  h: number;
}
export const PERSON_PLANE: Plane = { px: 2.3, py: -0.1, w: 3.9, h: 5.3 };

// The business-casual photo (background removed) shown as a flat plane in the
// hero. Subtle cursor parallax at rest; fades out as the dive dissolves it into
// particles.
export default function PersonImage({
  diveProgress,
  onDive,
  plane,
}: {
  diveProgress: React.MutableRefObject<number>;
  onDive: () => void;
  plane: Plane;
}) {
  const mesh = useRef<THREE.Mesh>(null);
  const matRef = useRef<THREE.MeshBasicMaterial>(null);
  const mouse = useRef({ x: 0, y: 0 });
  const tex = useTexture("/person.png");
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      mouse.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouse.current.y = (e.clientY / window.innerHeight) * 2 - 1;
    };
    document.addEventListener("mousemove", onMove);
    return () => document.removeEventListener("mousemove", onMove);
  }, []);

  useFrame(() => {
    if (!mesh.current || !matRef.current) return;
    const d = diveProgress.current;
    const k = 1 - d;
    mesh.current.rotation.y += (mouse.current.x * 0.14 * k - mesh.current.rotation.y) * 0.08;
    mesh.current.rotation.x += (-mouse.current.y * 0.08 * k - mesh.current.rotation.x) * 0.08;
    const op = 1 - THREE.MathUtils.clamp((d - 0.05) / 0.4, 0, 1);
    matRef.current.opacity = op;
    mesh.current.visible = op > 0.01;
  });

  return (
    <mesh
      ref={mesh}
      position={[plane.px, plane.py, 0]}
      onClick={(e) => {
        e.stopPropagation();
        onDive();
      }}
    >
      <planeGeometry args={[plane.w, plane.h]} />
      <meshBasicMaterial
        ref={matRef}
        map={tex}
        transparent
        alphaTest={0.04}
        toneMapped={false}
        depthWrite={false}
      />
    </mesh>
  );
}

useTexture.preload("/person.png");
