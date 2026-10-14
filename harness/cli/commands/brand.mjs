// Tài sản thương hiệu dùng chung. Hiện có: `hs brand paper` — dựng nền trang giấy hồ sơ (library/brand/paper.jpg).
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import { HARNESS, ensureDir, fail } from "../lib/core.mjs";

const require = createRequire(import.meta.url);

export const paperFile = () => path.join(HARNESS, "library", "brand", "paper.jpg");

export const buildPaper = () => {
  const cli = path.join(path.dirname(require.resolve("@remotion/cli/package.json")), "remotion-cli.js");
  const out = paperFile();
  ensureDir(path.dirname(out));
  const extra = process.env.HS_BROWSER ? [`--browser-executable=${process.env.HS_BROWSER}`] : [];
  const r = spawnSync(
    process.execPath,
    [cli, "still", path.join(HARNESS, "remotion", "index.ts"), "PaperBase", out, "--image-format=jpeg", "--jpeg-quality=92", ...extra],
    { stdio: "inherit", cwd: HARNESS },
  );
  if (r.status !== 0) fail("Không dựng được nền trang giấy.");
};

export default async ([what]) => {
  if (what !== "paper") fail('Dùng: hs brand paper   (dựng lại nền trang giấy library/brand/paper.jpg)');
  buildPaper();
  console.log(`✓ ${paperFile()}`);
  return 0;
};
