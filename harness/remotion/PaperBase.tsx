// Nền trang giấy hồ sơ trên mặt bàn gỗ, vẽ bằng code. Dựng một lần thành ảnh (library/brand/paper.jpg) rồi dùng lại mọi tập.
// Muốn đổi sang ảnh vẽ bằng AI: thay file paper.jpg, giữ trang giấy nằm giữa khung (rộng ~56%, xem Intro.tsx).
import React from "react";
import { AbsoluteFill } from "remotion";

export const PaperBase: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: "#0e0907" }}>
      <svg width="100%" height="100%" viewBox="0 0 1920 1080" preserveAspectRatio="none" style={{ position: "absolute", inset: 0 }}>
        <defs>
          <filter id="wood" x="0" y="0" width="100%" height="100%">
            <feTurbulence type="fractalNoise" baseFrequency="0.0035 0.32" numOctaves={5} seed={11} result="g" />
            <feColorMatrix in="g" type="matrix" values="1.1 0 0 0 -0.05  0.7 0 0 0 -0.04  0.4 0 0 0 -0.03  0 0 0 0 1" />
          </filter>
          <filter id="paper" x="0" y="0" width="100%" height="100%">
            <feTurbulence type="fractalNoise" baseFrequency="0.045" numOctaves={5} seed={3} result="n" />
            <feDiffuseLighting in="n" lightingColor="#e6d6ad" surfaceScale={2.2} result="l">
              <feDistantLight azimuth={235} elevation={62} />
            </feDiffuseLighting>
          </filter>
          <filter id="fiber" x="0" y="0" width="100%" height="100%">
            <feTurbulence type="fractalNoise" baseFrequency="0.9 0.025" numOctaves={3} seed={21} result="f" />
            <feColorMatrix in="f" type="matrix" values="0 0 0 0 0.35  0 0 0 0 0.24  0 0 0 0 0.12  0.9 0 0 0 -0.3" />
          </filter>
          <filter id="blur30"><feGaussianBlur stdDeviation="30" /></filter>
          <filter id="blur6"><feGaussianBlur stdDeviation="5" /></filter>
          <filter id="blur2"><feGaussianBlur stdDeviation="1.6" /></filter>
          <clipPath id="sheet"><rect x="422" y="-40" width="1076" height="1160" rx="4" /></clipPath>
          <radialGradient id="candle" cx="82%" cy="6%" r="75%">
            <stop offset="0" stopColor="#ffb25a" stopOpacity="0.55" />
            <stop offset="0.45" stopColor="#ff8a3a" stopOpacity="0.12" />
            <stop offset="1" stopColor="#000" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="stain1"><stop offset="0" stopColor="#6e4818" stopOpacity="0.42" /><stop offset="1" stopColor="#8a5a22" stopOpacity="0" /></radialGradient>
          <linearGradient id="edgeL" x1="0" x2="1"><stop offset="0" stopColor="#4a2a0c" stopOpacity="0.65" /><stop offset="0.07" stopColor="#4a2a0c" stopOpacity="0" /></linearGradient>
          <linearGradient id="edgeR" x1="1" x2="0"><stop offset="0" stopColor="#4a2a0c" stopOpacity="0.7" /><stop offset="0.07" stopColor="#4a2a0c" stopOpacity="0" /></linearGradient>
        </defs>

        {/* Mặt bàn gỗ */}
        <rect width="1920" height="1080" fill="#241811" />
        <rect width="1920" height="1080" filter="url(#wood)" opacity="0.7" />
        <rect width="1920" height="1080" fill="#000" opacity="0.38" />

        {/* Bóng và trang giấy, hơi nghiêng */}
        <g transform="rotate(-1.1 960 540)">
          <rect x="446" y="-10" width="1076" height="1160" fill="#000" opacity="0.7" filter="url(#blur30)" />
          <g clipPath="url(#sheet)">
            <rect x="422" y="-40" width="1076" height="1160" fill="#d6c394" />
            <rect x="422" y="-40" width="1076" height="1160" filter="url(#paper)" opacity="0.78" style={{ mixBlendMode: "multiply" }} />
            <rect x="422" y="-40" width="1076" height="1160" filter="url(#fiber)" opacity="0.22" />
            {/* vết ố */}
            <circle cx="620" cy="260" r="210" fill="url(#stain1)" />
            <circle cx="1330" cy="860" r="260" fill="url(#stain1)" />
            <circle cx="1210" cy="140" r="150" fill="url(#stain1)" opacity="0.7" />
            <circle cx="900" cy="640" r="320" fill="url(#stain1)" opacity="0.35" />
            <circle cx="760" cy="980" r="120" fill="url(#stain1)" opacity="0.9" />
            <circle cx="1420" cy="470" r="90" fill="url(#stain1)" opacity="0.8" />
            <circle cx="520" cy="900" r="170" fill="url(#stain1)" opacity="0.8" />
            {/* vệt cà phê */}
            <g filter="url(#blur2)" opacity="0.5">
              <circle cx="1350" cy="905" r="82" fill="none" stroke="#6a3f15" strokeWidth="9" />
              <circle cx="1350" cy="905" r="76" fill="#8a5a22" opacity="0.08" />
            </g>
            {/* nếp gấp ngang */}
            <rect x="422" y="388" width="1076" height="3" fill="#6a4a22" opacity="0.28" />
            <rect x="422" y="391" width="1076" height="4" fill="#fff6dd" opacity="0.22" />
            <rect x="422" y="760" width="1076" height="2" fill="#6a4a22" opacity="0.2" />
            {/* cháy sém mép */}
            <rect x="422" y="-40" width="1076" height="1160" fill="url(#edgeL)" />
            <rect x="422" y="-40" width="1076" height="1160" fill="url(#edgeR)" />
            <rect x="422" y="-40" width="1076" height="1160" fill="none" stroke="#3a210a" strokeOpacity="0.55" strokeWidth="22" filter="url(#blur6)" />
          </g>
          {/* kẹp giấy */}
          <g transform="translate(560 28) rotate(-8)" fill="none" stroke="#a9aeb3" strokeWidth="5" strokeLinecap="round">
            <path d="M0 0 v70 a13 13 0 0 0 26 0 v-60 a8 8 0 0 0 -16 0 v52" />
            <path d="M0 0 v-18 a13 13 0 0 1 26 0 v26" opacity="0.9" />
          </g>
        </g>

      </svg>
      {/* Ánh nến hắt từ góc phải, tối dần ra các góc */}
      <AbsoluteFill style={{ background: "radial-gradient(ellipse at 80% 6%, rgba(255,184,100,0.34) 0%, rgba(255,150,60,0.10) 32%, rgba(0,0,0,0) 58%)", mixBlendMode: "screen" }} />
      <AbsoluteFill style={{ background: "radial-gradient(ellipse at 60% 35%, rgba(0,0,0,0) 28%, rgba(0,0,0,0.72) 100%)" }} />
    </AbsoluteFill>
  );
};
