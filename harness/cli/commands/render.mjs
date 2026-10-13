// Xuất video bằng Remotion. Thư mục tập là "public" của Remotion, nên ảnh/clip/âm thanh không phải chép đi đâu.
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import { HARNESS, loadEpisode, writeJson, fail, ensureDir, rel } from "../lib/core.mjs";
import { buildProps } from "../lib/props.mjs";

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

  // Font thương hiệu vào thư mục tập
  const fontSrc = path.join(HARNESS, "library", "fonts", "Lora.ttf");
  const fontDst = path.join(dir, "assets", "fonts", "Lora.ttf");
  if (fs.existsSync(fontSrc) && !fs.existsSync(fontDst)) {
    ensureDir(path.dirname(fontDst));
    fs.copyFileSync(fontSrc, fontDst);
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

  const preview = !!opts.preview;
  const out = path.join(dir, "out", `${ep.id}${preview ? "-xem-truoc" : ""}.mp4`);
  remotion([
    "render", entry, "Episode", out, ...common,
    `--crf=${preview ? 28 : 20}`, ...(preview ? ["--scale=0.5"] : []),
    "--audio-codec=aac", "--audio-bitrate=192k",
  ]);
  console.log(`✓ Video: ${rel(dir, out)}`);
  return 0;
};
