// Tải ảnh/clip đã tạo về đúng chỗ và chuẩn hóa: ảnh → JPG rộng 2400px; clip → MP4 1080p 30fps, bỏ tiếng.
import path from "node:path";
import fs from "node:fs";
import { remove, parsePairsWithInbox, loadEpisode, parsePairs, download, ffmpeg, duration, readJson, writeJson, fail, ensureDir, rel } from "../lib/core.mjs";
import { listShots, assetPath } from "../lib/episode.mjs";

const jobFromUrl = (s) => (path.basename(s.split(/[?#]/)[0]).match(/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/i) ?? [])[1] ?? null;

export const normalizeAsset = (type, src, dest, fps = 30) => {
  ensureDir(path.dirname(dest));
  if (type === "image") ffmpeg(["-i", src, "-vf", "scale='min(2400,iw)':-2", "-q:v", "2", dest]);
  else
    ffmpeg(["-i", src, "-an", "-vf", `scale=1920:1080:force_original_aspect_ratio=increase,crop=1920:1080,fps=${fps}`, "-c:v", "libx264", "-crf", "18", "-preset", "fast", "-pix_fmt", "yuv420p", dest]);
};

export default async ([name], opts) => {
  const { dir, ep, cfg } = loadEpisode(name);
  const inbox = path.join(dir, "assets", "urls.json");
  const pairs = parsePairsWithInbox(opts, inbox);
  const mf0 = readJson(path.join(dir, "assets", "manifest.json"), {});
  // Bỏ qua những cảnh đã tải đúng nguồn này rồi (hộp thư urls.json giữ nguyên giữa các lần chạy)
  for (const [id, src] of Object.entries(pairs)) if (!opts.set && mf0[id]?.source === src && fs.existsSync(path.join(dir, "assets", mf0[id].file))) delete pairs[id];
  if (!Object.keys(pairs).length) {
    console.log(`Không có hình mới để tải. Claude ghi link vào assets/urls.json, hoặc: hs fetch ${name} --set s03-2=https://...png`);
    return 0;
  }
  const shots = listShots(ep);
  const mfFile = path.join(dir, "assets", "manifest.json");
  const manifest = readJson(mfFile, {});
  const tmpDir = path.join(dir, "assets", ".download");
  ensureDir(tmpDir);
  for (const [id, src] of Object.entries(pairs)) {
    const shot = shots.find((s) => s.id === id);
    if (!shot) fail(`Không có cảnh "${id}" trong kịch bản.`);
    if (shot.type === "card") fail(`Cảnh ${id} là thẻ chữ, không cần hình.`);
    const ext = path.extname(src.split(/[?#]/)[0]) || (shot.type === "clip" ? ".mp4" : ".png");
    const tmp = path.join(tmpDir, `${id}${ext}`);
    await download(src, tmp);
    const dest = assetPath(dir, shot.asset);
    normalizeAsset(shot.type, tmp, dest, cfg.video.fps);
    manifest[id] = { file: shot.asset, source: src, job: jobFromUrl(src), at: new Date().toISOString(), ...(shot.type === "clip" ? { seconds: +duration(dest).toFixed(2) } : {}) };
    console.log(`✓ ${id} → assets/${shot.asset}`);
  }
  remove(tmpDir);
  writeJson(mfFile, manifest);
  console.log(`Bước tiếp: hs assets ${name} (kiểm tra còn thiếu) hoặc hs qc ${name}`);
  return 0;
};
