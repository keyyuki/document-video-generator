# Harness "Hồ Sơ Sử Việt" – bản thống nhất v1 (13/10/2026)

## Quyết định đã chốt
- Nội dung các tập nằm ở `ho-so-su-viet/episodes/`, tách khỏi `harness/`.
- Script viết hoàn toàn bằng Node.js (ffmpeg kèm qua npm), chạy thẳng trên Windows.
- Phạm vi v1: lõi + kiểm thử bằng tập 1. Animatic, thư viện animation, Shorts, thumbnail để v2.
- Lồng tiếng chia theo đoạn ý 2–3 câu.
- Higgsfield (lồng tiếng, ảnh, clip) do Claude gọi qua connector theo skill; script lo phần còn lại.
- Link Higgsfield chỉ tải được từ Windows: Claude ghi link vào "hộp thư" (`audio/tts-urls.json`, `assets/urls.json`),
  người dùng chạy `hs voice` / `hs fetch` trong PowerShell.

## Cấu trúc
harness/
  README.md, hs.cmd (Windows), hs (máy ảo)
  config/series.yaml        giọng đọc, phong cách, nhân vật, font, màu, chuẩn âm lượng
  config/phat-am.yaml       từ điển đọc (số → chữ, A/Bê/Xê, viết tắt)
  templates/episode.yaml    mẫu kịch bản có chú thích
  schema/episode.schema.json
  cli/                      lệnh `hs`
  remotion/                 khung dựng video (Episode, Overlays, Fx: mưa/lửa/tàn lửa/hạt phim)
  library/{fonts,shots,sfx,music}/ + index.yaml
  skills/                   bản gốc skill cho Claude
episodes/epNN-ten/
  episode.yaml  audio/  assets/  out/

## Lệnh v1
hs new | hs check | hs voice | hs podcast | hs assets | hs fetch | hs qc | hs render

## Skill v1 (gộp từ 4 xuống 3)
hs-kich-ban (Opus/Sonnet) · hs-hinh-anh (Sonnet) · hs-san-xuat = lồng tiếng + podcast + dựng (Haiku)

## Tiêu chí hoàn thành v1 — ĐẠT
Tập 1 đã chuyển sang `episodes/ep01-le-chi-vien/episode.yaml` (15 đoạn, 53 cảnh, 10 cảnh lấy từ thư viện)
và dựng lại được video tương đương chỉ bằng các lệnh `hs` (check → voice → podcast → assets → fetch → qc → render).

## Để v2
Animatic xem trước, thư viện animation, Shorts dọc, thumbnail, căn cue theo mốc từng từ (thay cho ước lượng theo số chữ).
