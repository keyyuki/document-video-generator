// Trộn podcast: giọng + nền (mưa, trầm) + tiếng động theo mốc + nhạc (tùy chọn).
// Giữ riêng từng lớp: audio/voice.wav, audio/bed.wav; bản trộn: audio/mix.wav (cho video) và audio/podcast.mp3.
import fs from "node:fs";
import path from "node:path";
import { HARNESS, remove, loadEpisode, ffmpeg, loudness, fail, ensureDir, rel, writeJson, fmtTime } from "../lib/core.mjs";
import { loadTimings, buildSfx } from "../lib/episode.mjs";
import { synthBed, synthSfx, mixInto, writeWav, readWavMono, SFX_NAMES } from "../lib/synth.mjs";

const findLibrarySfx = (name) => {
  const dir = path.join(HARNESS, "library", "sfx");
  if (!fs.existsSync(dir)) return null;
  const f = fs.readdirSync(dir).find((x) => path.parse(x).name === name && /\.(wav|mp3|ogg|m4a|flac)$/i.test(x));
  return f ? path.join(dir, f) : null;
};

const resolveMusic = (dir, music) => {
  if (!music) return null;
  for (const base of [dir, HARNESS]) {
    const p = path.resolve(base, music);
    if (fs.existsSync(p)) return p;
  }
  fail(`Không tìm thấy file nhạc "${music}" (tìm trong thư mục tập và thư mục harness).`);
};

export default async ([name]) => {
  const { dir, ep, cfg, pron } = loadEpisode(name);
  const timings = loadTimings(dir);
  if (!timings) fail(`Chưa có audio/timings.json. Chạy "hs voice ${name}" trước.`);
  const audioDir = path.join(dir, "audio");
  const voice = path.join(audioDir, "voice.wav");
  if (!fs.existsSync(voice)) fail(`Thiếu audio/voice.wav. Chạy "hs voice ${name}".`);
  const work = path.join(audioDir, ".work");
  ensureDir(work);

  // 1) Nền + tiếng động
  const bedCfg = cfg.audio.bed ?? {};
  const [L, R] = synthBed(timings.duration, bedCfg);
  const cues = buildSfx(ep, timings, pron);
  const cache = {};
  const used = [];
  for (const cue of cues) {
    if (!cache[cue.name]) {
      const lib = findLibrarySfx(cue.name);
      if (lib) {
        const tmp = path.join(work, `sfx-${cue.name}.wav`);
        ffmpeg(["-i", lib, "-ar", "48000", "-ac", "1", "-c:a", "pcm_s16le", tmp]);
        cache[cue.name] = { data: readWavMono(tmp), from: rel(HARNESS, lib), lib: true };
      } else {
        const s = synthSfx(cue.name);
        if (!s) fail(`Tiếng động "${cue.name}" không có trong library/sfx và không tổng hợp được (có sẵn: ${SFX_NAMES.join(", ")}).`);
        cache[cue.name] = { data: s, from: "tổng hợp", lib: false };
      }
    }
    // File thật thường to hơn bản tổng hợp → hạ mặc định
    const base = cache[cue.name].lib ? 0.5 : 1;
    mixInto(L, R, cache[cue.name].data, cue.time, (cue.gain ?? 1) * base * (bedCfg.fx ?? 0.2));
    used.push({ name: cue.name, time: +cue.time.toFixed(2), segment: cue.segment, from: cache[cue.name].from });
  }
  const bed = path.join(audioDir, "bed.wav");
  writeWav(bed, [L, R]);

  // 2) Trộn: nền + nhạc tự hạ khi có giọng, chuẩn hóa âm lượng
  const music = resolveMusic(dir, ep.music ?? cfg.audio.music);
  const inputs = ["-i", voice, "-i", bed];
  let graph =
    "[0:a]aformat=channel_layouts=stereo,highpass=f=70,acompressor=threshold=-20dB:ratio=3:attack=5:release=80[v];" +
    "[v]asplit=2[vm][vs];";
  let under = "[1:a]";
  if (music) {
    inputs.push("-stream_loop", "-1", "-i", music);
    const vol = ep.musicVolume ?? cfg.audio.musicVolume ?? 0.1;
    const fadeOut = Math.max(0, timings.duration - 3).toFixed(2);
    graph += `[2:a]aformat=channel_layouts=stereo,aresample=48000,atrim=0:${timings.duration},volume=${vol},afade=t=in:d=2,afade=t=out:st=${fadeOut}:d=3[mu];`;
    graph += "[1:a][mu]amix=inputs=2:normalize=0:duration=first[under0];";
    under = "[under0]";
  }
  graph += `${under}[vs]sidechaincompress=threshold=0.03:ratio=6:attack=20:release=400[bd];`;
  graph += `[vm][bd]amix=inputs=2:normalize=0:duration=shortest,loudnorm=I=${cfg.audio.loudness}:TP=-1.5:LRA=11[out]`;
  const mix = path.join(audioDir, "mix.wav");
  ffmpeg([...inputs, "-filter_complex", graph, "-map", "[out]", "-ar", "48000", "-c:a", "pcm_s16le", "-t", String(timings.duration), mix]);
  const mp3 = path.join(audioDir, "podcast.mp3");
  ffmpeg(["-i", mix, "-c:a", "libmp3lame", "-b:a", "192k", "-metadata", `title=${ep.title ?? ep.id}`, mp3]);
  remove(work);

  const lv = loudness(voice), lb = loudness(bed), lm = loudness(mix);
  writeJson(path.join(audioDir, "podcast.json"), { duration: timings.duration, music: music ? rel(dir, music) : null, sfx: used, loudness: { voice: lv, bed: lb, mix: lm } });
  console.log(`✓ Podcast: ${rel(dir, mp3)} (${fmtTime(timings.duration)}), bản cho video: ${rel(dir, mix)}`);
  console.log(`  Tiếng động: ${used.length} (${[...new Set(used.map((u) => u.name))].join(", ") || "không có"})${music ? `, nhạc: ${path.basename(music)}` : ", chưa có nhạc"}`);
  console.log(`  Âm lượng: giọng ${lv.toFixed(1)} · nền ${lb.toFixed(1)} · tổng ${lm.toFixed(1)} LUFS (mục tiêu ${cfg.audio.loudness})`);
  if (lv - lb < 10) console.log(`  ⚠ Nền chỉ nhỏ hơn giọng ${(lv - lb).toFixed(1)} dB — nên ≥ 12 dB. Giảm audio.bed trong series.yaml hoặc overrides.`);
  return 0;
};
