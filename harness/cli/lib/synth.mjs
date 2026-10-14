// Tổng hợp nền âm thanh và tiếng động bằng code (không cần file ngoài).
// Dùng khi thư viện library/sfx chưa có file thật cùng tên.
import fs from "node:fs";

export const SR = 48000;

const rng = (seed) => {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};
const gauss = (r) => () => {
  const u = Math.max(r(), 1e-9);
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * r());
};

// Bộ lọc biquad (RBJ). type: lowpass | highpass | bandpass
const biquad = (x, type, f, q = Math.SQRT1_2) => {
  const w = (2 * Math.PI * f) / SR;
  const cs = Math.cos(w);
  const al = Math.sin(w) / (2 * q);
  let b0, b1, b2;
  if (type === "lowpass") [b0, b1, b2] = [(1 - cs) / 2, 1 - cs, (1 - cs) / 2];
  else if (type === "highpass") [b0, b1, b2] = [(1 + cs) / 2, -(1 + cs), (1 + cs) / 2];
  else [b0, b1, b2] = [al, 0, -al];
  const a0 = 1 + al;
  const a1 = -2 * cs;
  const a2 = 1 - al;
  const y = new Float32Array(x.length);
  let x1 = 0, x2 = 0, y1 = 0, y2 = 0;
  for (let i = 0; i < x.length; i++) {
    const v = (b0 * x[i] + b1 * x1 + b2 * x2 - a1 * y1 - a2 * y2) / a0;
    x2 = x1; x1 = x[i]; y2 = y1; y1 = v; y[i] = v;
  }
  return y;
};
const lp = (x, f, n = 1) => { for (let i = 0; i < n; i++) x = biquad(x, "lowpass", f); return x; };
const bp = (x, lo, hi) => biquad(biquad(x, "highpass", lo), "lowpass", hi);

const noise = (n, seed) => {
  const g = gauss(rng(seed));
  const x = new Float32Array(n);
  for (let i = 0; i < n; i++) x[i] = g();
  return x;
};
const env = (n, attack, decay) => {
  const e = new Float32Array(n);
  const A = Math.max(1, Math.round(attack * SR));
  for (let i = 0; i < n; i++) e[i] = (i < A ? i / A : 1) * Math.exp(-i / (decay * SR));
  return e;
};
const mul = (a, b) => { for (let i = 0; i < a.length; i++) a[i] *= b[i]; return a; };

// ---------- Tiếng động ----------
const SFX = {
  thunder: (seed = 3) => {
    const n = 6 * SR;
    const x = lp(noise(n, seed), 180, 2);
    const wob = lp(noise(n, seed + 1), 3, 1);
    const e = env(n, 0.4, 1.6);
    for (let i = 0; i < n; i++) x[i] *= e[i] * (1 + 0.6 * Math.abs(wob[i] * 40)) * 4;
    return x;
  },
  boom: (seed = 5, f0 = 55, dur = 2.5) => {
    const n = Math.round(dur * SR);
    const x = new Float32Array(n);
    let ph = 0;
    for (let i = 0; i < n; i++) {
      ph += (2 * Math.PI * f0 * Math.exp((-i / SR) * 1.2)) / SR;
      x[i] = Math.sin(ph) * Math.exp(-i / (0.45 * SR));
    }
    const click = mul(lp(noise(n, seed), 900), env(n, 0.001, 0.06));
    for (let i = 0; i < n; i++) x[i] += click[i] * 0.8;
    return x;
  },
  stamp: (seed = 7) => {
    const n = Math.round(1.2 * SR);
    const x = mul(lp(noise(n, seed), 1800), env(n, 0.0005, 0.03));
    for (let i = 0; i < n; i++) x[i] = x[i] * 1.5 + Math.sin((2 * Math.PI * 90 * i) / SR) * Math.exp(-i / (0.12 * SR));
    const b = SFX.boom(seed + 1, 45, 3);
    const out = new Float32Array(b.length);
    for (let i = 0; i < out.length; i++) out[i] = (x[i] ?? 0) + b[i] * 0.6;
    return out;
  },
  bell: (seed = 0, f = 196, dur = 7) => {
    const n = Math.round(dur * SR);
    const x = new Float32Array(n);
    const parts = [[1, 1, 2.6], [2.0, 0.5, 1.8], [2.76, 0.35, 1.2], [5.4, 0.2, 0.6], [0.5, 0.4, 3.2]];
    for (let i = 0; i < n; i++) {
      const t = i / SR;
      let v = 0;
      for (const [r, a, d] of parts) v += a * Math.sin(2 * Math.PI * f * r * t) * Math.exp(-t / d);
      x[i] = v * 0.5;
    }
    return x;
  },
  whoosh: (seed = 11) => {
    const n = Math.round(1.6 * SR);
    const x = noise(n, seed);
    const y = new Float32Array(n);
    // quét bộ lọc dải từ thấp lên cao rồi xuống
    const blocks = 32;
    for (let b = 0; b < blocks; b++) {
      const s = Math.floor((b * n) / blocks), e2 = Math.floor(((b + 1) * n) / blocks);
      const p = b / (blocks - 1);
      const f = 300 + 3500 * Math.sin(Math.PI * p);
      const seg = bp(x.subarray(s, e2), f * 0.7, f * 1.3);
      y.set(seg, s);
    }
    for (let i = 0; i < n; i++) y[i] *= Math.sin((Math.PI * i) / n) ** 2 * 2.2;
    return y;
  },
};
// Tiếng bút lướt trên giấy: các nét ngắn nối nhau, độ dài `dur` giây.
SFX.pen = (seed = 13, dur = 2) => {
  const n = Math.round(dur * SR);
  const r = rng(seed);
  const x = bp(noise(n, seed), 2200, 8500);
  const e = new Float32Array(n);
  let i = 0;
  while (i < n) {
    const len = Math.round((0.07 + r() * 0.2) * SR);
    const gap = Math.round((0.015 + r() * 0.05) * SR);
    const amp = 0.45 + r() * 0.55;
    for (let k = 0; k < len && i + k < n; k++) e[i + k] = Math.sin((Math.PI * k) / len) ** 0.7 * amp;
    i += len + gap;
  }
  const fade = Math.round(0.08 * SR);
  for (let k = 0; k < n; k++) x[k] *= e[k] * Math.min(1, k / fade) * Math.min(1, (n - k) / fade) * 3.2;
  return x;
};
// Tiếng giấy sột soạt lúc đặt trang hồ sơ xuống bàn.
SFX.paper = (seed = 17, dur = 1.3) => {
  const n = Math.round(dur * SR);
  const x = bp(noise(n, seed), 1200, 7000);
  const e = new Float32Array(n);
  for (let k = 0; k < n; k++) {
    const t = k / n;
    e[k] = (0.6 * Math.max(0, Math.sin(Math.PI * t)) ** 1.5 + 0.4 * Math.max(0, Math.sin(Math.PI * t * 3.3 + 0.7)) ** 3) * Math.exp(-t * 1.8);
  }
  for (let k = 0; k < n; k++) x[k] *= e[k] * 2.4;
  return x;
};

export const SFX_NAMES = Object.keys(SFX);
export const synthSfx = (name, opts = {}) => {
  const f = SFX[name];
  if (!f) return null;
  if (name === "pen") return f(13, opts.duration ?? 2);
  return f();
};

// ---------- Nền: mưa + hợp âm trầm ----------
export const synthBed = (seconds, { rain = 0.022, drone = 0.2 } = {}) => {
  const n = Math.round(seconds * SR);
  const L = new Float32Array(n), R = new Float32Array(n);
  if (rain > 0) {
    const rl = bp(noise(n, 21), 500, 7000), rr = bp(noise(n, 22), 500, 7000);
    const drops = new Float32Array(n);
    const r = rng(23);
    for (let k = 0; k < seconds * 60; k++) drops[Math.floor(r() * n)] = (0.3 + 0.7 * r()) * (r() < 0.5 ? -1 : 1);
    const d = bp(drops, 1500, 6000);
    for (let i = 0; i < n; i++) {
      const t = i / SR;
      const swell = 0.75 + 0.25 * Math.sin((2 * Math.PI * t) / 23 + 1) * Math.sin((2 * Math.PI * t) / 9);
      L[i] += (rl[i] * 0.5 + d[i] * 3) * swell * rain;
      R[i] += (rr[i] * 0.5 + d[(i + 331) % n] * 3) * swell * rain;
    }
  }
  if (drone > 0) {
    const tones = [[36.7, 1, 0], [73.4, 0.6, 1], [110, 0.35, 2], [87.3, 0.3, 0.5], [146.8, 0.12, 3]];
    const x = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      const t = i / SR;
      let v = 0;
      for (const [f, a, ph] of tones) v += a * Math.sin(2 * Math.PI * f * t + ph);
      const fade = Math.min(1, t / 6) * Math.min(1, (seconds - t) / 4);
      x[i] = v * (0.7 + 0.3 * Math.sin((2 * Math.PI * t) / 11)) * fade;
    }
    const y = lp(x, 400);
    for (let i = 0; i < n; i++) { L[i] += y[i] * 0.35 * drone; R[i] += y[i] * 0.35 * drone; }
  }
  return [L, R];
};

export const mixInto = (bufL, bufR, clip, time, gain) => {
  const k = Math.round(time * SR);
  for (let i = 0; i < clip.length && k + i < bufL.length; i++) {
    if (k + i < 0) continue;
    bufL[k + i] += clip[i] * gain;
    bufR[k + i] += clip[i] * gain;
  }
};

export const writeWav = (file, channels) => {
  const n = channels[0].length, ch = channels.length;
  const buf = Buffer.alloc(44 + n * ch * 2);
  buf.write("RIFF", 0); buf.writeUInt32LE(36 + n * ch * 2, 4); buf.write("WAVE", 8);
  buf.write("fmt ", 12); buf.writeUInt32LE(16, 16); buf.writeUInt16LE(1, 20); buf.writeUInt16LE(ch, 22);
  buf.writeUInt32LE(SR, 24); buf.writeUInt32LE(SR * ch * 2, 28); buf.writeUInt16LE(ch * 2, 32); buf.writeUInt16LE(16, 34);
  buf.write("data", 36); buf.writeUInt32LE(n * ch * 2, 40);
  let o = 44;
  for (let i = 0; i < n; i++)
    for (let c = 0; c < ch; c++) {
      buf.writeInt16LE(Math.round(Math.max(-1, Math.min(1, channels[c][i])) * 32767), o);
      o += 2;
    }
  fs.writeFileSync(file, buf);
};

// Đọc WAV 16-bit (mono hoặc stereo) → mảng mono Float32 (dùng cho sfx từ thư viện, đã chuẩn hóa qua ffmpeg).
export const readWavMono = (file) => {
  const b = fs.readFileSync(file);
  let p = 12, ch = 1, data = null;
  while (p < b.length) {
    const id = b.toString("ascii", p, p + 4), size = b.readUInt32LE(p + 4);
    if (id === "fmt ") ch = b.readUInt16LE(p + 10);
    if (id === "data") { data = b.subarray(p + 8, p + 8 + size); break; }
    p += 8 + size + (size % 2);
  }
  const n = Math.floor(data.length / (2 * ch));
  const x = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    let v = 0;
    for (let c = 0; c < ch; c++) v += data.readInt16LE((i * ch + c) * 2);
    x[i] = v / ch / 32768;
  }
  return x;
};
