// Liệt kê cảnh còn thiếu hình. Cảnh có `library` được chép từ thư viện; còn lại xuất assets/todo.json
// gồm đầy đủ lệnh tạo ảnh/clip (theo series.yaml) để Claude gửi Higgsfield theo lô.
import fs from "node:fs";
import path from "node:path";
import { HARNESS, remove, loadEpisode, readYaml, readJson, writeJson, fail, ensureDir, rel } from "../lib/core.mjs";
import { listShots, assetPath, hasAsset } from "../lib/episode.mjs";
import { blocked } from "../lib/gate.mjs";

export const loadLibrary = () => {
  const f = path.join(HARNESS, "library", "index.yaml");
  return fs.existsSync(f) ? readYaml(f)?.items ?? [] : [];
};

const buildPrompt = (cfg, shot) => {
  const refs = [cfg.visual.styleRef];
  const who = [];
  for (const c of shot.chars ?? []) {
    const ch = cfg.characters?.[c];
    if (!ch) fail(`Cảnh ${shot.id}: nhân vật "${c}" chưa khai báo trong series.yaml.`);
    refs.push(ch.ref);
    who.push(`reference ${refs.length} is ${ch.note}`);
  }
  const rules = [...(cfg.visual.rules ?? [])];
  const text = [
    "Match the painting style of the first reference image exactly.",
    who.length ? `Characters: ${who.join("; ")} — keep the same face and costume.` : "",
    `STYLE: ${cfg.visual.style}`,
    `SCENE: ${shot.prompt}`,
    rules.join(" "),
  ]
    .filter(Boolean)
    .join("\n");
  return { text, refs };
};

export default async ([name], opts = {}) => {
  const { dir, ep, cfg, pron } = loadEpisode(name);
  const lib = loadLibrary();
  const manifest = readJson(path.join(dir, "assets", "manifest.json"), {});
  const shots = listShots(ep).filter((s) => s.type !== "card" && s.type !== "intro");
  const todo = [];
  let fromLib = 0;
  for (const shot of shots) {
    if (hasAsset(dir, shot)) continue;
    if (shot.library) {
      const item = lib.find((x) => x.id === shot.library);
      if (!item) fail(`Cảnh ${shot.id}: không có "${shot.library}" trong library/index.yaml.`);
      const src = path.join(HARNESS, "library", item.file);
      if (!fs.existsSync(src)) fail(`Thư viện thiếu file ${item.file}.`);
      ensureDir(path.dirname(assetPath(dir, shot.asset)));
      fs.copyFileSync(src, assetPath(dir, shot.asset));
      fromLib++;
      continue;
    }
    if (!shot.prompt) {
      todo.push({ id: shot.id, type: shot.type, segment: shot.segment, missing: "chưa có prompt, asset hay library" });
      continue;
    }
    const { text, refs } = buildPrompt(cfg, shot);
    if (shot.type === "image") {
      const v = cfg.visual.image;
      todo.push({
        id: shot.id, type: "image", segment: shot.segment, cost: v.cost,
        params: { model: v.model, resolution: v.resolution, aspect_ratio: v.aspect_ratio, prompt: text, medias: refs.map((r) => ({ role: "image_references", value: r })) },
      });
    } else {
      const v = cfg.visual.clip;
      const startShot = shot.startFrom ? shots.find((s) => s.id === shot.startFrom) : null;
      const startJob = startShot ? manifest[startShot.id]?.job : null;
      todo.push({
        id: shot.id, type: "clip", segment: shot.segment, cost: v.cost,
        needs: shot.startFrom && !startJob ? `tạo ảnh ${shot.startFrom} trước (làm khung đầu)` : undefined,
        params: {
          model: v.model, mode: v.mode, sound: v.sound, duration: shot.clipSeconds ?? v.duration, aspect_ratio: cfg.visual.image.aspect_ratio,
          prompt: `${shot.prompt}\nKeep the painterly style of the start image. Slow cinematic motion. Nobody talks. No text.`,
          medias: startJob ? [{ role: "start_image", value: startJob }] : [],
        },
      });
    }
  }
  if (todo.some((t) => t.params) && blocked(name, dir, ep, pron, "voice", opts)) return 4; // chưa duyệt lồng tiếng
  const file = path.join(dir, "assets", "todo.json");
  const cost = todo.reduce((n, t) => n + (t.cost ?? 0), 0);
  if (todo.length) writeJson(file, { estimatedCredits: cost, items: todo });
  else remove(file);
  const have = shots.filter((s) => hasAsset(dir, s)).length;
  console.log(`Hình: có ${have}/${shots.length} cảnh${fromLib ? ` (vừa lấy ${fromLib} từ thư viện)` : ""}.`);
  if (!todo.length) {
    console.log("✓ Đủ hình cho mọi cảnh.");
    return 0;
  }
  const n = (t) => todo.filter((x) => x.type === t && x.params).length;
  console.log(`Cần tạo: ${n("image")} ảnh, ${n("clip")} clip — ước tính ${cost.toFixed(1)} credit. Danh sách: ${rel(dir, file)}`);
  for (const t of todo.filter((x) => x.missing || x.needs)) console.log(`  ⚠ ${t.id}: ${t.missing ?? t.needs}`);
  console.log(`Tạo xong thì tải về: hs fetch ${name} --set <id cảnh>=<url>`);
  return 3;
};
