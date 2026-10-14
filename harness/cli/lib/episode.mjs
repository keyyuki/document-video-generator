// Đọc, kiểm tra kịch bản và tính mốc thời gian tuyệt đối cho cảnh và tiếng động.
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { normalizeText, plain } from "./normalize.mjs";
import { readJson } from "./core.mjs";

export const SHOT_TYPES = ["image", "clip", "card", "intro"];
export const MOTIONS = ["zoomIn", "zoomOut", "panLeft", "panRight", "panUp", "panDown", "still", "focusIn", "focusOut"];
export const OVERLAYS = ["stamp", "caption", "center", "lowerThird", "list", "endCard", "quote", "timeline", "route"];

export const hashText = (s) => crypto.createHash("sha1").update(s).digest("hex").slice(0, 12);

// Danh sách cảnh, có id ổn định và đường dẫn tài nguyên mặc định.
export const listShots = (ep) => {
  const out = [];
  for (const seg of ep.segments ?? []) {
    (seg.shots ?? []).forEach((shot, i) => {
      const id = shot.id ?? `${seg.id}-${i + 1}`;
      const type = shot.type ?? "image";
      const asset =
        shot.asset ?? (type === "image" ? `img/${id}.jpg` : type === "clip" ? `clip/${id}.mp4` : null);
      out.push({ ...shot, id, type, asset, segment: seg.id, index: i });
    });
  }
  return out;
};

export const spokenText = (seg, pron) => normalizeText(seg.voice ?? seg.text, pron);

// Kiểm tra cấu trúc. Trả về {errors, warnings}.
export const validate = (ep, pron) => {
  const errors = [];
  const warnings = [];
  if (!ep.id) errors.push("Thiếu `id` của tập.");
  if (!Array.isArray(ep.segments) || ep.segments.length === 0) errors.push("Thiếu danh sách `segments`.");
  const segIds = new Set();
  const shotIds = new Set();
  for (const [si, seg] of (ep.segments ?? []).entries()) {
    const where = `Đoạn ${seg.id ?? `#${si + 1}`}`;
    if (!seg.id) errors.push(`${where}: thiếu id.`);
    else if (segIds.has(seg.id)) errors.push(`${where}: trùng id.`);
    segIds.add(seg.id);
    if (!seg.text || !String(seg.text).trim()) errors.push(`${where}: thiếu lời đọc (text).`);
    const spoken = seg.text ? spokenText(seg, pron) : "";
    if (/\d/.test(spoken)) warnings.push(`${where}: còn chữ số chưa đọc được thành chữ: "${spoken.match(/\S*\d\S*/)[0]}".`);
    const sentences = String(seg.text ?? "").split(/[.!?…]+/).filter((s) => s.trim()).length;
    if (sentences > 6) warnings.push(`${where}: ${sentences} câu, nên chia nhỏ (2–3 câu/đoạn) để sửa lồng tiếng nhanh hơn.`);
    if (seg.pause != null && (typeof seg.pause !== "number" || seg.pause < 0)) errors.push(`${where}: pause phải là số giây ≥ 0.`);
    if (si === 0 && !(seg.shots ?? []).length) errors.push(`${where}: đoạn đầu tiên phải có ít nhất một cảnh.`);
    for (const [i, shot] of (seg.shots ?? []).entries()) {
      const sw = `${where}, cảnh ${shot.id ?? i + 1}`;
      const id = shot.id ?? `${seg.id}-${i + 1}`;
      if (shotIds.has(id)) errors.push(`${sw}: trùng id cảnh "${id}".`);
      shotIds.add(id);
      const type = shot.type ?? "image";
      if (!SHOT_TYPES.includes(type)) errors.push(`${sw}: type "${type}" không hợp lệ (${SHOT_TYPES.join(", ")}).`);
      if (shot.motion && !MOTIONS.includes(shot.motion)) errors.push(`${sw}: motion "${shot.motion}" không hợp lệ (${MOTIONS.join(", ")}).`);
      if (shot.overlay && !OVERLAYS.includes(shot.overlay.kind)) errors.push(`${sw}: overlay.kind "${shot.overlay.kind}" không hợp lệ.`);
      if (i > 0 && shot.cue == null && shot.at == null)
        errors.push(`${sw}: cảnh thứ 2 trở đi cần \`cue\` (cụm từ bắt đầu cảnh) hoặc \`at\` (giây).`);
      if (typeof shot.cue === "string" && shot.cue !== "@pause" && seg.text) {
        if (!plain(spoken).includes(plain(normalizeText(shot.cue, pron))))
          errors.push(`${sw}: cue "${shot.cue}" không có trong lời đọc của đoạn.`);
      }
      if (shot.cue === "@pause" && !(seg.pause > 0)) errors.push(`${sw}: cue "@pause" nhưng đoạn không có quãng nghỉ.`);
      if (type !== "card" && type !== "intro" && !shot.asset && !shot.prompt && !shot.library)
        warnings.push(`${sw}: chưa có asset, prompt hay library — sẽ không tạo được hình.`);
    }
    for (const [i, fx] of (seg.sfx ?? []).entries()) {
      if (!fx.name) errors.push(`${where}, tiếng động #${i + 1}: thiếu name.`);
      if (typeof fx.cue === "string" && fx.cue !== "@pause" && !plain(spoken).includes(plain(normalizeText(fx.cue, pron))))
        errors.push(`${where}, tiếng động ${fx.name}: cue "${fx.cue}" không có trong lời đọc.`);
    }
  }
  return { errors, warnings };
};

// Mốc thời gian một vị trí trong đoạn: {cue | at | "@pause"} + offset.
export const resolvePos = (spec, seg, t, pron) => {
  const off = spec.offset ?? 0;
  if (spec.at != null) return t.speechStart + spec.at + off;
  if (spec.cue === "@pause") return t.speechEnd + off;
  if (spec.cue == null) return t.start + off;
  const full = plain(spokenText(seg, pron));
  const idx = full.indexOf(plain(normalizeText(spec.cue, pron)));
  const frac = idx < 0 ? 0 : idx / Math.max(1, full.length);
  return t.speechStart + frac * (t.speechEnd - t.speechStart) + off;
};

export const loadTimings = (dir) => readJson(path.join(dir, "audio", "timings.json"), null);

// Ghép kịch bản + timings → danh sách cảnh tuyệt đối (giây).
export const buildTimeline = (ep, timings, pron) => {
  const byId = Object.fromEntries(timings.segments.map((s) => [s.id, s]));
  const scenes = [];
  for (const seg of ep.segments) {
    const t = byId[seg.id];
    if (!t) continue;
    for (const shot of listShots({ segments: [seg] })) {
      const start = shot.index === 0 && shot.cue == null && shot.at == null ? t.start : resolvePos(shot, seg, t, pron);
      const item = { ...shot, start };
      if (shot.type === "intro") {
        const at = (c) => resolvePos({ cue: c }, seg, t, pron);
        item.marks = { label: at(shot.labelCue), title: at(shot.titleCue), speechEnd: t.speechEnd, end: t.end };
      }
      scenes.push(item);
    }
  }
  scenes.sort((a, b) => a.start - b.start);
  for (let i = 0; i < scenes.length; i++) {
    scenes[i].end = i + 1 < scenes.length ? scenes[i + 1].start : timings.duration;
    scenes[i].dur = scenes[i].end - scenes[i].start;
  }
  return scenes;
};

export const buildSfx = (ep, timings, pron) => {
  const byId = Object.fromEntries(timings.segments.map((s) => [s.id, s]));
  const cues = [];
  for (const seg of ep.segments) {
    const t = byId[seg.id];
    if (!t) continue;
    for (const fx of seg.sfx ?? []) {
      const time = Math.max(0, resolvePos(fx, seg, t, pron));
      const duration = fx.until ? Math.max(0.2, resolvePos(fx.until, seg, t, pron) - time) : fx.duration;
      cues.push({ ...fx, time, duration, segment: seg.id });
    }
  }
  return cues.sort((a, b) => a.time - b.time);
};

export const assetPath = (dir, asset) => path.join(dir, "assets", asset);
export const hasAsset = (dir, shot) => shot.type === "card" || shot.type === "intro" || (shot.asset && fs.existsSync(assetPath(dir, shot.asset)));
