// Dữ liệu `hs render` truyền vào (out/props.json). Mọi mốc đã tính sẵn bằng khung hình.
export type Motion = "zoomIn" | "zoomOut" | "panLeft" | "panRight" | "panUp" | "panDown" | "still";

export type Overlay =
  | { kind: "stamp"; title: string; subtitle?: string; at?: number; color?: string }
  | { kind: "caption"; text: string }
  | { kind: "center"; title: string; subtitle?: string }
  | { kind: "lowerThird"; label: string; text: string; duration?: number }
  | { kind: "list"; title: string; items: string[] }
  | { kind: "endCard"; title: string; subtitle?: string; label?: string };

export type Fx = {
  rain?: number; // 0 = tắt, 1 = mưa vừa, 2 = mưa to
  rainAngle?: number;
  fire?: { x: number; y: number; radius?: number }[]; // ánh lửa nhấp nháy, % khung hình
  embers?: boolean; // tàn lửa bay lên từ các điểm fire
  grain?: number; // hạt phim 0–0.15
};

export type SceneData = {
  id: string;
  type: "image" | "clip" | "card";
  from: number;
  durationInFrames: number;
  fadeIn: number;
  src: string | null;
  motion?: Motion;
  overlay?: Overlay | null;
  fx?: Fx | null;
  trimBefore?: number; // khung hình
  playbackRate?: number;
};

export type Brand = { font: string; gold: string; paper: string; red: string };

export type EpisodeProps = {
  fps: number;
  width: number;
  height: number;
  durationInFrames: number;
  audio: string | null;
  font: { family: string; src: string };
  brand: Brand;
  scenes: SceneData[];
};
