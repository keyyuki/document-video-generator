// Lồng tiếng theo đoạn: ghi nhận file từng đoạn, tìm đoạn cần làm lại, ghép thành voice.wav + timings.json.
import fs from "node:fs";
import path from "node:path";
import { remove, parsePairsWithInbox, loadEpisode, readJson, writeJson, parsePairs, download, ffmpeg, duration, fail, ensureDir, rel, fmtTime } from "../lib/core.mjs";
import { validate, spokenText, hashText } from "../lib/episode.mjs";

export default async ([name], opts) => {
  const { dir, ep, cfg, pron } = loadEpisode(name);
  const { errors } = validate(ep, pron);
  if (errors.length) fail(`Kịch bản còn lỗi, chạy "hs check ${name}" để xem.`);

  const audioDir = path.join(dir, "audio");
  const segDir = path.join(audioDir, "segments");
  ensureDir(segDir);
  const manifestFile = path.join(audioDir, "voice.json");
  const manifest = readJson(manifestFile, { segments: {} });

  // 1) Ghi nhận file mới (--set / --from)
  const pairs = parsePairsWithInbox(opts, path.join(audioDir, "tts-urls.json"));
  for (const [id, src] of Object.entries(pairs)) {
    const seg = ep.segments.find((s) => s.id === id);
    if (!seg) fail(`Không có đoạn "${id}" trong kịch bản.`);
    const prev = manifest.segments[id];
    if (!opts.set && !opts.from && prev?.source === src && fs.existsSync(path.join(dir, prev.file))) continue; // đã tải rồi
    const ext = (path.extname(src.split(/[?#]/)[0]) || ".mp3").toLowerCase();
    const dest = path.join(segDir, `${id}${ext}`);
    await download(src, dest);
    const text = spokenText(seg, pron);
    manifest.segments[id] = { file: rel(dir, dest), hash: hashText(text), source: src, at: new Date().toISOString() };
    console.log(`✓ ${id}: đã lưu ${rel(dir, dest)}`);
  }
  writeJson(manifestFile, manifest);

  // 2) Đoạn nào thiếu hoặc lời đã đổi?
  const todo = [];
  for (const seg of ep.segments) {
    const text = spokenText(seg, pron);
    const m = manifest.segments[seg.id];
    const ok = m && m.hash === hashText(text) && fs.existsSync(path.join(dir, m.file));
    if (!ok) todo.push({ id: seg.id, text, chars: text.length, reason: !m ? "chưa có" : m.hash !== hashText(text) ? "lời đã sửa" : "mất file" });
  }
  const todoFile = path.join(audioDir, "tts-todo.json");
  if (todo.length) {
    const chars = todo.reduce((n, t) => n + t.chars, 0);
    writeJson(todoFile, {
      voice: cfg.voice,
      estimatedCredits: +((chars / 1000) * cfg.voice.costPer1000Chars).toFixed(2),
      segments: todo,
    });
    console.log(`\nCòn ${todo.length}/${ep.segments.length} đoạn cần lồng tiếng (~${chars} ký tự). Danh sách: ${rel(dir, todoFile)}`);
    for (const t of todo) console.log(`  · ${t.id} (${t.reason}): ${t.text.slice(0, 70)}${t.text.length > 70 ? "…" : ""}`);
    console.log(`\nTạo xong: ghi link vào audio/tts-urls.json rồi chạy lại hs voice ${name} (hoặc --set ${todo[0].id}=<url>)`);
    return 3;
  }
  remove(todoFile);

  // 3) Ghép: cắt khoảng lặng đầu/cuối mỗi đoạn, thêm đệm + quãng nghỉ chính xác
  const sr = cfg.audio.sampleRate;
  const head = cfg.audio.headPad;
  const work = path.join(audioDir, ".work");
  ensureDir(work);
  const list = [];
  const segments = [];
  let t = 0;
  const silence = (sec, idx) => {
    const f = path.join(work, `sil-${idx}.wav`);
    ffmpeg(["-f", "lavfi", "-i", `anullsrc=r=${sr}:cl=mono`, "-t", sec.toFixed(3), "-c:a", "pcm_s16le", f]);
    return f;
  };
  for (const [i, seg] of ep.segments.entries()) {
    const src = path.join(dir, manifest.segments[seg.id].file);
    const clean = path.join(work, `${seg.id}.wav`);
    const trim = "silenceremove=start_periods=1:start_threshold=-45dB:start_silence=0.02";
    ffmpeg(["-i", src, "-af", `${trim},areverse,${trim},areverse`, "-ar", String(sr), "-ac", "1", "-c:a", "pcm_s16le", clean]);
    const speech = duration(clean);
    const isLast = i === ep.segments.length - 1;
    const pause = isLast ? cfg.audio.tail : seg.pause ?? cfg.audio.defaultPause;
    list.push(silence(head, `${i}a`), clean, silence(pause, `${i}b`));
    segments.push({ id: seg.id, start: +t.toFixed(3), speechStart: +(t + head).toFixed(3), speechEnd: +(t + head + speech).toFixed(3), end: +(t + head + speech + pause).toFixed(3), pause });
    t += head + speech + pause;
  }
  const concat = path.join(work, "concat.txt");
  fs.writeFileSync(concat, list.map((f) => `file '${f.replace(/\\/g, "/").replace(/'/g, "'\\''")}'`).join("\n"));
  const out = path.join(audioDir, "voice.wav");
  ffmpeg(["-f", "concat", "-safe", "0", "-i", concat, "-c:a", "pcm_s16le", out]);
  const total = duration(out);
  writeJson(path.join(audioDir, "timings.json"), { duration: +total.toFixed(3), segments });
  remove(work);
  console.log(`✓ Lồng tiếng: ${rel(dir, out)} dài ${fmtTime(total)} (${ep.segments.length} đoạn)`);
  console.log(`  Mốc từng đoạn: audio/timings.json. Bước tiếp: hs podcast ${name}`);
  return 0;
};
