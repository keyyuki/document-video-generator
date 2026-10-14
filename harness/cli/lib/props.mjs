// Dựng dữ liệu đầu vào cho Remotion từ kịch bản + timings (đơn vị khung hình).
import path from "node:path";
import fs from "node:fs";
import { readJson, duration } from "./core.mjs";
import { buildTimeline, loadTimings, assetPath } from "./episode.mjs";

export const buildProps = ({ dir, ep, cfg, pron }) => {
  const timings = loadTimings(dir);
  if (!timings) return { error: "Chưa có audio/timings.json (chạy hs voice)." };
  const fps = cfg.video.fps;
  const total = Math.ceil(timings.duration * fps);
  const manifest = readJson(path.join(dir, "assets", "manifest.json"), {});
  const scenes = buildTimeline(ep, timings, pron);
  const cross = Math.round(cfg.video.crossfade * fps);
  const out = scenes.map((s, i) => {
    const startF = Math.round(s.start * fps);
    const endF = i + 1 < scenes.length ? Math.round(scenes[i + 1].start * fps) : total;
    const fadeIn = i === 0 ? 0 : Math.min(cross, Math.floor((endF - startF) / 4));
    const from = startF - fadeIn;
    const item = {
      id: s.id,
      type: s.type,
      from,
      durationInFrames: endF - from,
      fadeIn,
      start: s.start,
      dur: s.dur,
      src: s.asset ? `assets/${s.asset}` : null,
      motion: s.motion ?? (s.type === "image" ? "zoomIn" : undefined),
      overlay: s.overlay ?? null,
      fx: s.fx ?? null,
      focus: s.focus ?? null,
      focusTo: s.focusTo ?? null,
      zoom: s.zoom ?? null,
    };
    if (s.type === "intro") {
      const m = s.marks;
      const f = (t) => Math.max(0, Math.round((t - s.start) * fps) + fadeIn);
      const hasSub = !!s.intro.subtitle;
      const titleFrom = m.title;
      const titleTo = Math.max(m.title + 1.1, m.speechEnd + 0.2);
      const subFrom = titleTo + 0.1;
      const subTo = subFrom + 0.8;
      item.intro = {
        ...s.intro,
        t: {
          brand: f(s.start + 0.2),
          label: f(m.label),
          titleFrom: f(titleFrom),
          titleTo: f(titleTo),
          subFrom: f(subFrom),
          subTo: f(subTo),
          stamp: f(m.speechEnd + (s.stampDelay ?? 0.5)),
        },
        paper: `assets/${s.intro.paper}`,
        hasSub,
      };
    }
    if (s.type === "clip") {
      const file = assetPath(dir, s.asset);
      const natural = manifest[s.id]?.seconds ?? (fs.existsSync(file) ? duration(file) : null);
      const trim = s.trimBefore ?? 0;
      let rate = s.playbackRate ?? 1;
      const slot = (endF - from) / fps;
      if (s.fit && natural) rate = Math.min(1, Math.max(0.5, (natural - trim) / slot));
      Object.assign(item, { trimBefore: Math.round(trim * fps), playbackRate: +rate.toFixed(3), natural });
    }
    return item;
  });
  return {
    props: {
      fps,
      width: cfg.video.width,
      height: cfg.video.height,
      durationInFrames: total,
      audio: "audio/mix.wav",
      font: { family: cfg.brand.font },
      fonts: (cfg.fonts ?? []).map((x) => ({ family: x.family, src: `assets/fonts/${x.file}`, weight: x.weight ?? "400", style: x.style ?? "normal" })),
      brand: cfg.brand,
      scenes: out,
    },
    timings,
  };
};
