import { useMemo, useRef } from "react";
import { useGLTF } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { MeshSurfaceSampler } from "three/examples/jsm/math/MeshSurfaceSampler.js";

// Particles sampled from the 3D person's surface (state A) that morph into a
// glowing neural network (state B) as the dive progresses — "human → AI".
const MODEL = "/models/Soldier.glb";
const PERSON_COLOR = new THREE.Color("#9fe6db");
const TEAL = new THREE.Color("#2dd4bf");

const vertexShader = /* glsl */ `
  uniform float uDive;
  uniform float uTime;
  uniform float uSize;
  attribute vec3 aTarget;
  attribute float aRand;
  varying float vMix;
  varying float vRand;
  void main() {
    float m = smoothstep(0.12, 1.0, uDive);
    vMix = m; vRand = aRand;
    vec3 pos = mix(position, aTarget, m);
    float t = uTime;
    float amp = 0.04 + m * 0.06;
    pos.x += sin(t * 0.8 + aRand * 20.0) * amp;
    pos.y += cos(t * 0.7 + aRand * 15.0) * amp;
    pos.z += sin(t * 0.9 + aRand * 10.0) * amp;
    vec4 mv = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = uSize * (0.7 + aRand * 0.6) * (9.0 / -mv.z);
  }
`;
const fragmentShader = /* glsl */ `
  uniform vec3 uColorA;
  uniform vec3 uColorB;
  uniform float uOpacity;
  varying float vMix;
  varying float vRand;
  void main() {
    vec2 c = gl_PointCoord - 0.5;
    float d = length(c);
    if (d > 0.5) discard;
    float a = smoothstep(0.5, 0.0, d) * 0.7 * uOpacity;
    vec3 col = mix(uColorA, uColorB, vMix) * (0.6 + vRand * 0.5);
    gl_FragColor = vec4(col, a);
  }
`;

function buildNetwork(): THREE.Vector3 {
  // layered graph; ~45% of points land on edges between layers
  const counts = [3, 5, 6, 5, 3];
  const xs = [-3.4, -1.7, 0, 1.7, 3.4];
  const node = (li: number) => {
    const c = counts[li];
    const k = Math.floor(Math.random() * c);
    const y = c === 1 ? 0 : (k / (c - 1) - 0.5) * 5.2;
    return new THREE.Vector3(xs[li], y, 0);
  };
  if (Math.random() < 0.45) {
    const li = Math.floor(Math.random() * (counts.length - 1));
    const a = node(li);
    const b = node(li + 1);
    const t = a.clone().lerp(b, Math.random());
    t.z += (Math.random() - 0.5) * 0.12;
    return t;
  }
  const v = node(Math.floor(Math.random() * counts.length));
  const r = 0.22 * Math.cbrt(Math.random());
  const th = Math.random() * Math.PI * 2;
  const ph = Math.acos(Math.random() * 2 - 1);
  v.x += r * Math.sin(ph) * Math.cos(th);
  v.y += r * Math.sin(ph) * Math.sin(th);
  v.z += r * Math.cos(ph);
  return v;
}

export default function PersonParticles({
  diveProgress,
  count,
  transform,
}: {
  diveProgress: React.MutableRefObject<number>;
  count: number;
  transform: { position: THREE.Vector3; scale: number; rotationY: number };
}) {
  const { scene } = useGLTF(MODEL);
  const matRef = useRef<THREE.ShaderMaterial>(null);

  const { positions, targets, rands } = useMemo(() => {
    // pick the densest mesh to sample
    scene.updateMatrixWorld(true);
    let mesh: THREE.Mesh | null = null;
    scene.traverse((o) => {
      const m = o as THREE.Mesh;
      if (m.isMesh && m.geometry?.attributes?.position) {
        if (!mesh || m.geometry.attributes.position.count > mesh.geometry.attributes.position.count) mesh = m;
      }
    });
    const positions = new Float32Array(count * 3);
    const targets = new Float32Array(count * 3);
    const rands = new Float32Array(count);
    const disp = new THREE.Matrix4().compose(
      transform.position.clone(),
      new THREE.Quaternion().setFromEuler(new THREE.Euler(0, transform.rotationY, 0)),
      new THREE.Vector3(transform.scale, transform.scale, transform.scale)
    );
    const tmp = new THREE.Vector3();
    if (mesh) {
      const sampler = new MeshSurfaceSampler(mesh).build();
      const world = (mesh as THREE.Mesh).matrixWorld;
      for (let i = 0; i < count; i++) {
        sampler.sample(tmp);
        tmp.applyMatrix4(world).applyMatrix4(disp);
        positions[i * 3] = tmp.x;
        positions[i * 3 + 1] = tmp.y;
        positions[i * 3 + 2] = tmp.z;
      }
    }
    for (let i = 0; i < count; i++) {
      rands[i] = Math.random();
      const t = buildNetwork();
      targets[i * 3] = t.x;
      targets[i * 3 + 1] = t.y;
      targets[i * 3 + 2] = t.z;
    }
    return { positions, targets, rands };
  }, [scene, count, transform]);

  const uniforms = useMemo(
    () => ({
      uDive: { value: 0 },
      uTime: { value: 0 },
      uOpacity: { value: 0 },
      uSize: { value: window.innerWidth < 1024 ? 2.3 : 2.7 },
      uColorA: { value: PERSON_COLOR.clone() },
      uColorB: { value: TEAL.clone() },
    }),
    []
  );

  useFrame((_, delta) => {
    if (!matRef.current) return;
    const d = diveProgress.current;
    uniforms.uTime.value += Math.min(delta, 0.05);
    uniforms.uDive.value = d;
    // particles fade in as the person dissolves, hold while networked
    uniforms.uOpacity.value = THREE.MathUtils.clamp(d / 0.22, 0, 1);
  });

  return (
    <points frustumCulled={false}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={count} array={positions} itemSize={3} />
        <bufferAttribute attach="attributes-aTarget" count={count} array={targets} itemSize={3} />
        <bufferAttribute attach="attributes-aRand" count={count} array={rands} itemSize={1} />
      </bufferGeometry>
      <shaderMaterial
        ref={matRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}
