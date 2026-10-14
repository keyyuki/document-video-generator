// Tạo tài liệu để người dùng duyệt (đọc được bằng mắt, không cần hiểu YAML).
//   hs review <tập> script  → review/kich-ban.md   (sau khi viết xong episode.yaml)
//   hs review <tập> voice   → review/long-tieng.md  (sau khi lồng tiếng + podcast)
// Claude có thể viết thêm review/ghi-chu.md (nguồn, điều cần kiểm chứng, giả định); nội dung được chèn vào đầu tài liệu.
import fs from "node:fs";
import path from "node:path";
import { loadEpisode, readJson, fail, ensureDir, fmtTime, rel } from "../lib/core.mjs";
import { validate, listShots, spokenText, loadTimings } from "../lib/episode.mjs";
import { gateStatus } from "../lib/gate.mjs";
import { loadLibrary } from "./assets.mjs";

const cell = (s) => String(s ?? "").replace(/\|/g, "/").replace(/\n/g, " ");
const median = (a) => [...a].sort((x, y) => x - y)[Math.floor(a.length / 2)];

export default async ([name, what]) => {
  if (!["script", "voice"].includes(what)) fail("Dùng: hs review <tập> script | voice");
  const { dir, ep, cfg, pron } = loadEpisode(name);
  const notesFile = path.join(dir, "review", "ghi-chu.md");
  const notes = fs.existsSync(notesFile) ? fs.readFileSync(notesFile, "utf8").trim() : null;
  const out = [];
  const shots = listShots(ep);
  const spoken = ep.segments.map((s) => spokenText(s, pron));
  const chars = spoken.reduce((n, t) => n + t.length, 0);

  if (what === "script") {
    const { errors, warnings } = validate(ep, pron);
    const lib = loadLibrary();
    const newImg = shots.filter((s) => s.type === "image" && s.prompt && !fs.existsSync(path.join(dir, "assets", s.asset)) && !lib.find((l) => l.id === s.library));
    const clips = shots.filter((s) => s.type === "clip" && s.prompt && !fs.existsSync(path.join(dir, "assets", s.asset)));
    const voiceCost = (chars / 1000) * cfg.voice.costPer1000Chars;
    const imgCost = newImg.length * (cfg.visual.image.cost ?? 0);
    const clipCost = clips.length * (cfg.visual.clip.cost ?? 0);
    const pauses = ep.segments.reduce((n, s) => n + (s.pause ?? cfg.audio.defaultPause), 0);
    const estSec = Math.round(chars / 15 + pauses);
    out.push(`# Duyệt KỊCH BẢN — ${ep.title ?? ep.id}`, "");
    out.push(`Việc cần bạn làm: đọc lời đọc bên dưới, báo **duyệt** hoặc ghi những chỗ cần sửa. Sau khi duyệt mới tạo lồng tiếng (tốn credit).`, "");
    if (notes) out.push("## Ghi chú của Claude (nguồn, điều cần kiểm chứng)", "", notes, "");
    out.push("## Tóm tắt", "");
    out.push(`- ${ep.segments.length} đoạn, ${shots.length} cảnh, khoảng ${Math.floor(estSec / 60)} phút ${estSec % 60} giây (ước tính theo số chữ; thật sẽ biết sau khi lồng tiếng).`);
    out.push(`- Lồng tiếng: ~${chars} ký tự ≈ ${voiceCost.toFixed(1)} credit.`);
    out.push(`- Hình mới: ${newImg.length} ảnh (≈ ${imgCost.toFixed(1)} credit)${clips.length ? `, ${clips.length} clip (≈ ${clipCost.toFixed(1)} credit)` : ""}; còn lại dùng lại ảnh có sẵn/cắt cận.`);
    out.push(`- Tổng dự kiến: ≈ ${(voiceCost + imgCost + clipCost).toFixed(1)} credit.`);
    if (ep.intro) out.push(`- Đoạn mở đầu thương hiệu: "Hồ sơ thứ ${ep.intro.number ?? 1}: ${ep.intro.title}", chèn sau đoạn ${ep.intro.after ?? "(đầu tập)"}.`);
    for (const w of warnings) out.push(`- ⚠ ${w}`);
    for (const e of errors) out.push(`- ✗ ${e}`);
    out.push("", "## Lời đọc từng đoạn", "", "| Đoạn | Mốc ước tính | Lời đọc | Cảnh / chữ trên hình / tiếng động |", "| --- | --- | --- | --- |");
    let t = 0;
    for (const [i, seg] of ep.segments.entries()) {
      const sh = shots.filter((s) => s.segment === seg.id);
      const bits = [`${sh.length} cảnh${sh.some((s) => s.type === "clip") ? " (có clip)" : ""}`];
      const ov = sh.map((s) => s.overlay?.kind).filter(Boolean);
      if (ov.length) bits.push(`chữ: ${ov.join(", ")}`);
      const fresh = sh.filter((s) => s.prompt && newImg.includes(s)).length;
      if (fresh) bits.push(`ảnh mới: ${fresh}`);
      const fx = (seg.sfx ?? []).map((s) => s.name);
      if (fx.length) bits.push(`âm: ${fx.join(", ")}`);
      out.push(`| ${seg.id} | ${fmtTime(t)} | ${cell(seg.text)} | ${bits.join(" · ")} |`);
      t += spoken[i].length / 15 + (seg.pause ?? cfg.audio.defaultPause);
    }
    if (newImg.length) {
      out.push("", "## Ảnh mới sẽ tạo", "");
      for (const s of newImg) out.push(`- **${s.id}** (đoạn ${s.segment}${s.chars?.length ? `, nhân vật: ${s.chars.join(", ")}` : ""}): ${s.prompt}`);
    }
    out.push("", "## Bạn nên để ý", "", "- Lời có đúng sử liệu? Chỗ nào là dã sử đã nói rõ chưa?", "- Nhịp: mở màn có đủ gây tò mò; mỗi phần có đủ dài/ngắn?", "- Thời lượng và credit có chấp nhận được?", "- Hình mới có cần thiết, hay dùng lại ảnh cũ?");
    const f = path.join(dir, "review", "kich-ban.md");
    ensureDir(path.dirname(f));
    fs.writeFileSync(f, out.join("\n") + "\n");
    console.log(`✓ ${rel(dir, f)} — gửi người dùng đọc; duyệt xong chạy: hs approve ${name} script`);
    return 0;
  }

  // voice
  const timings = loadTimings(dir);
  if (!timings) fail(`Chưa có audio/timings.json — chạy hs voice ${name} cho đến khi xong.`);
  const st = gateStatus(dir, ep, pron, "script");
  const rates = timings.segments.map((s, i) => spoken[i].length / Math.max(0.1, s.speechEnd - s.speechStart));
  const med = median(rates);
  const podcast = path.join(dir, "audio", "podcast.mp3");
  out.push(`# Duyệt LỒNG TIẾNG — ${ep.title ?? ep.id}`, "");
  out.push(`Việc cần bạn làm: **nghe** ${fs.existsSync(podcast) ? "`audio/podcast.mp3` (đã trộn nền + tiếng động)" : "`audio/voice.wav`"}, rồi báo **duyệt** hoặc ghi đoạn cần đọc lại. Sau khi duyệt mới tạo hình ảnh (tốn credit) và dựng video.`, "");
  if (notes) out.push("## Ghi chú của Claude", "", notes, "");
  out.push("## Tóm tắt", "");
  out.push(`- Tổng thời lượng: ${fmtTime(timings.duration)} (${timings.segments.length} đoạn).`);
  out.push(`- Kịch bản đã duyệt: ${st.ok ? "có" : `chưa (${st.why})`}.`);
  out.push(`- Tốc độ đọc trung bình ~${med.toFixed(1)} ký tự/giây; đoạn lệch quá 25% được đánh dấu để bạn nghe kỹ.`, "");
  out.push("## Từng đoạn", "", "| Đoạn | Từ – đến | Đọc | Tốc độ | Lưu ý khi nghe |", "| --- | --- | --- | --- | --- |");
  for (const [i, s] of timings.segments.entries()) {
    const seg = ep.segments[i];
    const flag = [];
    const r = rates[i] / med;
    if (r > 1.25) flag.push("đọc nhanh");
    if (r < 0.75) flag.push("đọc chậm");
    if (spoken[i] !== String(seg.text).replace(/\s+/g, " ").trim()) flag.push(`đọc là: «${cell(spoken[i].slice(0, 90))}${spoken[i].length > 90 ? "…" : ""}» (số/viết tắt đã đổi thành chữ)`);
    if (seg.voice) flag.push("có sửa cách đọc (voice:)");
    out.push(`| ${seg.id} | ${fmtTime(s.speechStart)} – ${fmtTime(s.speechEnd)} | ${cell(seg.text)} | ${r.toFixed(2)}× | ${flag.join("; ") || "—"} |`);
  }
  out.push("", "## Bạn nên để ý", "", "- Phát âm tên riêng (Lệ Chi Viên, Nguyễn Thị Lộ…), số năm, chữ cái A/Bê/Xê.", "- Ngắt nghỉ trước/sau câu quan trọng, tốc độ từng đoạn; giọng có hợp không khí tập không.", "- Nền và tiếng động (sấm, dấu, chuông) có át tiếng đọc không.", "- Muốn sửa: chỉ cần nói đoạn nào và sửa gì; chỉ đoạn đó phải đọc lại (tốn credit rất ít).");
  const f = path.join(dir, "review", "long-tieng.md");
  ensureDir(path.dirname(f));
  fs.writeFileSync(f, out.join("\n") + "\n");
  console.log(`✓ ${rel(dir, f)} — gửi kèm audio/podcast.mp3 cho người dùng nghe; duyệt xong chạy: hs approve ${name} voice`);
  return 0;
};
