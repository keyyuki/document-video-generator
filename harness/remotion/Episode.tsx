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
import { IntroScene } from "./Intro";
import { OverlayView } from "./Overlays";
import { Brand, EpisodeProps, FontData, Motion, SceneData } from "./types";

const useFonts = (fonts: FontData[]) => {
  const [handle] = React.useState(() => delayRender("Nạp font"));
  React.useEffect(() => {
    Promise.all(
      fonts.map(async (f) => {
        const face = new FontFace(f.family, `url(${staticFile(f.src)}) format("truetype")`, { weight: f.weight, style: f.style });
        document.fonts.add(await face.load());
      }),
    )
      .catch((err) => console.error("Không nạp được font", err))
      .finally(() => continueRender(handle));
  }, [fonts, handle]);
};

const ease = Easing.inOut(Easing.sin);

type Focus = [number, number];
const motionStyle = (motion: Motion, p: number, focus: Focus, focusTo: Focus, zoom: number): React.CSSProperties => {
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
    case "focusIn":
    case "focusOut": {
      // Zoom vào một điểm nhấn (% khung hình): cùng một ảnh thành nhiều cảnh khác nhau.
      const [a, b] = motion === "focusIn" ? [1.03, zoom] : [zoom, 1.03];
      return { scale: String(v(a, b)), transformOrigin: `${v(focus[0], focusTo[0])}% ${v(focus[1], focusTo[1])}%` };
    }
    default:
      return { scale: String(v(1.03, 1.06)) };
  }
};

const ImageShot: React.FC<{ scene: SceneData; frames: number }> = ({ scene, frames }) => {
  const frame = useCurrentFrame();
  const p = interpolate(frame, [0, frames], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: ease });
  const focus = (scene.focus ?? [50, 50]) as Focus;
  const focusTo = (scene.focusTo ?? focus) as Focus;
  return (
    <AbsoluteFill style={{ overflow: "hidden", backgroundColor: "black" }}>
      <Img
        src={staticFile(scene.src!)}
        style={{ width: "100%", height: "100%", objectFit: "cover", ...motionStyle(scene.motion ?? "zoomIn", p, focus, focusTo, scene.zoom ?? 1.5) }}
      />
    </AbsoluteFill>
  );
};

// Thẻ chữ không cần hình: nền tối như bìa hồ sơ cũ.
const CardShot: React.FC<{ brand: Brand }> = ({ brand }) => (
  <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 40%, #2a2118 0%, #120d09 70%, #050403 100%)", boxShadow: `inset 0 0 0 2px ${brand.gold}22` }} />
);

const SceneView: React.FC<{ scene: SceneData; brand: Brand; font: string }> = ({ scene, brand, font }) => {
  const frame = useCurrentFrame();
  const frames = scene.durationInFrames;
  const opacity = scene.fadeIn > 0 ? interpolate(frame, [0, scene.fadeIn], [0, 1], { extrapolateRight: "clamp" }) : 1;
  return (
    <AbsoluteFill style={{ opacity }}>
      {scene.type === "intro" && scene.intro ? (
        <IntroScene data={scene.intro} brand={brand} frames={frames} />
      ) : scene.type === "card" || !scene.src ? (
        <CardShot brand={brand} />
      ) : scene.type === "image" ? (
        <ImageShot scene={scene} frames={frames} />
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

export const Episode: React.FC<EpisodeProps> = ({ scenes, audio, font, fonts, brand }) => {
  useFonts(fonts);
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
