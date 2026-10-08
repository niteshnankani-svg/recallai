import { useMemo, useRef } from "react";
import { useTexture } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { Plane } from "./PersonImage";

// Particles sampled from the person photo's opaque pixels (state A, photo colors)
// that rise and morph into the glowing neural network (state B, teal) during the
// dive — "dissolve into numbers and lights".
const TEAL = new THREE.Color("#2dd4bf");

const vertexShader = /* glsl */ `
  uniform float uDive;
  uniform float uTime;
  uniform float uSize;
  attribute vec3 aTarget;
  attribute vec3 aColor;
  attribute float aRand;
  varying float vMix;
  varying vec3 vColor;
  void main() {
    float m = smoothstep(0.10, 1.0, uDive);
    vMix = m;
    vColor = aColor;
    vec3 pos = mix(position, aTarget, m);
    // ascend + scatter as it dissolves
    float rise = smoothstep(0.0, 0.6, uDive) * (1.0 - m);
    pos.y += rise * (1.5 + aRand * 2.5);
    float amp = 0.03 + m * 0.07 + rise * 0.3;
    pos.x += sin(uTime * 0.9 + aRand * 20.0) * amp;
    pos.y += cos(uTime * 0.8 + aRand * 15.0) * amp * 0.6;
    pos.z += sin(uTime * 1.0 + aRand * 10.0) * amp;
    vec4 mv = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = uSize * (0.7 + aRand * 0.7) * (1.0 + m * 0.4) * (9.0 / -mv.z);
  }
`;
const fragmentShader = /* glsl */ `
  uniform vec3 uTeal;
  uniform float uOpacity;
  varying float vMix;
  varying vec3 vColor;
  void main() {
    vec2 c = gl_PointCoord - 0.5;
    float dd = length(c);
    if (dd > 0.5) discard;
    float a = smoothstep(0.5, 0.0, dd) * 0.72 * uOpacity;
    vec3 col = mix(vColor, uTeal, vMix) * (0.85 + vMix * 0.8);
    gl_FragColor = vec4(col, a);
  }
`;

function netPoint(): THREE.Vector3 {
  const counts = [3, 5, 6, 5, 3];
  const xs = [-3.4, -1.7, 0, 1.7, 3.4];
  const node = (li: number) => {
    const n = counts[li];
    const k = Math.floor(Math.random() * n);
    const y = n === 1 ? 0 : (k / (n - 1) - 0.5) * 5.2;
    return new THREE.Vector3(xs[li], y, 0);
  };
  if (Math.random() < 0.45) {
    const li = Math.floor(Math.random() * (counts.length - 1));
    const t = node(li).lerp(node(li + 1), Math.random());
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

export default function ImageParticles({
  diveProgress,
  count,
  plane,
}: {
  diveProgress: React.MutableRefObject<number>;
  count: number;
  plane: Plane;
}) {
  const tex = useTexture("/person.png");
  const matRef = useRef<THREE.ShaderMaterial>(null);

  const { positions, targets, colors, rands } = useMemo(() => {
    const imgEl = tex.image as HTMLImageElement;
    const W = imgEl.naturalWidth || imgEl.width;
    const H = imgEl.naturalHeight || imgEl.height;
    const cv = document.createElement("canvas");
    cv.width = W; cv.height = H;
    const ctx = cv.getContext("2d")!;
    ctx.drawImage(imgEl, 0, 0, W, H);
    const data = ctx.getImageData(0, 0, W, H).data;
    // list of opaque pixel indices
    const opaque: number[] = [];
    for (let i = 0; i < W * H; i++) if (data[i * 4 + 3] > 40) opaque.push(i);

    const positions = new Float32Array(count * 3);
    const targets = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const rands = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      const pi = opaque[(Math.random() * opaque.length) | 0];
      const x = pi % W, y = (pi / W) | 0;
      const u = x / W - 0.5, v = 0.5 - y / H;
      positions[i * 3] = plane.px + u * plane.w;
      positions[i * 3 + 1] = plane.py + v * plane.h;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 0.06;
      colors[i * 3] = data[pi * 4] / 255;
      colors[i * 3 + 1] = data[pi * 4 + 1] / 255;
      colors[i * 3 + 2] = data[pi * 4 + 2] / 255;
      const t = netPoint();
      targets[i * 3] = t.x; targets[i * 3 + 1] = t.y; targets[i * 3 + 2] = t.z;
      rands[i] = Math.random();
    }
    return { positions, targets, colors, rands };
  }, [tex, count, plane]);

  const uniforms = useMemo(
    () => ({
      uDive: { value: 0 },
      uTime: { value: 0 },
      uOpacity: { value: 0 },
      uSize: { value: window.innerWidth < 1024 ? 2.1 : 2.5 },
      uTeal: { value: TEAL.clone() },
    }),
    []
  );

  useFrame((_, delta) => {
    if (!matRef.current) return;
    const d = diveProgress.current;
    uniforms.uTime.value += Math.min(delta, 0.05);
    uniforms.uDive.value = d;
    uniforms.uOpacity.value = THREE.MathUtils.clamp(d / 0.2, 0, 1);
  });

  return (
    <points frustumCulled={false}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={count} array={positions} itemSize={3} />
        <bufferAttribute attach="attributes-aTarget" count={count} array={targets} itemSize={3} />
        <bufferAttribute attach="attributes-aColor" count={count} array={colors} itemSize={3} />
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
