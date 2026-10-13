---
name: hs-kich-ban
description: Viết hoặc sửa kịch bản một tập "Hồ Sơ Sử Việt" thành episode.yaml của harness (lời đọc, quãng nghỉ, tiếng động, danh sách cảnh). Dùng khi bắt đầu tập mới hoặc sửa nội dung.
---

# Viết kịch bản tập Hồ Sơ Sử Việt

Model nên dùng: **Opus** (nghiên cứu, giọng kể) hoặc **Sonnet** (sửa nhỏ).

## Vị trí
Thư mục dự án `ho-so-su-viet` trên máy người dùng (trong máy ảo: `$HOME/mnt/Videos/ho-so-su-viet`, trên Windows:
`C:\Users\DreamStore\Videos\ho-so-su-viet`). Lệnh: `cd .../harness && ./hs <lệnh>` (máy ảo) hoặc `.\hs <lệnh>` (PowerShell).

## Các bước
1. Đọc `harness/config/series.yaml` (nhân vật đã có, phong cách) và `harness/templates/episode.yaml` (cú pháp đầy đủ).
   Xem `harness/library/index.yaml` để dùng lại hình sẵn có (không tốn credit).
2. Nghiên cứu sử liệu (tìm web), ghi nguồn. Phân biệt chính sử / dã sử ngay trong lời đọc.
3. Tạo tập nếu chưa có: `./hs new epNN-ten-khong-dau --title "..."`.
4. Viết `episodes/epNN-.../episode.yaml`:
   - Khung tập: Câu hỏi (hook ≤ 15 giây) → Bối cảnh → Sự kiện → Nguồn → Giả thuyết A/B/C → Phán quyết → Kêu gọi bình luận + hồ sơ tiếp theo.
   - Dài 5 phút ≈ 700–750 chữ. Mỗi `segment` 2–3 câu (đoạn ý). `pause` 1–2 giây sau câu cần người xem ngẫm, mặc định 0,5.
   - Viết số bằng chữ số bình thường (1442, 4/8) — bộ đọc tự đổi. Tên riêng khó đọc: thêm `voice:` với cách đọc.
   - Cảnh: mỗi 2–4 giây một cảnh. Cảnh đầu đoạn không cần cue; cảnh sau ghi `cue` là **cụm từ nguyên văn** trong `text` của đoạn đó.
     Dùng `cue: "@pause"` cho cảnh/tiếng động rơi vào quãng nghỉ (con dấu, thẻ chữ).
   - Mỗi cảnh mới ghi `prompt` tiếng Anh (chỉ mô tả cảnh; phong cách và luật tự thêm), `chars` nếu có nhân vật đã khai báo.
     Ưu tiên `library:` hoặc `asset:` dùng lại; ảnh tĩnh + `motion` thay vì clip; chỉ 4–6 clip/tập ở khoảnh khắc mạnh.
     Mưa, lửa, tàn lửa: dùng `fx` trên ảnh tĩnh thay vì tạo clip.
   - Chữ trên hình (`overlay`) ngắn: stamp ≤ 22 ký tự, center ≤ 28, caption/lowerThird ≤ 40.
   - Tiếng động `sfx`: thunder, boom, stamp, bell, whoosh — tối đa ~1 cái mỗi 20 giây.
   - Nhân vật mới xuất hiện ở nhiều tập: báo người dùng để tạo ảnh tham chiếu và thêm vào `series.yaml`.
5. Chạy `./hs check epNN-...` đến khi hết lỗi; cảnh báo thì cân nhắc sửa. `check` cho biết số ký tự và credit ước tính.
6. Báo người dùng: thời lượng ước tính, số ảnh/clip mới cần tạo, credit ước tính, và hỏi duyệt trước khi lồng tiếng.
