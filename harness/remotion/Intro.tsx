// Đoạn mở đầu thương hiệu: trang giấy hồ sơ, tên vụ án được viết dần, rồi đóng dấu.
// Dữ liệu (số hồ sơ, tên vụ án, mốc thời gian) do `hs render` tính từ lời thoại; không có gì riêng của một tập ở đây.
import React from "react";
import { AbsoluteFill, Easing, Img, interpolate, random, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { Brand, IntroData } from "./types";

const INK = "#1b1d2c";
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

// Hiện dần từ trái sang phải như nét bút (mép mềm).
const Written: React.FC<{ from: number; to: number; children: React.ReactNode; style?: React.CSSProperties }> = ({
  from,
  to,
  children,
  style,
}) => {
  const frame = useCurrentFrame();
  const p = interpolate(frame, [from, Math.max(from + 1, to)], [0, 1], { ...clamp, easing: Easing.inOut(Easing.quad) });
  const edge = p * 112 - 12;
  const mask = `linear-gradient(90deg, #000 ${edge}%, transparent ${edge + 12}%)`;
  return (
    <div style={{ display: "inline-block", WebkitMaskImage: mask, maskImage: mask, opacity: p > 0 ? 1 : 0, ...style }}>{children}</div>
  );
};

// Tên dài thì chia dòng và thu nhỏ chữ cho vừa trang giấy.
const layoutTitle = (title: string) => {
  const words = title.split(/\s+/);
  if (title.length <= 15) return { lines: [title], size: 190 };
  if (title.length <= 24) return { lines: [title], size: 140 };
  const lines: string[] = [];
  let cur = "";
  for (const w of words) {
    if ((cur + " " + w).trim().length > 20 && cur) {
      lines.push(cur.trim());
      cur = w;
    } else cur = (cur + " " + w).trim();
  }
  if (cur) lines.push(cur);
  return { lines, size: lines.length > 2 ? 96 : 112 };
};

const Dust: React.FC = () => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  return (
    <AbsoluteFill style={{ mixBlendMode: "screen", pointerEvents: "none" }}>
      {new Array(34).fill(true).map((_, i) => {
        const sp = 0.12 + random(`d-s-${i}`) * 0.3;
        const x = ((random(`d-x-${i}`) * width + Math.sin(frame / 60 + i) * 24 + frame * sp * 0.4) % width + width) % width;
        const y = (((random(`d-y-${i}`) * height - frame * sp) % height) + height) % height;
        const size = 1.2 + random(`d-z-${i}`) * 2.6;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: x,
              top: y,
              width: size,
              height: size,
              borderRadius: "50%",
              background: "#ffe2a8",
              opacity: 0.12 + random(`d-o-${i}`) * 0.3,
              filter: "blur(0.6px)",
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};

export const IntroScene: React.FC<{ data: IntroData; brand: Brand; frames: number }> = ({ data, brand, frames }) => {
  const frame = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();
  const t = data.t;

  // Máy quay đẩy chậm vào trang giấy; khi đóng dấu thì rung nhẹ.
  const push = interpolate(frame, [0, frames], [1.0, 1.07], { ...clamp, easing: Easing.out(Easing.quad) });
  const since = frame - t.stamp;
  const shakeAmp = since >= 0 ? 11 * Math.exp(-since / 4) : 0;
  const shake = shakeAmp * Math.sin(since * 2.4);
  const shakeY = shakeAmp * 0.6 * Math.cos(since * 3.1);
  const flash = since >= 0 && since < 4 ? 0.1 * (1 - since / 4) : 0;

  const brandOp = interpolate(frame, [t.brand, t.brand + 0.7 * fps], [0, 0.85], clamp);
  // Tên series hiện lớn ở giữa trang, rồi thu nhỏ lên đầu trang khi bắt đầu nói đến số hồ sơ.
  const bp = interpolate(frame, [t.label - 8, t.label + 14], [0, 1], { ...clamp, easing: Easing.inOut(Easing.cubic) });
  const brandTop = 44 + (11.5 - 44) * bp;
  const brandSize = 66 + (27 - 66) * bp;
  const brandSpacing = 0.3 + 0.2 * bp;
  const labelOp = interpolate(frame, [t.label, t.label + 4], [0, 1], clamp);

  const { lines, size } = layoutTitle(data.title);
  const titleDur = Math.max(1, t.titleTo - t.titleFrom);
  const perLine = titleDur / lines.length;

  // Nét gạch chân vẽ sau khi viết xong tên.
  const ulP = interpolate(frame, [t.titleTo + 2, t.titleTo + 0.5 * fps], [0, 1], { ...clamp, easing: Easing.out(Easing.cubic) });

  // Dấu đóng: to rồi nện xuống, mực lem nhẹ.
  const sS = interpolate(frame, [t.stamp - 5, t.stamp, t.stamp + 4, t.stamp + 9], [2.3, 0.93, 1.03, 1], { ...clamp, easing: Easing.out(Easing.cubic) });
  const sO = interpolate(frame, [t.stamp - 5, t.stamp - 1], [0, 0.92], clamp);

  const flick = 0.5 + 0.5 * Math.sin(frame / 5.3) * Math.sin(frame / 11.7);

  return (
    <AbsoluteFill style={{ backgroundColor: "#0b0806" }}>
      <AbsoluteFill style={{ transform: `translate(${shake}px, ${shakeY}px) scale(${push})` }}>
        <Img src={staticFile(data.paper)} style={{ width: "100%", height: "100%", objectFit: "cover" }} />

        {/* Chữ trên trang giấy (đặt theo % khung hình, khớp với trang giấy trong PaperBase) */}
        <AbsoluteFill style={{ rotate: "-1.1deg", transformOrigin: "50% 50%" }}>
          <div
            style={{
              position: "absolute",
              left: "50%",
              top: `${brandTop}%`,
              transform: `translate(-50%, ${bp < 1 ? "-50%" : "0%"})`,
              opacity: brandOp,
              textAlign: "center",
              color: "#3b2a19",
              fontFamily: brand.font,
              fontWeight: 700,
              letterSpacing: `${brandSpacing}em`,
              fontSize: brandSize,
              whiteSpace: "nowrap",
              textShadow: "0 1px 0 rgba(255,246,222,0.5)",
            }}
          >
            {data.brandLine}
            <div style={{ margin: "14px auto 0", width: 380 + (1 - bp) * 420, height: 6, borderTop: "2px solid rgba(59,42,25,0.7)", borderBottom: "1px solid rgba(59,42,25,0.6)" }} />
          </div>

          <div
            style={{
              position: "absolute",
              left: "50%",
              top: "22%",
              transform: "translateX(-50%)",
              opacity: labelOp,
              textAlign: "center",
              whiteSpace: "nowrap",
            }}
          >
            <Written from={t.label} to={t.label + 0.7 * fps} style={{ fontFamily: brand.mono, fontSize: 46, letterSpacing: "0.16em", color: "#2a2018" }}>
              {data.label}
            </Written>
            {data.meta ? (
              <div style={{ fontFamily: brand.mono, fontSize: 29, letterSpacing: "0.06em", color: "rgba(42,32,24,0.78)", marginTop: 10 }}>
                <Written from={t.label + 0.4 * fps} to={t.label + 1.2 * fps}>{data.meta}</Written>
              </div>
            ) : null}
          </div>

          {/* Tên vụ án viết tay */}
          <div
            style={{
              position: "absolute",
              left: "50%",
              top: data.subtitle ? "37%" : "40%",
              transform: "translateX(-50%) rotate(-1.6deg)",
              textAlign: "center",
              whiteSpace: "nowrap",
              fontFamily: brand.hand,
              fontWeight: 700,
              color: INK,
              lineHeight: 1.02,
              textShadow: "0 0 1px rgba(27,29,44,0.6), 0 1px 2px rgba(27,29,44,0.25)",
            }}
          >
            {lines.map((ln, i) => (
              <div key={i} style={{ fontSize: size }}>
                <Written from={t.titleFrom + i * perLine} to={t.titleFrom + (i + 1) * perLine}>{ln}</Written>
              </div>
            ))}
            <svg width="760" height="34" viewBox="0 0 760 34" style={{ display: "block", margin: "6px auto 0" }}>
              <path
                d="M6 20 C 120 6, 230 30, 360 16 S 600 10, 754 18"
                fill="none"
                stroke={brand.red}
                strokeWidth={5}
                strokeLinecap="round"
                strokeDasharray={800}
                strokeDashoffset={800 * (1 - ulP)}
                opacity={0.85}
              />
            </svg>
            {data.subtitle ? (
              <div style={{ fontSize: 56, marginTop: 14, fontWeight: 700, color: "#34364a" }}>
                <Written from={t.subFrom} to={t.subTo}>{data.subtitle}</Written>
              </div>
            ) : null}
          </div>

          {/* Con dấu */}
          <div
            style={{
              position: "absolute",
              left: "60%",
              top: "77%",
              transform: `translate(-50%, -50%) rotate(-9deg) scale(${sS})`,
              opacity: sO,
              mixBlendMode: "multiply",
              filter: "url(#stampRough)",
            }}
          >
            <div
              style={{
                border: `9px double ${brand.red}`,
                padding: "14px 44px",
                color: brand.red,
                fontFamily: brand.font,
                fontWeight: 700,
                fontSize: 84,
                letterSpacing: "0.09em",
                whiteSpace: "nowrap",
                textAlign: "center",
                borderRadius: 6,
                background: "rgba(179,38,30,0.04)",
              }}
            >
              {data.stamp}
            </div>
          </div>
        </AbsoluteFill>
      </AbsoluteFill>

      {/* Ánh nến nhấp nháy + bụi bay */}
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse at 80% 8%, rgba(255,170,80,${0.16 + 0.12 * flick}) 0%, rgba(255,140,50,0) 55%)`,
          mixBlendMode: "screen",
        }}
      />
      <Dust />
      <AbsoluteFill style={{ background: "radial-gradient(ellipse at center, rgba(0,0,0,0) 52%, rgba(0,0,0,0.6) 100%)" }} />
      <AbsoluteFill style={{ backgroundColor: "#fff", opacity: flash, mixBlendMode: "overlay" }} />

      <svg width={0} height={0} style={{ position: "absolute" }}>
        <defs>
          <filter id="stampRough" x="-10%" y="-20%" width="120%" height="140%">
            <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves={2} seed={4} result="n" />
            <feColorMatrix in="n" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  9 0 0 0 -3.1" result="holes" />
            <feComposite in="SourceGraphic" in2="holes" operator="in" result="eroded" />
            <feTurbulence type="fractalNoise" baseFrequency="0.05" numOctaves={2} seed={9} result="w" />
            <feDisplacementMap in="eroded" in2="w" scale={4} xChannelSelector="R" yChannelSelector="G" />
          </filter>
        </defs>
      </svg>
    </AbsoluteFill>
  );
};
