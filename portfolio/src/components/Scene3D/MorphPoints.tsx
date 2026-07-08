import { useEffect, useMemo, useRef, MutableRefObject } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import gsap from "gsap";

// Hero object: a particle cloud that morphs as the user scrolls the hero.
//   progress 0 -> "folded garment"  (amber — apparel manufacturing)
//   progress 1 -> "neural network"  (teal  — AI engineering)
// This tells the career pivot visually in ~3 seconds. Pure geometry (no GLB) so
// it stays lightweight and hits 60fps.

const AMBER = new THREE.Color("#f7a83b");
const TEAL = new THREE.Color("#2dd4bf");

const vertexShader = /* glsl */ `
  uniform float uProgress;
  uniform float uTime;
  uniform float uSize;
  uniform float uReveal;
  attribute vec3 aTarget;
  attribute float aRand;
  varying float vMix;
  varying float vRand;

  void main() {
    vRand = aRand;
    float p = smoothstep(0.0, 1.0, uProgress);
    vMix = p;
    vec3 pos = mix(position, aTarget, p);

    // continuous flow so the cloud is always alive (not frozen at rest)
    float t = uTime;
    pos.x += sin(t * 0.8 + aRand * 20.0) * 0.09;
    pos.y += cos(t * 0.7 + aRand * 15.0) * 0.09;
    pos.z += sin(t * 0.9 + aRand * 10.0) * 0.07;
    // gentle swirl around the vertical axis
    float ang = sin(t * 0.25 + pos.y * 0.4) * 0.06;
    float s = sin(ang), c = cos(ang);
    pos.xz = mat2(c, -s, s, c) * pos.xz;

    // assemble-on-load: expand from a scattered shell into the shape
    vec3 scatter = normalize(vec3(
      sin(aRand * 91.7), cos(aRand * 47.3), sin(aRand * 63.1)
    )) * 9.0;
    pos = mix(scatter, pos, uReveal);

    // subtle global glow pulse
    float pulse = 0.85 + 0.15 * sin(uTime * 1.5 + aRand * 3.0);

    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mvPosition;
    gl_PointSize = uSize * (0.7 + aRand * 0.6) * pulse * (9.0 / -mvPosition.z);
  }
`;

const fragmentShader = /* glsl */ `
  uniform vec3 uColorA;
  uniform vec3 uColorB;
  varying float vMix;
  varying float vRand;

  void main() {
    vec2 c = gl_PointCoord - vec2(0.5);
    float d = length(c);
    if (d > 0.5) discard;
    float alpha = smoothstep(0.5, 0.0, d) * 0.6;
    vec3 color = mix(uColorA, uColorB, vMix);
    color *= 0.6 + vRand * 0.45;
    gl_FragColor = vec4(color, alpha);
  }
`;

/** Folded-garment silhouette: stacked draped rows with the sides folded in. */
function garmentPosition(u: number, v: number, rand: number): THREE.Vector3 {
  let x = u * 3.0;
  const y = v * 3.5;
  let z = Math.sin(u * Math.PI * 2.0 + v * 3.0) * 0.35 + Math.cos(v * 4.0) * 0.15;
  const edge = Math.abs(u);
  if (edge > 0.55) {
    const k = (edge - 0.55) / 0.45;
    x *= 1.0 - 0.65 * k;
    z += 0.6 * k;
  }
  z += (rand - 0.5) * 0.22;
  return new THREE.Vector3(x, y, z);
}

interface Net {
  layers: THREE.Vector3[][];
}
function buildNetwork(): Net {
  const counts = [3, 5, 6, 5, 3];
  const xs = [-3.4, -1.7, 0, 1.7, 3.4];
  return {
    layers: counts.map((n, li) => {
      const nodes: THREE.Vector3[] = [];
      const spread = 5.2;
      for (let i = 0; i < n; i++) {
        const y = n === 1 ? 0 : (i / (n - 1) - 0.5) * spread;
        nodes.push(new THREE.Vector3(xs[li], y, 0));
      }
      return nodes;
    }),
  };
}

const MorphPoints = ({
  progressRef,
}: {
  progressRef: MutableRefObject<number>;
}) => {
  const matRef = useRef<THREE.ShaderMaterial>(null);
  const count = window.innerWidth < 1024 ? 5000 : 7500;
  const net = useMemo(buildNetwork, []);

  const { positions, targets, rands } = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const targets = new Float32Array(count * 3);
    const rands = new Float32Array(count);
    const edgeShare = 0.42;

    for (let i = 0; i < count; i++) {
      const rand = Math.random();
      rands[i] = rand;

      const u = Math.random() * 2 - 1;
      const v = Math.random() * 2 - 1;
      const g = garmentPosition(u, v, rand);
      positions[i * 3] = g.x;
      positions[i * 3 + 1] = g.y;
      positions[i * 3 + 2] = g.z;

      let t: THREE.Vector3;
      if (Math.random() < edgeShare) {
        const li = Math.floor(Math.random() * (net.layers.length - 1));
        const a = net.layers[li][Math.floor(Math.random() * net.layers[li].length)];
        const b = net.layers[li + 1][Math.floor(Math.random() * net.layers[li + 1].length)];
        t = a.clone().lerp(b, Math.random());
        t.z += (Math.random() - 0.5) * 0.12;
      } else {
        const li = Math.floor(Math.random() * net.layers.length);
        const node = net.layers[li][Math.floor(Math.random() * net.layers[li].length)];
        t = node.clone();
        const r = 0.22 * Math.cbrt(Math.random());
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(Math.random() * 2 - 1);
        t.x += r * Math.sin(phi) * Math.cos(theta);
        t.y += r * Math.sin(phi) * Math.sin(theta);
        t.z += r * Math.cos(phi);
      }
      targets[i * 3] = t.x;
      targets[i * 3 + 1] = t.y;
      targets[i * 3 + 2] = t.z;
    }
    return { positions, targets, rands };
  }, [count, net]);

  const uniforms = useMemo(
    () => ({
      uProgress: { value: 0 },
      uTime: { value: 0 },
      uReveal: { value: 0 },
      uSize: { value: window.innerWidth < 1024 ? 2.4 : 2.8 },
      uColorA: { value: AMBER.clone() },
      uColorB: { value: TEAL.clone() },
    }),
    []
  );

  // assemble-on-load entrance
  useEffect(() => {
    const tween = gsap.to(uniforms.uReveal, {
      value: 1,
      duration: 1.8,
      ease: "power2.out",
      delay: 0.15,
    });
    return () => {
      tween.kill();
    };
  }, [uniforms]);

  useFrame((_, delta) => {
    if (!matRef.current) return;
    uniforms.uTime.value += delta;
    const target = progressRef.current;
    uniforms.uProgress.value += (target - uniforms.uProgress.value) * Math.min(1, delta * 6);
  });

  return (
    <points>
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
};

export default MorphPoints;
