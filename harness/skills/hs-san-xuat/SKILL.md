---
name: hs-san-xuat
description: Lồng tiếng, trộn podcast, kiểm tra và xuất video một tập Hồ Sơ Sử Việt bằng lệnh hs của harness (voice, podcast, qc, render). Dùng sau khi kịch bản đã duyệt.
---

# Lồng tiếng, podcast và dựng video tập Hồ Sơ Sử Việt

Model nên dùng: **Haiku** (các bước máy móc, theo đúng thứ tự).

## Lồng tiếng
1. `cd <ho-so-su-viet>/harness && ./hs voice epNN-...`
   - Mã thoát 3: đọc `episodes/epNN-.../audio/tts-todo.json`. Với mỗi đoạn, gọi Higgsfield tạo giọng đọc bằng `voice`
     trong file (model text2speech_v2, variant elevenlabs, voice_id có sẵn) với đúng `text` đã chuẩn hóa. Không thêm thẻ <break>
     (không có tác dụng) — quãng nghỉ do harness tự chèn.
   - Ghi link vào `audio/tts-urls.json` dạng `{"s01": "https://...mp3"}` (giữ link cũ).
   - Nhắn người dùng chạy trong PowerShell: `.\hs voice epNN-...` (máy ảo không tải được link Higgsfield).
2. Khi `voice` báo "✓ Lồng tiếng", chạy `./hs podcast epNN-...`.
   - Đọc dòng âm lượng: nền phải nhỏ hơn giọng ≥ 12 dB; tổng ≈ −14 LUFS.
   - Gửi người dùng `audio/podcast.mp3` để nghe duyệt. Sửa lời đoạn nào → sửa `text` → lặp lại bước 1 (chỉ đoạn đó tốn credit).

## Dựng video
3. Hình đã đủ (skill hs-hinh-anh). Chạy `./hs qc epNN-...`; sửa hết lỗi ✗. Cảnh báo cảnh quá ngắn: dời `cue` trong episode.yaml.
4. Nhắn người dùng chạy trong PowerShell:
   - `.\hs render epNN-... --stills 5,20,60` → xem ảnh trong `out/stills/` (Claude đọc ảnh để kiểm tra chữ, bố cục).
   - `.\hs render epNN-...` → video `out/epNN-....mp4` (5 phút ≈ 15–30 phút dựng). `--preview` cho bản nhẹ để xem nhanh.
5. Kiểm tra video: thời lượng khớp `audio/timings.json`, xem vài khung hình đầu/giữa/cuối.

## Ghi chú
- Không chạy `npm install` trong máy ảo (sẽ hỏng bản cài Windows).
- Máy ảo không xóa được file; thư mục tạm `.work`, `.download` để lại cũng không sao.
