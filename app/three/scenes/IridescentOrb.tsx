"use client";

import { useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

/**
 * IridescentOrb — el hero 3D principal de dovo.
 *
 * Sphere con surface displacement (simplex noise) + shader fresnel +
 * thin-film iridescence + palette swirl entre cyan / magenta / lime.
 *
 * Estética: Apple Vision Pro x Stripe — orb líquido que reacciona al cursor.
 * Adaptado de un componente de 21st.dev a R3F, con la paleta de roles dovo.
 */
export default function IridescentOrb({
  size = 1.5,
  speed = 1,
}: {
  size?: number;
  speed?: number;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const matRef = useRef<THREE.ShaderMaterial>(null);
  const { pointer, camera } = useThree();

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uMouse: { value: new THREE.Vector2(0, 0) },
      uCamPos: { value: new THREE.Vector3() },
      uAccentMike: { value: new THREE.Color("#6bf5ff") },
      uAccentAndy: { value: new THREE.Color("#ff6b9d") },
      uAccentLime: { value: new THREE.Color("#c8f135") },
    }),
    [],
  );

  useFrame((_, dt) => {
    if (matRef.current) {
      matRef.current.uniforms.uTime.value += dt * speed;
      matRef.current.uniforms.uMouse.value.set(pointer.x, pointer.y);
      matRef.current.uniforms.uCamPos.value.copy(camera.position);
    }
    if (meshRef.current) {
      const targetRotX = pointer.y * 0.4;
      const targetRotY = pointer.x * 0.6;
      meshRef.current.rotation.x += (targetRotX - meshRef.current.rotation.x) * 0.06;
      meshRef.current.rotation.y += (targetRotY - meshRef.current.rotation.y) * 0.06;
    }
  });

  return (
    <mesh ref={meshRef}>
      <icosahedronGeometry args={[size, 5]} />
      <shaderMaterial
        ref={matRef}
        uniforms={uniforms}
        transparent
        vertexShader={VERT}
        fragmentShader={FRAG}
      />
    </mesh>
  );
}

const VERT = /* glsl */ `
varying vec3 vPos;
varying vec3 vNormal;

uniform float uTime;

vec3 mod289(vec3 x){return x - floor(x * (1.0 / 289.0)) * 289.0;}
vec4 mod289(vec4 x){return x - floor(x * (1.0 / 289.0)) * 289.0;}
vec4 permute(vec4 x){return mod289(((x*34.0)+1.0)*x);}
vec4 taylorInvSqrt(vec4 r){return 1.79284291400159 - 0.85373472095314 * r;}
float snoise(vec3 v){
  const vec2  C = vec2(1.0/6.0, 1.0/3.0);
  const vec4  D = vec4(0.0, 0.5, 1.0, 2.0);
  vec3 i  = floor(v + dot(v, C.yyy));
  vec3 x0 =   v - i + dot(i, C.xxx);
  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min(g.xyz, l.zxy);
  vec3 i2 = max(g.xyz, l.zxy);
  vec3 x1 = x0 - i1 + C.xxx;
  vec3 x2 = x0 - i2 + 2.0*C.xxx;
  vec3 x3 = x0 - 1.0 + 3.0*C.xxx;
  i = mod289(i);
  vec4 p = permute(permute(permute(i.z + vec4(0.0,i1.z,i2.z,1.0))
        + i.y + vec4(0.0,i1.y,i2.y,1.0))
        + i.x + vec4(0.0,i1.x,i2.x,1.0));
  float n_ = 0.142857142857;
  vec3 ns = n_ * D.wyz - D.xzx;
  vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_);
  vec4 x = x_ *ns.x + ns.yyyy;
  vec4 y = y_ *ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);
  vec4 b0 = vec4(x.xy, y.xy);
  vec4 b1 = vec4(x.zw, y.zw);
  vec4 s0 = floor(b0)*2.0 + 1.0;
  vec4 s1 = floor(b1)*2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));
  vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
  vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;
  vec3 p0 = vec3(a0.xy,h.x);
  vec3 p1 = vec3(a1.xy,h.y);
  vec3 p2 = vec3(a1.zw,h.z);
  vec3 p3 = vec3(a0.zw,h.w);
  vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
  p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
  vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
  m = m * m;
  return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
}

void main() {
  vNormal = normalMatrix * normalize(normal);
  float t = uTime * 0.25;
  float n = snoise(normalize(position) * 1.6 + vec3(0.0, t, t*0.7));
  vec3 displaced = position + normal * (n * 0.18);
  vPos = (modelMatrix * vec4(displaced, 1.0)).xyz;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(displaced, 1.0);
}
`;

const FRAG = /* glsl */ `
precision highp float;

varying vec3 vPos;
varying vec3 vNormal;

uniform float uTime;
uniform vec2  uMouse;
uniform vec3  uCamPos;
uniform vec3  uAccentMike;
uniform vec3  uAccentAndy;
uniform vec3  uAccentLime;

float fresnel(vec3 n, vec3 v, float p) {
  return pow(1.0 - max(dot(normalize(n), normalize(v)), 0.0), p);
}

// Filmic tonemap (John Hable approx)
vec3 tonemap(vec3 c) {
  c = max(vec3(0.0), c - 0.004);
  return (c * (6.2 * c + 0.5)) / (c * (6.2 * c + 1.7) + 0.06);
}

vec3 palette(float k) {
  float e = smoothstep(0.0, 1.0, 0.5 + 0.5 * sin(k));
  float f = smoothstep(0.0, 1.0, 0.5 + 0.5 * cos(k * 0.7));
  return mix(mix(uAccentMike, uAccentAndy, e), uAccentLime, f * 0.6);
}

void main() {
  vec3 N = normalize(vNormal);
  vec3 V = normalize(uCamPos - vPos);

  float t = uTime * 0.35;

  // Moving lights — feel orgánico
  vec3 L1 = normalize(vec3(sin(t*0.9), 0.6, cos(t*0.7)));
  vec3 L2 = normalize(vec3(-cos(t*0.6), 0.2 + 0.3*sin(t*0.8), -sin(t*0.9)));
  vec3 L3 = normalize(vec3(0.0, 1.0, 0.2));

  float diff1 = max(dot(N, L1), 0.0);
  float diff2 = max(dot(N, L2), 0.0);
  float diff3 = max(dot(N, L3), 0.0);

  float spec1 = pow(max(dot(reflect(-L1, N), V), 0.0), 64.0);
  float spec2 = pow(max(dot(reflect(-L2, N), V), 0.0), 48.0);

  vec3 col = palette(t + N.x * 2.0 + N.y);
  vec3 base = col * (0.25 + 0.9 * (diff1 * 0.6 + diff2 * 0.3 + diff3 * 0.2));
  base += vec3(0.92, 0.95, 1.0) * (spec1 * 0.9 + spec2 * 0.6);

  // Fresnel rim — thin film iridescence
  float f = fresnel(N, V, 2.2);
  vec3 rim = mix(vec3(0.0), palette(t*1.3 + N.z*3.0), f);
  base += rim * 0.95;

  // Subtle transmission glow
  float trans = pow(1.0 - max(dot(N, V), 0.0), 3.0);
  base += palette(t*0.8) * trans * 0.28;

  base += vec3(0.05);
  gl_FragColor = vec4(tonemap(base), 0.96);
}
`;
