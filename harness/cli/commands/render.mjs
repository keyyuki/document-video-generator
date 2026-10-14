// Xuất video bằng Remotion. Thư mục tập là "public" của Remotion, nên ảnh/clip/âm thanh không phải chép đi đâu.
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import { HARNESS, loadEpisode, writeJson, fail, ensureDir, rel } from "../lib/core.mjs";
import { buildProps } from "../lib/props.mjs";
import { buildPaper, paperFile } from "./brand.mjs";

const require = createRequire(import.meta.url);

const remotion = (args) => {
  const cli = path.join(path.dirname(require.resolve("@remotion/cli/package.json")), "remotion-cli.js");
  const extra = process.env.HS_BROWSER ? [`--browser-executable=${process.env.HS_BROWSER}`] : [];
  const r = spawnSync(process.execPath, [cli, ...args, ...extra], { stdio: "inherit", cwd: HARNESS });
  if (r.status !== 0) fail("Remotion báo lỗi (xem log phía trên).");
};

export default async ([name], opts) => {
  const ctx = loadEpisode(name);
  const { dir, ep } = ctx;
  const built = buildProps(ctx);
  if (built.error) fail(built.error);
  if (!fs.existsSync(path.join(dir, "audio", "mix.wav"))) fail(`Chưa có audio/mix.wav. Chạy "hs podcast ${name}".`);

  // Font và nền thương hiệu: chép từ thư viện vào thư mục tập (thư mục tập là "public" của Remotion)
  for (const f of built.props.fonts) {
    const file = f.src.replace(/^assets\/fonts\//, "");
    const from = path.join(HARNESS, "library", "fonts", file);
    const to = path.join(dir, "assets", "fonts", file);
    if (!fs.existsSync(from)) fail(`Thiếu font ${file} trong library/fonts.`);
    if (!fs.existsSync(to) || fs.statSync(to).size !== fs.statSync(from).size) {
      ensureDir(path.dirname(to));
      fs.copyFileSync(from, to);
    }
  }
  for (const sc of built.props.scenes.filter((x) => x.type === "intro")) {
    const name = sc.intro.paper.replace(/^assets\//, "");
    const from = path.join(HARNESS, "library", name);
    const to = path.join(dir, "assets", name);
    if (name === "brand/paper.jpg" && !fs.existsSync(paperFile())) buildPaper();
    if (!fs.existsSync(from)) fail(`Thiếu nền trang giấy ${name} (chạy "hs brand paper").`);
    ensureDir(path.dirname(to));
    fs.copyFileSync(from, to);
  }

  const propsFile = path.join(dir, "out", "props.json");
  writeJson(propsFile, built.props);
  const entry = path.join(HARNESS, "remotion", "index.ts");
  const common = [`--props=${propsFile}`, `--public-dir=${dir}`];

  if (opts.stills) {
    const times = String(opts.stills).split(",").map(Number).filter((n) => Number.isFinite(n));
    const outDir = path.join(dir, "out", "stills");
    ensureDir(outDir);
    for (const t of times) {
      const frame = Math.min(built.props.durationInFrames - 1, Math.round(t * built.props.fps));
      remotion(["still", entry, "Episode", path.join(outDir, `t${t}.jpg`), `--frame=${frame}`, "--image-format=jpeg", "--scale=0.5", ...common]);
    }
    console.log(`✓ Ảnh kiểm tra: ${rel(dir, outDir)}`);
    return 0;
  }

  const range = typeof opts.range === "string" ? opts.range.split("-").map(Number) : null; // giây: "0-40"
  const preview = !!opts.preview;
  const out = path.join(dir, "out", `${ep.id}${preview ? "-xem-truoc" : ""}${range ? `-${range[0]}-${range[1]}s` : ""}.mp4`);
  const fps = built.props.fps;
  const frames = range ? [`--frames=${Math.round(range[0] * fps)}-${Math.min(built.props.durationInFrames - 1, Math.round(range[1] * fps))}`] : [];
  remotion([
    "render", entry, "Episode", out, ...common,
    `--crf=${preview ? 28 : 20}`, ...(preview ? ["--scale=0.5"] : []),
    "--audio-codec=aac", "--audio-bitrate=192k", ...frames,
  ]);
  console.log(`✓ Video: ${rel(dir, out)}`);
  return 0;
};
