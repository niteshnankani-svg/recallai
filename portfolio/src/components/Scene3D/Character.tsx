import { useEffect, useRef, MutableRefObject } from "react";
import { useGLTF, useAnimations } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

// Rigged human character (Mixamo "Vanguard", shipped as three.js' Soldier.glb —
// Idle / Walk / Run clips). Plays an idle loop and turns toward the cursor, the
// same "subtle 3D reactivity" idea as the reference site's head-tracking.
const MODEL = "/models/Soldier.glb";

const Character = ({
  mouse,
}: {
  mouse: MutableRefObject<{ x: number; y: number }>;
}) => {
  const group = useRef<THREE.Group>(null);
  const turn = useRef<THREE.Group>(null);
  const { scene, animations } = useGLTF(MODEL);
  const { actions } = useAnimations(animations, group);

  useEffect(() => {
    scene.traverse((o: THREE.Object3D) => {
      if ((o as THREE.Mesh).isMesh) {
        o.castShadow = true;
        o.frustumCulled = false;
      }
    });
    // Auto-fit: scale to a known height and centre horizontally so the whole
    // figure is framed and it spins about its own axis.
    const box = new THREE.Box3().setFromObject(scene);
    const size = new THREE.Vector3();
    const center = new THREE.Vector3();
    box.getSize(size);
    box.getCenter(center);
    const s = 3.4 / size.y;
    scene.scale.setScalar(s);
    scene.position.x = -center.x * s;
    scene.position.z = -center.z * s;
    scene.position.y = -box.min.y * s; // feet on the group origin (y=0)

    const idle = actions["Idle"];
    idle?.reset().fadeIn(0.6).play();
    return () => {
      idle?.fadeOut(0.3);
    };
  }, [actions, scene]);

  useFrame((_, delta) => {
    if (!turn.current) return;
    const k = Math.min(1, delta * 2.5);
    const targetY = mouse.current.x * 0.55;
    const targetX = -mouse.current.y * 0.12;
    turn.current.rotation.y += (targetY - turn.current.rotation.y) * k;
    turn.current.rotation.x += (targetX - turn.current.rotation.x) * k;
  });

  return (
    <group ref={group} position={[0, -1.75, 0]}>
      <group ref={turn}>
        <primitive object={scene} />
      </group>
    </group>
  );
};

useGLTF.preload(MODEL);
export default Character;
