// Đường dẫn, cấu hình, ffmpeg và các tiện ích chung cho lệnh `hs`.
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
import YAML from "yaml";
import { expandIntro } from "./intro.mjs";

const require = createRequire(import.meta.url);
export const HARNESS = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
export const ROOT = path.resolve(HARNESS, "..");
export const EPISODES = process.env.HS_EPISODES ? path.resolve(process.env.HS_EPISODES) : path.join(ROOT, "episodes");

export class HsError extends Error {}
export const fail = (msg) => {
  throw new HsError(msg);
};

export const readYaml = (p) => YAML.parse(fs.readFileSync(p, "utf8"));
export const readJson = (p, fallback) => (fs.existsSync(p) ? JSON.parse(fs.readFileSync(p, "utf8")) : fallback);
export const writeJson = (p, v) => {
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, JSON.stringify(v, null, 2) + "\n");
};
export const ensureDir = (p) => fs.mkdirSync(p, { recursive: true });
export const rel = (from, to) => path.relative(from, to).split(path.sep).join("/");

const isObj = (v) => v && typeof v === "object" && !Array.isArray(v);
export const deepMerge = (a, b) => {
  if (!isObj(a) || !isObj(b)) return b === undefined ? a : b;
  const out = { ...a };
  for (const [k, v] of Object.entries(b)) out[k] = deepMerge(a[k], v);
  return out;
};

export const loadSeries = () => readYaml(path.join(HARNESS, "config", "series.yaml"));
export const loadPronunciation = () => readYaml(path.join(HARNESS, "config", "phat-am.yaml"));

// ---------- Tập phim ----------
export const episodeDir = (name) => {
  if (!name) fail("Thiếu tên tập. Ví dụ: hs check ep02");
  const direct = path.join(EPISODES, name);
  if (fs.existsSync(direct)) return direct;
  const hit = fs.existsSync(EPISODES) ? fs.readdirSync(EPISODES).filter((d) => d.startsWith(name)) : [];
  if (hit.length === 1) return path.join(EPISODES, hit[0]);
  if (hit.length > 1) fail(`Tên "${name}" khớp nhiều tập: ${hit.join(", ")}`);
  fail(`Không tìm thấy tập "${name}" trong ${EPISODES}`);
};

export const loadEpisode = (name) => {
  const dir = episodeDir(name);
  const file = path.join(dir, "episode.yaml");
  if (!fs.existsSync(file)) fail(`Thiếu ${file}`);
  const raw = readYaml(file);
  const series = loadSeries();
  const cfg = deepMerge(series, raw.overrides ?? {});
  let ep;
  try {
    ep = expandIntro(raw, cfg);
  } catch (e) {
    fail(e.message);
  }
  return { dir, file, ep, cfg, pron: loadPronunciation() };
};

// ---------- ffmpeg ----------
const exists = (p) => p && fs.existsSync(p);
// node_modules cài trên Windows chứa ffmpeg.exe; khi chạy trong máy ảo Linux thì bỏ qua để dùng ffmpeg của hệ thống.
const runnable = (p) => exists(p) && (process.platform === "win32") === /\.exe$/i.test(p);
// Ghi chú: ffmpeg 6.0 (ffmpeg-static) có thể treo ở cuối luồng khi amix chờ một nhánh đã hết — luôn ghi duration=shortest|first.
export const ffmpegPath = () => {
  if (process.env.HS_FFMPEG) return process.env.HS_FFMPEG;
  try {
    const p = require("ffmpeg-static");
    if (runnable(p)) return p;
  } catch {}
  return "ffmpeg";
};
export const ffprobePath = () => {
  if (process.env.HS_FFPROBE) return process.env.HS_FFPROBE;
  try {
    const p = require("ffprobe-static").path;
    if (runnable(p)) return p;
  } catch {}
  return "ffprobe";
};

export const run = (cmd, args, { quiet = true } = {}) => {
  const r = spawnSync(cmd, args, { encoding: "utf8", maxBuffer: 1 << 28, timeout: 20 * 60 * 1000 });
  if (r.error) fail(`Không chạy được ${path.basename(cmd)}: ${r.error.message}`);
  if (r.status !== 0) fail(`${path.basename(cmd)} lỗi:\n${(r.stderr || "").split("\n").slice(-12).join("\n")}`);
  if (!quiet) process.stdout.write(r.stdout);
  return r;
};
// Ghi chú: ffmpeg 6.0 (ffmpeg-static) có thể treo ở cuối luồng khi amix chờ một nhánh đã hết — luôn ghi duration=shortest|first.
export const ffmpeg = (args) => run(ffmpegPath(), ["-hide_banner", "-loglevel", "error", "-y", ...args]);
export const duration = (file) => {
  const r = run(ffprobePath(), ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", file]);
  const d = parseFloat(r.stdout.trim());
  if (!Number.isFinite(d)) fail(`Không đọc được thời lượng của ${file}`);
  return d;
};
export const loudness = (file) => {
  const r = spawnSync(ffmpegPath(), ["-hide_banner", "-nostats", "-i", file, "-af", "ebur128", "-f", "null", "-"], {
    encoding: "utf8",
    maxBuffer: 1 << 28,
  });
  const m = [...(r.stderr || "").matchAll(/^\s+I:\s+(-?[\d.]+) LUFS/gm)];
  return m.length ? parseFloat(m[m.length - 1][1]) : NaN;
};

// ---------- Tải file ----------
export const download = async (src, dest) => {
  ensureDir(path.dirname(dest));
  if (/^https?:\/\//i.test(src)) {
    const res = await fetch(src);
    if (!res.ok) fail(`Tải ${src} thất bại: HTTP ${res.status}`);
    fs.writeFileSync(dest, Buffer.from(await res.arrayBuffer()));
  } else {
    const p = path.resolve(src);
    if (!fs.existsSync(p)) fail(`Không thấy file ${p}`);
    fs.copyFileSync(p, dest);
  }
  return dest;
};

// Đọc tham số dạng --set a=b --set c=d hoặc --from file.json
export const parsePairs = (opts) => {
  const out = {};
  for (const s of [].concat(opts.set ?? [])) {
    const i = s.indexOf("=");
    if (i < 1) fail(`--set phải có dạng id=đường-dẫn-hoặc-url, nhận được "${s}"`);
    out[s.slice(0, i).trim()] = s.slice(i + 1).trim();
  }
  if (opts.from) {
    const f = path.resolve(opts.from);
    if (!fs.existsSync(f)) fail(`Không thấy file ${opts.from}`);
    Object.assign(out, readJson(f, {}));
  }
  return out;
};

// Xóa an toàn: thư mục nối từ máy ảo có thể cấm xóa → khi đó để nguyên (thư mục tạm)
// hoặc ghi đè file danh sách thành rỗng để không bị hiểu nhầm là còn việc.
export const remove = (p) => {
  if (!fs.existsSync(p)) return;
  try {
    fs.rmSync(p, { recursive: true, force: true });
  } catch {
    if (p.endsWith(".json")) fs.writeFileSync(p, JSON.stringify({ done: true }) + "\n");
  }
};

// Đọc cặp id=nguồn từ --set, --from, hoặc file "hộp thư" mặc định (vd audio/tts-urls.json do Claude ghi).
export const parsePairsWithInbox = (opts, inbox) => {
  const explicit = opts.set || opts.from;
  const pairs = parsePairs(opts);
  if (!explicit && inbox && fs.existsSync(inbox)) Object.assign(pairs, readJson(inbox, {}));
  delete pairs.done;
  return pairs;
};

export const fmtTime = (t) => {
  const m = Math.floor(t / 60);
  const s = t - m * 60;
  return `${m}:${s.toFixed(1).padStart(4, "0")}`;
};
