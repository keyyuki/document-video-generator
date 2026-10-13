// Một tập phim: các cảnh xếp nối nhau (mờ chồng khi chuyển), chữ, hiệu ứng và một file âm thanh đã trộn sẵn.
import React from "react";
import { Audio, Video } from "@remotion/media";
import {
  AbsoluteFill,
  continueRender,
  delayRender,
  Easing,
  Img,
  interpolate,
  Sequence,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { FxLayer } from "./Fx";
import { OverlayView } from "./Overlays";
import { Brand, EpisodeProps, Motion, SceneData } from "./types";

const useFont = (family: string, src: string) => {
  const [handle] = React.useState(() => delayRender(`Nạp font ${family}`));
  React.useEffect(() => {
    const face = new FontFace(family, `url(${staticFile(src)}) format("truetype")`, { weight: "400 700" });
    face
      .load()
      .then((f) => document.fonts.add(f))
      .catch((err) => console.error("Không nạp được font", err))
      .finally(() => continueRender(handle));
  }, [family, src, handle]);
};

const ease = Easing.inOut(Easing.sin);

const motionStyle = (motion: Motion, p: number): React.CSSProperties => {
  const v = (a: number, b: number) => a + (b - a) * p;
  switch (motion) {
    case "zoomIn":
      return { scale: String(v(1.04, 1.16)) };
    case "zoomOut":
      return { scale: String(v(1.17, 1.05)) };
    case "panLeft":
      return { scale: "1.14", translate: `${v(3.5, -3.5)}% 0%` };
    case "panRight":
      return { scale: "1.14", translate: `${v(-3.5, 3.5)}% 0%` };
    case "panUp":
      return { scale: "1.14", translate: `0% ${v(3.5, -3.5)}%` };
    case "panDown":
      return { scale: "1.14", translate: `0% ${v(-3.5, 3.5)}%` };
    default:
      return { scale: String(v(1.03, 1.06)) };
  }
};

const ImageShot: React.FC<{ src: string; motion: Motion; frames: number }> = ({ src, motion, frames }) => {
  const frame = useCurrentFrame();
  const p = interpolate(frame, [0, frames], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: ease });
  return (
    <AbsoluteFill style={{ overflow: "hidden", backgroundColor: "black" }}>
      <Img src={staticFile(src)} style={{ width: "100%", height: "100%", objectFit: "cover", ...motionStyle(motion, p) }} />
    </AbsoluteFill>
  );
};

// Thẻ chữ không cần hình: nền giấy tối có vân.
const CardShot: React.FC<{ brand: Brand }> = ({ brand }) => (
  <AbsoluteFill
    style={{
      background: `radial-gradient(ellipse at 50% 40%, #2a2118 0%, #120d09 70%, #050403 100%)`,
      boxShadow: `inset 0 0 0 2px ${brand.gold}22`,
    }}
  />
);

const SceneView: React.FC<{ scene: SceneData; brand: Brand; font: string }> = ({ scene, brand, font }) => {
  const frame = useCurrentFrame();
  const frames = scene.durationInFrames;
  const opacity = scene.fadeIn > 0 ? interpolate(frame, [0, scene.fadeIn], [0, 1], { extrapolateRight: "clamp" }) : 1;
  return (
    <AbsoluteFill style={{ opacity }}>
      {scene.type === "card" || !scene.src ? (
        <CardShot brand={brand} />
      ) : scene.type === "image" ? (
        <ImageShot src={scene.src} motion={scene.motion ?? "zoomIn"} frames={frames} />
      ) : (
        <AbsoluteFill style={{ backgroundColor: "black" }}>
          <Video
            src={staticFile(scene.src)}
            muted
            trimBefore={scene.trimBefore ?? 0}
            playbackRate={scene.playbackRate ?? 1}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        </AbsoluteFill>
      )}
      {scene.fx ? <FxLayer fx={scene.fx} /> : null}
      {scene.overlay ? (
        <Sequence from={scene.fadeIn} layout="absolute-fill" name="Chữ">
          <OverlayView overlay={scene.overlay} frames={frames - scene.fadeIn} brand={brand} font={font} />
        </Sequence>
      ) : null}
    </AbsoluteFill>
  );
};

export const Episode: React.FC<EpisodeProps> = ({ scenes, audio, font, brand }) => {
  useFont(font.family, font.src);
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  return (
    <AbsoluteFill style={{ backgroundColor: "black" }}>
      {scenes.map((s) => (
        <Sequence key={s.id} from={s.from} durationInFrames={s.durationInFrames} name={s.id} layout="absolute-fill">
          <SceneView scene={s} brand={brand} font={font.family} />
        </Sequence>
      ))}
      <AbsoluteFill style={{ background: "radial-gradient(ellipse at center, rgba(0,0,0,0) 58%, rgba(0,0,0,0.5) 100%)" }} />
      <AbsoluteFill
        style={{
          backgroundColor: "black",
          opacity: interpolate(frame, [0, 0.6 * fps, durationInFrames - 1.6 * fps, durationInFrames - 1], [1, 0, 0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
        }}
      />
      {audio ? <Audio src={staticFile(audio)} /> : null}
    </AbsoluteFill>
  );
};
