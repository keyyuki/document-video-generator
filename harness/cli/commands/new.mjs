import fs from "node:fs";
import path from "node:path";
import { EPISODES, HARNESS, ensureDir, fail } from "../lib/core.mjs";

export default async ([name], opts) => {
  if (!name) fail("Thiếu tên tập. Ví dụ: hs new ep02-lang-quang-trung --title \"Lăng mộ vua Quang Trung\"");
  if (!/^[a-z0-9-]+$/.test(name)) fail("Tên tập chỉ dùng chữ thường không dấu, số và gạch ngang, ví dụ ep02-lang-quang-trung.");
  const dir = path.join(EPISODES, name);
  if (fs.existsSync(dir)) fail(`Tập ${name} đã có.`);
  for (const d of ["audio/segments", "assets/img", "assets/clip", "out"]) ensureDir(path.join(dir, d));
  const tpl = fs.readFileSync(path.join(HARNESS, "templates", "episode.yaml"), "utf8");
  fs.writeFileSync(
    path.join(dir, "episode.yaml"),
    tpl.replace(/__ID__/g, name).replace(/__TITLE__/g, typeof opts.title === "string" ? opts.title : name),
  );
  console.log(`✓ Đã tạo ${dir}\n  Bước tiếp: viết kịch bản vào episode.yaml rồi chạy: hs check ${name}`);
};
