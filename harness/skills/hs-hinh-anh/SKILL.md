---
name: hs-hinh-anh
description: Tạo ảnh và clip còn thiếu cho một tập Hồ Sơ Sử Việt bằng Higgsfield theo assets/todo.json của harness, rồi ghi link vào assets/urls.json để tải về.
---

# Tạo hình ảnh cho tập Hồ Sơ Sử Việt

Model nên dùng: **Sonnet** (cần nhìn ảnh để duyệt).

## Các bước
1. `cd <ho-so-su-viet>/harness && ./hs assets epNN-...`
   - Lệnh tự chép hình từ thư viện, rồi ghi `episodes/epNN-.../assets/todo.json` (mã thoát 3) gồm từng cảnh, `params` đầy đủ và credit.
   - Báo người dùng tổng credit, xin duyệt nếu > 60 credit.
2. Ảnh trước, clip sau (clip dùng ảnh làm khung đầu qua `startFrom`).
   - Ảnh: gọi Higgsfield generate_image (hoặc generate_image_batch khi nhiều ảnh) với đúng `params` trong todo
     (model, resolution, aspect_ratio, prompt, medias). Lỗi 429: chờ rồi gửi lại các ảnh hỏng.
   - Clip: generate_video với `params`; nếu mục có `needs` thì phải tải ảnh khung đầu trước (bước 3) rồi chạy lại `./hs assets`
     để `medias` có job id ảnh. Nếu Higgsfield gợi ý preset, từ chối và gửi lại.
3. Chờ xong (jobs_wait), **xem từng ảnh**: sai trang phục (kiểu Trung Quốc/Nhật), có chữ, sai nhân vật → tạo lại ảnh đó.
4. Ghi link kết quả vào `episodes/epNN-.../assets/urls.json` dạng `{"s03-2": "https://...png", "s04-4": "https://...mp4"}`
   (ghi thêm vào file nếu đã có, giữ link cũ).
5. Máy ảo không tải được link Higgsfield. Nhắn người dùng chạy trong PowerShell:
   `cd C:\Users\DreamStore\Videos\ho-so-su-viet\harness; .\hs fetch epNN-...`
   Lệnh tải các link mới trong urls.json, chuẩn hóa (ảnh JPG 2400px, clip 1080p 30fps không tiếng) và ghi manifest.
6. Chạy lại `./hs assets epNN-...` — phải báo "Đủ hình cho mọi cảnh".
7. Hình đẹp, dùng được cho tập khác (bảng hồ sơ, bản đồ, cung điện...): đề xuất thêm vào `library/index.yaml` kèm tags.
