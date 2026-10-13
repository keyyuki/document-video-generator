// Kiểm tra toàn bộ trước khi xuất video.
import fs from "node:fs";
import path from "node:path";
import { loadEpisode, readJson, loudness, fmtTime } from "../lib/core.mjs";
import { validate, spokenText, hashText, hasAsset, listShots } from "../lib/episode.mjs";
import { buildProps } from "../lib/props.mjs";

const TEXT_LIMITS = { stamp: 22, center: 28, caption: 40, lowerThird: 40, endCard: 40 };

export default async ([name]) => {
  const ctx = loadEpisode(name);
  const { dir, ep, cfg, pron } = ctx;
  const errors = [];
  const warnings = [];
  const v = validate(ep, pron);
  errors.push(...v.errors);
  warnings.push(...v.warnings);

  // Lồng tiếng khớp kịch bản hiện tại?
  const vm = readJson(path.join(dir, "audio", "voice.json"), { segments: {} });
  const stale = ep.segments.filter((s) => vm.segments[s.id]?.hash !== hashText(spokenText(s, pron))).map((s) => s.id);
  if (stale.length) errors.push(`Lồng tiếng chưa khớp kịch bản ở đoạn: ${stale.join(", ")} (chạy hs voice).`);

  const timings = readJson(path.join(dir, "audio", "timings.json"), null);
  const mix = path.join(dir, "audio", "mix.wav");
  if (!timings) errors.push("Chưa có audio/timings.json (chạy hs voice).");
  if (!fs.existsSync(mix)) errors.push("Chưa có audio/mix.wav (chạy hs podcast).");
  else if (timings && fs.statSync(mix).mtimeMs < fs.statSync(path.join(dir, "audio", "timings.json")).mtimeMs)
    errors.push("mix.wav cũ hơn timings.json — lồng tiếng đã đổi, chạy lại hs podcast.");
  else {
    const l = loudness(mix);
    if (Math.abs(l - cfg.audio.loudness) > 1) warnings.push(`Âm lượng tổng ${l.toFixed(1)} LUFS, lệch mục tiêu ${cfg.audio.loudness}.`);
  }

  // Hình
  const missing = listShots(ep).filter((s) => !hasAsset(dir, s)).map((s) => s.id);
  if (missing.length) errors.push(`Thiếu hình ${missing.length} cảnh: ${missing.slice(0, 12).join(", ")}${missing.length > 12 ? "…" : ""} (chạy hs assets).`);

  let props = null;
  if (timings) {
    props = buildProps(ctx).props;
    for (const s of props.scenes) {
      const secs = s.durationInFrames / props.fps;
      if (s.dur < cfg.video.minShot) warnings.push(`Cảnh ${s.id} chỉ hiện ${s.dur.toFixed(1)} giây (lúc ${fmtTime(s.start)}).`);
      if (s.type === "clip" && s.natural) {
        const usable = (s.natural - s.trimBefore / props.fps) / s.playbackRate;
        if (usable + 0.05 < secs) warnings.push(`Clip ${s.id} dài ${usable.toFixed(1)}s nhưng cảnh cần ${secs.toFixed(1)}s — sẽ đứng hình cuối (thêm fit: true hoặc playbackRate).`);
      }
      const o = s.overlay;
      if (o) {
        const longest = [o.title, o.text, o.subtitle].filter(Boolean).reduce((m, t) => Math.max(m, String(t).length), 0);
        const lim = TEXT_LIMITS[o.kind];
        if (lim && longest > lim * 1.6) warnings.push(`Chữ ở cảnh ${s.id} dài ${longest} ký tự, dễ tràn khung.`);
      }
    }
    const order = props.scenes.map((s) => s.start);
    if (order.some((t, i) => i && t - order[i - 1] < 0.05)) errors.push("Có hai cảnh bắt đầu gần như cùng lúc — kiểm tra cue.");
  }

  console.log(`QC tập ${ep.id}${timings ? ` · dài ${fmtTime(timings.duration)} · ${props.scenes.length} cảnh` : ""}`);
  for (const w of warnings) console.log(`  ⚠ ${w}`);
  for (const e of errors) console.log(`  ✗ ${e}`);
  if (errors.length) {
    console.log(`\n✗ ${errors.length} lỗi, chưa xuất được.`);
    return 1;
  }
  console.log(`✓ Sẵn sàng xuất${warnings.length ? ` (${warnings.length} cảnh báo nên xem)` : ""}: hs render ${name}`);
  return 0;
};
