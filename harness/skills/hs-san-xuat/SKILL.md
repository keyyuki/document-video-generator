---
name: hs-san-xuat
description: Lồng tiếng, trộn podcast rồi DỪNG để người dùng nghe duyệt (cổng 2); sau khi duyệt mới kiểm tra và xuất video một tập Hồ Sơ Sử Việt bằng lệnh hs (voice, podcast, review, qc, render). Chỉ dùng sau khi người dùng đã duyệt kịch bản.
---

# Lồng tiếng, podcast và dựng video tập Hồ Sơ Sử Việt

Model nên dùng: **Haiku** (các bước máy móc, theo đúng thứ tự).

## Điều kiện bắt đầu
Kịch bản đã được người dùng duyệt (`./hs.sh approve epNN-...` không đối số cho xem trạng thái; cổng "kịch bản" phải ✓). Nếu chưa: quay lại skill hs-kich-ban, đừng lồng tiếng.

## Lồng tiếng
1. `cd <ho-so-su-viet>/harness && ./hs.sh voice epNN-...`
   - Mã thoát 3: đọc `episodes/epNN-.../audio/tts-todo.json`. Với mỗi đoạn, gọi Higgsfield tạo giọng đọc bằng `voice`
     trong file (model text2speech_v2, variant elevenlabs, voice_id có sẵn) với đúng `text` đã chuẩn hóa. Không thêm thẻ <break>
     (không có tác dụng) — quãng nghỉ do harness tự chèn.
   - Ghi link vào `audio/tts-urls.json` dạng `{"s01": "https://...mp3"}` (giữ link cũ).
   - Nhắn người dùng chạy trong PowerShell: `.\hs voice epNN-...` (máy ảo không tải được link Higgsfield).
2. Khi `voice` báo "✓ Lồng tiếng", chạy `./hs.sh podcast epNN-...`.
   - Đọc dòng âm lượng: nền phải nhỏ hơn giọng ≥ 12 dB; tổng ≈ −14 LUFS.
3. **CỔNG DUYỆT 2 — lồng tiếng (bắt buộc, dừng ở đây, chưa tạo hình).**
   - Chạy `./hs.sh review epNN-... voice` → `review/long-tieng.md` (mốc từng đoạn, tốc độ đọc, đoạn đọc nhanh/chậm, chỗ số/viết tắt bị đổi thành chữ). Bổ sung `review/ghi-chu.md` nếu có điều cần nghe kỹ (tên riêng khó đọc…).
   - Gửi người dùng `audio/podcast.mp3` (bản đã trộn) và `review/long-tieng.md`; nói rõ tổng thời lượng thật so với dự kiến.
   - **Không tạo ảnh/clip và không render** trong lúc chờ. Dừng và chờ người dùng.
   - Người dùng nêu đoạn cần sửa → sửa `text` (hoặc `voice:` để sửa cách đọc, `pause`) → lặp lại bước 1 chỉ cho đoạn đó (tốn rất ít credit) → `podcast` → `review voice` → gửi lại. Nếu thời lượng thay đổi nhiều, báo trước ảnh hưởng đến cue/hình.
   - Nếu người dùng muốn đổi nội dung kịch bản (không chỉ cách đọc): quay lại cổng 1 (sửa yaml, `review script`, duyệt lại), vì lời đổi làm mất cả hai duyệt.
   - Chỉ khi người dùng nói rõ là duyệt: `./hs.sh approve epNN-... voice --note "..."`. Rồi mới sang skill hs-hinh-anh.
   - `hs assets` sẽ tự dừng (mã 4) nếu lồng tiếng chưa duyệt.

## Dựng video
4. Hình đã đủ (skill hs-hinh-anh). Chạy `./hs.sh qc epNN-...`; sửa hết lỗi ✗. Cảnh báo cảnh quá ngắn: dời `cue` trong episode.yaml.
5. Nhắn người dùng chạy trong PowerShell:
   - `.\hs render epNN-... --stills 5,20,60` → xem ảnh trong `out/stills/` (Claude đọc ảnh để kiểm tra chữ, bố cục).
   - `.\hs render epNN-...` → video `out/epNN-....mp4` (5 phút ≈ 15–30 phút dựng). `--preview` cho bản nhẹ để xem nhanh.
6. Kiểm tra video: thời lượng khớp `audio/timings.json`, xem vài khung hình đầu/giữa/cuối.

## Thứ tự và cổng duyệt (tóm tắt)
kịch bản → **[duyệt 1]** → lồng tiếng + podcast → **[duyệt 2]** → hình ảnh → qc + ảnh xem trước → render.
Thứ tự này tránh phí: lồng tiếng chỉ ~17 credit nhưng hình ~25+ credit và dựng video mất nhiều giờ; sửa sớm rẻ hơn rất nhiều.

## Ghi chú
- Không chạy `npm install` trong máy ảo (sẽ hỏng bản cài Windows).
- Máy ảo không xóa được file; thư mục tạm `.work`, `.download` để lại cũng không sao.

## Bổ sung v2
- Lồng tiếng cũng bị giới hạn tốc độ: gửi ≤ 7–8 đoạn một lượt, rồi gửi lại những đoạn bị từ chối. Link ghi vào `audio/tts-urls.json` (khóa là id đoạn, kể cả `intro`).
- Máy ảo không tải được link Higgsfield: người dùng chạy `.\hs voice`, `.\hs fetch`, `.\hs podcast`, `.\hs render` trên Windows.
- Render dài (10 phút) nên chạy trên máy người dùng; duyệt nhanh bằng `--stills` hoặc `--range`.
