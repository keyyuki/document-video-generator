import { loadEpisode } from "../lib/core.mjs";
import { validate, listShots, spokenText } from "../lib/episode.mjs";

export default async ([name]) => {
  const { ep, cfg, pron } = loadEpisode(name);
  const { errors, warnings } = validate(ep, pron);
  const shots = listShots(ep);
  const chars = (ep.segments ?? []).reduce((n, s) => n + (s.text ? spokenText(s, pron).length : 0), 0);
  const count = (t) => shots.filter((s) => s.type === t).length;
  console.log(`Tập ${ep.id}: ${ep.segments?.length ?? 0} đoạn, ${shots.length} cảnh (ảnh ${count("image")}, clip ${count("clip")}, thẻ chữ ${count("card")}, mở đầu ${count("intro")})`);
  console.log(`Lời đọc ~${chars} ký tự → lồng tiếng ước tính ${((chars / 1000) * cfg.voice.costPer1000Chars).toFixed(1)} credit, dài khoảng ${Math.round(chars / 15)} giây`);
  for (const w of warnings) console.log(`  ⚠ ${w}`);
  for (const e of errors) console.log(`  ✗ ${e}`);
  if (errors.length) {
    console.log(`\n${errors.length} lỗi cần sửa.`);
    return 1;
  }
  console.log(`✓ Kịch bản hợp lệ${warnings.length ? ` (${warnings.length} cảnh báo)` : ""}.`);
  return 0;
};
