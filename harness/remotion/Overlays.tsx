// Chữ trên hình: con dấu, chú thích, tiêu đề giữa, thanh tên, danh sách, màn kết.
import React from "react";
import { AbsoluteFill, Easing, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { Brand, Overlay } from "./types";

const textShadow = "0 2px 18px rgba(0,0,0,0.85), 0 0 4px rgba(0,0,0,0.9)";
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const fadeInOut = (frame: number, total: number, fps: number) =>
  interpolate(frame, [0, 0.35 * fps, total - 0.35 * fps, total], [0, 1, 1, 0], clamp);

export const OverlayView: React.FC<{ overlay: Overlay; frames: number; brand: Brand; font: string }> = ({
  overlay,
  frames,
  brand,
  font,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  if (overlay.kind === "stamp") {
    const at = (overlay.at ?? 0.25) * fps;
    const color = overlay.color ?? brand.gold;
    const s = interpolate(frame, [at - 4, at, at + 5], [2.2, 0.94, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
    const o = interpolate(frame, [at - 4, at], [0, 1], clamp);
    return (
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", backgroundColor: `rgba(0,0,0,${0.35 * o})` }}>
        <div
          style={{
            scale: String(s),
            opacity: o * fadeInOut(frame, frames + 6, fps),
            rotate: "-4deg",
            border: `6px solid ${color}`,
            padding: "26px 60px",
            textAlign: "center",
            fontFamily: font,
            color,
            textShadow,
            boxShadow: "0 0 40px rgba(0,0,0,0.6)",
            backgroundColor: "rgba(10,8,6,0.35)",
          }}
        >
          <div style={{ fontSize: 112, fontWeight: 700, letterSpacing: 6, lineHeight: 1.05 }}>{overlay.title}</div>
          {overlay.subtitle ? (
            <div style={{ fontSize: 40, fontWeight: 500, letterSpacing: 10, marginTop: 10 }}>{overlay.subtitle}</div>
          ) : null}
        </div>
      </AbsoluteFill>
    );
  }

  if (overlay.kind === "caption") {
    const o = fadeInOut(frame, Math.min(frames, 3.2 * fps), fps);
    const slide = interpolate(frame, [0, 0.6 * fps], [-20, 0], { extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });
    return (
      <AbsoluteFill style={{ justifyContent: "flex-end", padding: "0 0 90px 110px" }}>
        <div
          style={{
            opacity: o,
            translate: `${slide}px 0px`,
            fontFamily: font,
            fontSize: 54,
            fontStyle: "italic",
            color: brand.paper,
            textShadow,
            borderLeft: `4px solid ${brand.gold}`,
            paddingLeft: 24,
          }}
        >
          {overlay.text}
        </div>
      </AbsoluteFill>
    );
  }

  if (overlay.kind === "center") {
    const o = fadeInOut(frame, frames, fps);
    return (
      <AbsoluteFill
        style={{
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: `rgba(0,0,0,${0.45 * o})`,
          fontFamily: font,
          textAlign: "center",
          textShadow,
        }}
      >
        <div
          style={{
            opacity: o,
            scale: String(interpolate(frame, [0, frames], [1.0, 1.05])),
            color: brand.paper,
            fontSize: 132,
            fontWeight: 700,
            letterSpacing: 8,
          }}
        >
          {overlay.title}
        </div>
        {overlay.subtitle ? (
          <div style={{ opacity: o, color: brand.gold, fontSize: 44, letterSpacing: 6, marginTop: 18, maxWidth: 1400 }}>
            {overlay.subtitle}
          </div>
        ) : null}
      </AbsoluteFill>
    );
  }

  if (overlay.kind === "lowerThird") {
    const total = Math.min(frames, (overlay.duration ?? 3.6) * fps);
    const o = fadeInOut(frame, total, fps);
    const slide = interpolate(frame, [0, 0.5 * fps], [-40, 0], { extrapolateRight: "clamp", easing: Easing.out(Easing.cubic) });
    return (
      <AbsoluteFill style={{ justifyContent: "flex-end", padding: "0 0 100px 110px" }}>
        <div style={{ opacity: o, translate: `${slide}px 0px`, fontFamily: font, textShadow }}>
          <div style={{ color: brand.gold, fontSize: 34, letterSpacing: 8, fontWeight: 700 }}>{overlay.label}</div>
          <div style={{ color: brand.paper, fontSize: 64, fontWeight: 600, marginTop: 6 }}>{overlay.text}</div>
        </div>
      </AbsoluteFill>
    );
  }

  if (overlay.kind === "list") {
    const o = fadeInOut(frame, frames, fps);
    return (
      <AbsoluteFill
        style={{
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: `rgba(0,0,0,${0.55 * o})`,
          fontFamily: font,
          textShadow,
        }}
      >
        <div style={{ opacity: o, color: brand.gold, fontSize: 40, letterSpacing: 10, marginBottom: 28 }}>{overlay.title}</div>
        {overlay.items.map((it, i) => (
          <div
            key={it}
            style={{
              opacity: o * interpolate(frame, [i * 6, i * 6 + 8], [0, 1], clamp),
              color: brand.paper,
              fontSize: 60,
              lineHeight: 1.45,
            }}
          >
            {it}
          </div>
        ))}
      </AbsoluteFill>
    );
  }

  // endCard
  const start = 1.2 * fps;
  const o = interpolate(frame, [start, start + 0.8 * fps, frames - 1.4 * fps, frames - 0.4 * fps], [0, 1, 1, 0], clamp);
  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", fontFamily: font, textAlign: "center", textShadow }}>
      <div style={{ opacity: o, color: brand.gold, fontSize: 38, letterSpacing: 10 }}>{overlay.label ?? "HỒ SƠ TIẾP THEO"}</div>
      <div style={{ opacity: o, color: brand.paper, fontSize: 110, fontWeight: 700, letterSpacing: 6, marginTop: 8 }}>
        {overlay.title}
      </div>
      {overlay.subtitle ? (
        <div style={{ opacity: o, color: brand.paper, fontSize: 50, fontStyle: "italic", marginTop: 10 }}>{overlay.subtitle}</div>
      ) : null}
    </AbsoluteFill>
  );
};
