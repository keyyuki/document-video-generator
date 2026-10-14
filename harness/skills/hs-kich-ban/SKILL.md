---
name: hs-kich-ban
description: Viết hoặc sửa kịch bản một tập "Hồ Sơ Sử Việt" thành episode.yaml của harness (lời đọc, quãng nghỉ, tiếng động, danh sách cảnh), rồi DỪNG để người dùng duyệt kịch bản (cổng 1) trước khi lồng tiếng. Dùng khi bắt đầu tập mới hoặc sửa nội dung.
---

# Viết kịch bản tập Hồ Sơ Sử Việt

Model nên dùng: **Opus** (nghiên cứu, giọng kể) hoặc **Sonnet** (sửa nhỏ).

## Vị trí
Thư mục dự án `ho-so-su-viet` trên máy người dùng (trong máy ảo: `$HOME/mnt/Videos/ho-so-su-viet`, trên Windows:
`C:\Users\DreamStore\Videos\ho-so-su-viet`). Lệnh: `cd .../harness && ./hs.sh <lệnh>` (máy ảo) hoặc `.\hs <lệnh>` (PowerShell).

## Các bước
1. Đọc `harness/config/series.yaml` (nhân vật đã có, phong cách) và `harness/templates/episode.yaml` (cú pháp đầy đủ).
   Xem `harness/library/index.yaml` để dùng lại hình sẵn có (không tốn credit).
2. Nghiên cứu sử liệu (tìm web), ghi nguồn. Phân biệt chính sử / dã sử ngay trong lời đọc.
3. Tạo tập nếu chưa có: `./hs.sh new epNN-ten-khong-dau --title "..."`.
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
5. Chạy `./hs.sh check epNN-...` đến khi hết lỗi; cảnh báo thì cân nhắc sửa. `check` cho biết số ký tự và credit ước tính.
6. **CỔNG DUYỆT 1 — kịch bản (bắt buộc, dừng ở đây).**
   - Viết `episodes/epNN-.../review/ghi-chu.md`: nguồn đã dùng, chỗ nào chính sử / dã sử, những ngày tháng–số liệu–tên cần người dùng kiểm chứng, giả định Claude đã đặt ra, chỗ còn phân vân.
   - Chạy `./hs.sh review epNN-... script` → tạo `review/kich-ban.md` (lời đọc từng đoạn, mốc thời gian ước tính, ảnh mới sẽ tạo, credit).
   - Gửi người dùng file đó (SendUserFile hoặc dán nội dung chính) kèm tóm tắt 3–5 dòng: thời lượng, số đoạn, số ảnh mới, tổng credit dự kiến, điều đáng chú ý.
   - **Không gọi Higgsfield, không tạo lồng tiếng, không tạo ảnh** trong lúc chờ. Dừng và chờ người dùng trả lời.
   - Người dùng yêu cầu sửa → sửa `episode.yaml` (lời, thứ tự, thêm/bớt đoạn, đổi hình) → `check` → `review script` lại → gửi lại. Làm lại ở bước này gần như không tốn gì; làm lại sau khi lồng tiếng/tạo ảnh thì tốn credit và thời gian.
   - Chỉ khi người dùng nói rõ là duyệt (“ok”, “duyệt”, “làm tiếp”…): chạy `./hs.sh approve epNN-... script --note "<ý chính người dùng nói>"`, rồi chuyển sang skill hs-san-xuat. Không tự suy ra là đã duyệt vì người dùng im lặng hay nói chung chung.
   - Lệnh `hs voice` sẽ tự dừng (mã 4) nếu kịch bản chưa duyệt; sửa lời sau khi duyệt cũng làm mất duyệt.

## Bổ sung v2
- Đoạn mở đầu thương hiệu: khối `intro:` (after, number, title, subtitle, meta) — xem README. Đặt sau phần mở màn (~20–40 giây đầu).
- Tập dài (~10 phút): ~40 đoạn, mỗi đoạn 2–3 câu; xen các overlay `quote`, `timeline`, `route`, `stamp` để nhịp hình đổi liên tục.
- Dùng lại ảnh bằng `motion: focusIn` + `focus: [x,y]` (cắt cận); chỉ tạo ảnh mới cho cảnh chưa có trong kho. Ảnh mới ghi `id` (vd n301) + `asset: img/n301.jpg` + `prompt`; các cảnh sau chỉ cần `asset`.
- Với sự kiện lịch sử: ghi rõ đâu là chính sử, đâu là dã sử; số liệu/ngày tháng cần người dùng kiểm chứng thì báo trong tin nhắn cuối.
