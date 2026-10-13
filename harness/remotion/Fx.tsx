// Lớp chuyển động vẽ bằng code, phủ lên ảnh tĩnh: mưa, ánh lửa, tàn lửa, hạt phim (không tốn credit AI).
import React from "react";
import { AbsoluteFill, interpolate, random, useCurrentFrame, useVideoConfig } from "remotion";
import { Fx } from "./types";

type Light = { x: number; y: number; radius: number };

const smoothNoise = (seed: string, t: number) => {
  const i = Math.floor(t);
  const f = t - i;
  const a = random(`${seed}-${i}`);
  const b = random(`${seed}-${i + 1}`);
  return a + (b - a) * (f * f * (3 - 2 * f));
};
const flicker = (seed: string, frame: number) =>
  0.55 * smoothNoise(seed + "s", frame / 9) + 0.45 * smoothNoise(seed + "f", frame / 2.5);

const FireLight: React.FC<{ light: Light; index: number }> = ({ light, index }) => {
  const frame = useCurrentFrame();
  const { width } = useVideoConfig();
  const k = flicker(`fire-${index}`, frame);
  const r = (light.radius / 100) * width;
  return (
    <>
      <AbsoluteFill
        style={{
          background: `radial-gradient(circle at ${light.x}% ${light.y}%, rgba(255,150,60,${0.1 + 0.12 * k}) 0%, rgba(255,120,40,0) 55%)`,
          mixBlendMode: "screen",
        }}
      />
      <div
        style={{
          position: "absolute",
          left: `${light.x}%`,
          top: `${light.y}%`,
          width: r * 2,
          height: r * 2,
          marginLeft: -r,
          marginTop: -r,
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(255,214,140,0.85) 0%, rgba(255,150,50,0.45) 22%, rgba(255,100,20,0.12) 48%, rgba(255,90,20,0) 70%)",
          mixBlendMode: "screen",
          opacity: 0.45 + 0.45 * k,
          scale: String(0.92 + 0.12 * k),
        }}
      />
    </>
  );
};

type Drop = { x: number; y: number; len: number; speed: number; w: number; o: number };
const makeDrops = (count: number, layer: string, near: boolean): Drop[] =>
  new Array(count).fill(true).map((_, i) => ({
    x: random(`${layer}-x-${i}`),
    y: random(`${layer}-y-${i}`),
    len: near ? 70 + random(`${layer}-l-${i}`) * 60 : 28 + random(`${layer}-l-${i}`) * 26,
    speed: near ? 62 + random(`${layer}-s-${i}`) * 20 : 34 + random(`${layer}-s-${i}`) * 12,
    w: near ? 1.6 + random(`${layer}-w-${i}`) * 1.2 : 0.8 + random(`${layer}-w-${i}`) * 0.6,
    o: near ? 0.22 + random(`${layer}-o-${i}`) * 0.25 : 0.12 + random(`${layer}-o-${i}`) * 0.18,
  }));

const RainLayer: React.FC<{ drops: Drop[]; angle: number; color: string; opacityScale: number }> = ({
  drops,
  angle,
  color,
  opacityScale,
}) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const rad = (angle * Math.PI) / 180;
  const dx = Math.sin(rad);
  const dy = Math.cos(rad);
  const spanY = height + 200;
  const spanX = width + height * Math.abs(dx) + 200;
  return (
    <svg width={width} height={height} style={{ position: "absolute", inset: 0 }} viewBox={`0 0 ${width} ${height}`}>
      {drops.map((d, i) => {
        const travel = frame * d.speed;
        const y = ((d.y * spanY + travel * dy) % spanY) - 100;
        const x = ((((d.x * spanX - travel * dx) % spanX) + spanX) % spanX) - 100;
        return (
          <line
            key={i}
            x1={x}
            y1={y}
            x2={x - d.len * dx}
            y2={y + d.len * dy}
            stroke={color}
            strokeWidth={d.w}
            strokeLinecap="round"
            opacity={d.o * opacityScale}
          />
        );
      })}
    </svg>
  );
};

const Rain: React.FC<{ amount: number; angle: number; lights: Light[] }> = ({ amount, angle, lights }) => {
  const far = React.useMemo(() => makeDrops(Math.round(260 * amount), "far", false), [amount]);
  const near = React.useMemo(() => makeDrops(Math.round(70 * amount), "near", true), [amount]);
  const mask = lights
    .map((l) => `radial-gradient(circle at ${l.x}% ${l.y}%, black 0%, transparent ${l.radius * 1.6}%)`)
    .join(", ");
  return (
    <AbsoluteFill>
      <RainLayer drops={far} angle={angle} color="#c8d6ea" opacityScale={1} />
      <RainLayer drops={near} angle={angle + 2} color="#dfe8f5" opacityScale={1} />
      {lights.length > 0 ? (
        <AbsoluteFill style={{ maskImage: mask, WebkitMaskImage: mask }}>
          <RainLayer drops={far} angle={angle} color="#ffc27a" opacityScale={2.6} />
          <RainLayer drops={near} angle={angle + 2} color="#ffd59a" opacityScale={2.2} />
        </AbsoluteFill>
      ) : null}
    </AbsoluteFill>
  );
};

const Embers: React.FC<{ light: Light; index: number }> = ({ light, index }) => {
  const frame = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();
  const life = 2.2 * fps;
  return (
    <AbsoluteFill style={{ mixBlendMode: "screen" }}>
      {new Array(22).fill(true).map((_, i) => {
        const seed = `ember-${index}-${i}`;
        const t = ((frame + random(seed + "o") * life) % life) / life;
        const startX = (light.x / 100) * width + (random(seed + "x") - 0.5) * width * 0.02;
        const startY = (light.y / 100) * height;
        const rise = t * height * (0.12 + random(seed + "r") * 0.12);
        const drift = Math.sin(t * 6 + random(seed + "p") * 6) * 14 + t * (random(seed + "d") - 0.3) * 60;
        const size = 1.5 + random(seed + "s") * 2.5;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: startX + drift,
              top: startY - rise,
              width: size,
              height: size,
              borderRadius: "50%",
              background: "#ffcf7a",
              boxShadow: `0 0 ${size * 3}px ${size}px rgba(255,140,40,0.7)`,
              opacity: interpolate(t, [0, 0.1, 0.7, 1], [0, 1, 0.6, 0]),
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};

const Grain: React.FC<{ amount: number }> = ({ amount }) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  return (
    <svg width={width} height={height} style={{ position: "absolute", inset: 0, opacity: amount, mixBlendMode: "overlay" }}>
      <filter id="grain">
        <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves={2} seed={frame % 12} />
        <feColorMatrix type="saturate" values="0" />
      </filter>
      <rect width="100%" height="100%" filter="url(#grain)" />
    </svg>
  );
};

export const FxLayer: React.FC<{ fx: Fx }> = ({ fx }) => {
  const lights: Light[] = (fx.fire ?? []).map((l) => ({ x: l.x, y: l.y, radius: l.radius ?? 14 }));
  return (
    <AbsoluteFill>
      {lights.map((l, i) => (
        <FireLight key={`l${i}`} light={l} index={i} />
      ))}
      {fx.embers ? lights.map((l, i) => <Embers key={`e${i}`} light={l} index={i} />) : null}
      {fx.rain ? <Rain amount={fx.rain} angle={fx.rainAngle ?? 6} lights={lights} /> : null}
      {fx.grain ? <Grain amount={fx.grain} /> : null}
    </AbsoluteFill>
  );
};
