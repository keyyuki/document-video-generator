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

  if (overlay.kind === "quote") {
    const o = fadeInOut(frame, frames, fps);
    const words = overlay.text.split(/\s+/);
    const step = Math.max(2, (frames * 0.55) / words.length);
    const size = overlay.text.length > 150 ? 46 : overlay.text.length > 100 ? 54 : 64;
    return (
      <AbsoluteFill
        style={{ justifyContent: "center", alignItems: "center", backgroundColor: `rgba(6,4,3,${0.66 * o})`, fontFamily: font, textShadow }}
      >
        <div style={{ opacity: o, width: 1380, textAlign: "center" }}>
          <div style={{ color: brand.gold, fontSize: 150, lineHeight: 0.6, height: 70, fontWeight: 700 }}>“</div>
          <div style={{ color: brand.paper, fontSize: size, fontStyle: "italic", lineHeight: 1.42 }}>
            {words.map((w, i) => (
              <span key={i} style={{ opacity: interpolate(frame, [i * step, i * step + 6], [0, 1], clamp) }}>
                {w}{" "}
              </span>
            ))}
          </div>
          {overlay.source ? (
            <div
              style={{
                marginTop: 34,
                color: brand.gold,
                fontSize: 32,
                letterSpacing: 6,
                opacity: interpolate(frame, [words.length * step, words.length * step + 10], [0, 1], clamp),
              }}
            >
              — {overlay.source}
            </div>
          ) : null}
        </div>
      </AbsoluteFill>
    );
  }

  if (overlay.kind === "timeline") {
    const o = fadeInOut(frame, frames, fps);
    const n = overlay.items.length;
    const x0 = 270, x1 = 1650, y = 560;
    const lineP = interpolate(frame, [0.2 * fps, frames * 0.72], [0, 1], { ...clamp, easing: Easing.inOut(Easing.sin) });
    return (
      <AbsoluteFill style={{ backgroundColor: `rgba(6,4,3,${0.62 * o})`, fontFamily: font, textShadow }}>
        {overlay.title ? (
          <div style={{ position: "absolute", top: 150, width: "100%", textAlign: "center", opacity: o, color: brand.gold, fontSize: 40, letterSpacing: 12 }}>
            {overlay.title}
          </div>
        ) : null}
        <div style={{ position: "absolute", left: x0, top: y, width: (x1 - x0) * lineP, height: 4, background: brand.gold, opacity: o, borderRadius: 2 }} />
        {overlay.items.map((it, i) => {
          const x = n === 1 ? (x0 + x1) / 2 : x0 + ((x1 - x0) * i) / (n - 1);
          const at = (i / Math.max(1, n - 1)) * frames * 0.72 + 0.2 * fps;
          const p = interpolate(frame, [at, at + 9], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
          return (
            <div key={i} style={{ opacity: o * p }}>
              <div style={{ position: "absolute", left: x - 14, top: y - 12, width: 28, height: 28, borderRadius: "50%", background: brand.red, border: `4px solid ${brand.paper}`, scale: String(0.4 + 0.6 * p) }} />
              <div style={{ position: "absolute", left: x - 230, top: y - 120, width: 460, textAlign: "center", color: brand.gold, fontSize: 54, fontWeight: 700, letterSpacing: 2 }}>{it.date}</div>
              <div style={{ position: "absolute", left: x - 230, top: y + 46, width: 460, textAlign: "center", color: brand.paper, fontSize: 38, lineHeight: 1.3 }}>{it.text}</div>
            </div>
          );
        })}
      </AbsoluteFill>
    );
  }

  if (overlay.kind === "route") {
    const o = fadeInOut(frame, frames, fps);
    const pts = overlay.points;
    const W = 1920, H = 1080;
    const P = pts.map((q) => [(q.x / 100) * W, (q.y / 100) * H]);
    const d = P.map((q, i) => `${i ? "L" : "M"}${q[0].toFixed(1)} ${q[1].toFixed(1)}`).join(" ");
    const prog = interpolate(frame, [0.4 * fps, frames * 0.8], [0, 1], { ...clamp, easing: Easing.inOut(Easing.sin) });
    // độ dài từng đoạn để biết mốc hiện mỗi điểm
    const seg = P.slice(1).map((q, i) => Math.hypot(q[0] - P[i][0], q[1] - P[i][1]));
    const total = seg.reduce((a, b) => a + b, 0) || 1;
    let acc = 0;
    const marks = [0, ...seg.map((l) => (acc += l) / total)];
    return (
      <AbsoluteFill style={{ fontFamily: font, textShadow }}>
        <AbsoluteFill style={{ backgroundColor: `rgba(0,0,0,${0.28 * o})` }} />
        <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", inset: 0, opacity: o }}>
          <defs>
            <mask id="routeMask">
              <path d={d} fill="none" stroke="#fff" strokeWidth={30} pathLength={1} strokeDasharray={1} strokeDashoffset={1 - prog} strokeLinecap="round" strokeLinejoin="round" />
            </mask>
          </defs>
          <path d={d} fill="none" stroke="#7a1712" strokeWidth={9} strokeDasharray="22 14" strokeLinecap="round" strokeLinejoin="round" mask="url(#routeMask)" />
          <path d={d} fill="none" stroke={brand.red} strokeWidth={5} strokeDasharray="22 14" strokeLinecap="round" strokeLinejoin="round" mask="url(#routeMask)" />
        </svg>
        {pts.map((q, i) => {
          const p = interpolate(prog, [marks[i] - 0.01, marks[i] + 0.04], [0, 1], clamp);
          const right = q.x < 62;
          return (
            <div key={i} style={{ opacity: o * p }}>
              <div style={{ position: "absolute", left: P[i][0] - 17, top: P[i][1] - 17, width: 34, height: 34, borderRadius: "50%", background: i === pts.length - 1 ? brand.red : brand.gold, border: "5px solid #1a120b", scale: String(0.5 + 0.5 * p), boxShadow: "0 0 18px rgba(0,0,0,0.7)" }} />
              <div
                style={{
                  position: "absolute",
                  top: P[i][1] - 30,
                  ...(right ? { left: P[i][0] + 30 } : { right: W - P[i][0] + 30 }),
                  color: brand.paper,
                  fontSize: 42,
                  fontWeight: 700,
                  padding: "4px 14px",
                  background: "rgba(14,9,6,0.62)",
                  borderLeft: `4px solid ${brand.gold}`,
                  whiteSpace: "nowrap",
                }}
              >
                {q.label}
              </div>
            </div>
          );
        })}
        {overlay.title ? (
          <div style={{ position: "absolute", top: 60, left: 90, opacity: o, color: brand.gold, fontSize: 36, letterSpacing: 10, textShadow }}>{overlay.title}</div>
        ) : null}
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
