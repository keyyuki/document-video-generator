#!/usr/bin/env node
// Lệnh `hs` – harness sản xuất phim tài liệu "Hồ Sơ Sử Việt".
import { HsError } from "./lib/core.mjs";

const HELP = `
Cách dùng: hs <lệnh> <tập> [tùy chọn]

  new <tập> [--title "..."]          Tạo thư mục tập mới từ mẫu
  check <tập>                         Kiểm tra kịch bản episode.yaml
  voice <tập>                         Ghép lồng tiếng + quãng nghỉ → audio/voice.wav, timings.json
        --set s01=<url|file>          Ghi file lồng tiếng của một đoạn (lặp lại được)
        --from <file.json>            Ghi nhiều đoạn một lúc {"s01": "url", ...}
  podcast <tập>                       Trộn giọng + nền + tiếng động + nhạc → audio/podcast.mp3, mix.wav
  assets <tập>                        Liệt kê cảnh thiếu hình, lấy từ thư viện, xuất assets/todo.json
  fetch <tập> --set <cảnh>=<url|file> Tải hình/clip về đúng chỗ và chuẩn hóa (hoặc --from file.json)
  qc <tập>                            Kiểm tra toàn bộ trước khi xuất
  render <tập> [--preview] [--stills 5,16.1]   Xuất video (hoặc ảnh từng khung để xem nhanh)

Ví dụ: hs voice ep02 --set s03=https://.../s03.mp3
`;

const parseArgs = (argv) => {
  const pos = [];
  const opts = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith("--")) {
      const [k, inline] = a.slice(2).split(/=(.*)/s);
      const next = argv[i + 1];
      const val = inline !== undefined ? inline : next && !next.startsWith("--") ? (i++, next) : true;
      if (opts[k] === undefined) opts[k] = val;
      else opts[k] = [].concat(opts[k], val);
    } else pos.push(a);
  }
  return { pos, opts };
};

const COMMANDS = {
  new: () => import("./commands/new.mjs"),
  check: () => import("./commands/check.mjs"),
  voice: () => import("./commands/voice.mjs"),
  podcast: () => import("./commands/podcast.mjs"),
  assets: () => import("./commands/assets.mjs"),
  fetch: () => import("./commands/fetch.mjs"),
  qc: () => import("./commands/qc.mjs"),
  render: () => import("./commands/render.mjs"),
};

const main = async () => {
  const { pos, opts } = parseArgs(process.argv.slice(2));
  const [cmd, ...rest] = pos;
  if (!cmd || cmd === "help" || opts.help) {
    console.log(HELP);
    return 0;
  }
  const load = COMMANDS[cmd];
  if (!load) {
    console.error(`Không có lệnh "${cmd}".\n${HELP}`);
    return 2;
  }
  const mod = await load();
  return (await mod.default(rest, opts)) ?? 0;
};

main()
  .then((code) => process.exit(code))
  .catch((e) => {
    if (e instanceof HsError) {
      console.error(`✗ ${e.message}`);
      process.exit(1);
    }
    console.error(e);
    process.exit(1);
  });
