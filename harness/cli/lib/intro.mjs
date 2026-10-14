// Đoạn mở đầu thương hiệu: từ khối `intro:` trong episode.yaml, tạo thêm một đoạn lồng tiếng + một cảnh "intro"
// (trang giấy, tên vụ án viết dần, đóng dấu). Dùng chung cho mọi tập, chỉ đổi số hồ sơ và tên vụ án.

export const expandIntro = (ep, cfg) => {
  const it = ep.intro;
  if (!it || it.enabled === false) return ep;
  const base = cfg.intro ?? {};
  const n = it.number ?? 1;
  const title = it.title;
  if (!title) throw new Error('Khối intro cần có `title` (tên vụ án).');
  const say =
    it.say ??
    String(base.say)
      .replace("{thứ}", base.ordinals?.[n] ?? String(n))
      .replace("{title}", title)
      .replace("{số}", String(n));
  const pause = it.pause ?? base.pause ?? 2;
  const hasSub = !!it.subtitle;
  const stampDelay = it.stampDelay ?? (hasSub ? (base.stampDelay ?? 1.15) : 0.5);
  const seg = {
    id: "intro",
    text: say,
    pause,
    sfx: [
      { name: "paper", at: 0, gain: 0.7 },
      { name: "pen", cue: title, until: { cue: "@pause", offset: hasSub ? stampDelay - 0.2 : 0.25 }, gain: 0.6 },
      { name: "stamp", cue: "@pause", offset: stampDelay },
    ],
    shots: [
      {
        id: "intro",
        type: "intro",
        labelCue: it.labelCue ?? "Hồ sơ thứ",
        titleCue: title,
        stampDelay,
        intro: {
          brandLine: base.brandLine ?? "HỒ SƠ SỬ VIỆT",
          label: `${base.label ?? "HỒ SƠ SỐ"} ${String(n).padStart(2, "0")}`,
          meta: it.meta ?? null,
          title,
          subtitle: it.subtitle ?? null,
          stamp: it.stamp ?? base.stamp ?? "ĐANG ĐIỀU TRA",
          paper: it.paper ?? base.paper ?? "brand/paper.jpg",
        },
      },
    ],
  };
  const segments = [...ep.segments];
  const idx = it.after ? segments.findIndex((s) => s.id === it.after) : -1;
  if (it.after && idx < 0) throw new Error(`intro.after: không có đoạn "${it.after}".`);
  segments.splice(idx + 1, 0, seg);
  return { ...ep, segments };
};
