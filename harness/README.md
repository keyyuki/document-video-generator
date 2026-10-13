# Harness "Hồ Sơ Sử Việt"

Bộ công cụ sản xuất một tập phim tài liệu từ **một file kịch bản** (`episode.yaml`):
kịch bản → lồng tiếng → podcast (nền, tiếng động, nhạc) → hình ảnh/clip → video.

Claude lo phần sáng tạo và gọi Higgsfield (lồng tiếng, ảnh, clip). Lệnh `hs` lo mọi phần máy móc:
ghép tiếng, tính mốc thời gian, trộn âm, chuẩn hóa hình, kiểm tra, xuất video.

## Cài đặt (một lần, trên Windows)

Cần Node.js 20 trở lên. Mở PowerShell:

```powershell
cd .\harness
npm install
.\hs help
```

`npm install` tự tải ffmpeg và Remotion, không cần cài gì thêm.
**Chỉ chạy `npm install` trên Windows** — chạy ở nơi khác sẽ thay các file chạy bằng bản không dùng được trên Windows.

## Cấu trúc

```
../
  harness/
    config/series.yaml        giọng đọc, phong cách hình, nhân vật, màu, chuẩn âm lượng
    config/phat-am.yaml       từ điển đọc: số → chữ, A/Bê/Xê, viết tắt
    templates/episode.yaml    mẫu kịch bản (có chú thích đầy đủ cú pháp)
    schema/                   mô tả cấu trúc kịch bản (VS Code gợi ý khi gõ)
    library/                  thư viện dùng lại: font, hình (shots/), tiếng động (sfx/), nhạc (music/)
    remotion/                 khung dựng video
    cli/                      mã lệnh hs
    skills/                   hướng dẫn cho Claude (bản gốc)
  episodes/
    ep01-le-chi-vien/
      episode.yaml            kịch bản — nguồn duy nhất
      audio/                  segments/, voice.wav, timings.json, mix.wav, podcast.mp3
      assets/                 img/, clip/, manifest.json
      out/                    video, ảnh kiểm tra
```

## Quy trình một tập

| Bước             | Ai làm                                                                               | Lệnh                                                                    |
| ---------------- | ------------------------------------------------------------------------------------ | ----------------------------------------------------------------------- |
| 1. Tạo tập       | Claude/bạn                                                                           | `hs new ep02-lang-quang-trung --title "..."`                            |
| 2. Viết kịch bản | Claude (skill hs-kich-ban)                                                           | sửa `episode.yaml`, rồi `hs check ep02-...`                             |
| 3. Lồng tiếng    | Claude gọi Higgsfield theo `audio/tts-todo.json`, ghi link vào `audio/tts-urls.json` | `hs voice ep02-...`                                                     |
| 4. Podcast       | máy                                                                                  | `hs podcast ep02-...` → nghe `audio/podcast.mp3`                        |
| 5. Hình ảnh      | Claude gọi Higgsfield theo `assets/todo.json`, ghi link vào `assets/urls.json`       | `hs assets` rồi `hs fetch ep02-...`                                     |
| 6. Kiểm tra      | máy                                                                                  | `hs qc ep02-...`                                                        |
| 7. Xuất          | máy                                                                                  | `hs render ep02-... --stills 5,30` (xem nhanh) rồi `hs render ep02-...` |

Lệnh trả mã 3 nghĩa là "còn việc cho Claude" (file todo vừa được ghi), không phải lỗi.

Sửa một câu lời đọc: sửa `text` trong `episode.yaml` → `hs voice` báo đúng đoạn đó cần đọc lại → chỉ tốn credit cho đoạn đó.
Mọi cảnh bám theo cụm từ (`cue`) nên tự dời theo, không cần chỉnh tay.

## Chạy ở đâu

- **Windows (PowerShell)**: chạy được mọi lệnh. `hs fetch`, `hs render` và `hs voice` khi có link mới **phải** chạy ở đây,
  vì chỉ máy bạn tải được file từ Higgsfield và chạy được trình duyệt dựng video.
- **Claude (máy ảo trong ứng dụng Claude)**: chạy được `check`, `voice` (ghép lại), `podcast`, `assets`, `qc` bằng `./hs`.
  Máy ảo không xóa được file trong thư mục của bạn; file tạm còn sót (`audio/.work`, `assets/.download`) có thể xóa tay.

## Thư viện

- `library/index.yaml`: hình dùng lại (bảng hồ sơ, con dấu, lá bài...). Trong kịch bản ghi `library: bang-ho-so`.
- `library/sfx/`: đặt file `thunder.wav`, `boom.mp3`... để thay tiếng động tổng hợp sẵn (cùng tên là được).
- `library/music/`: nhạc nền; khai báo `audio.music` trong `series.yaml` hoặc `music:` trong từng tập.

## Lỗi thường gặp

- _"cue ... không có trong lời đọc"_: cụm `cue` phải khớp nguyên văn một đoạn trong `text` của chính đoạn đó.
- _"mix.wav cũ hơn timings.json"_: lời đọc đã đổi, chạy lại `hs podcast`.
- _Cảnh ngắn hơn 1,2 giây_: dời `cue` sang cụm từ sau hoặc bỏ bớt cảnh. Vị trí `cue` được ước theo tỉ lệ số chữ, có thể lệch ±0,5 giây.
- _Clip đứng hình cuối_: thêm `fit: true` (tự làm chậm) hoặc tạo clip 5 giây (`clipSeconds: 5`).
