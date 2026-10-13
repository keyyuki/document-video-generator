// Chuẩn hóa chữ trước khi lồng tiếng: số → chữ, ngày tháng, chữ cái đứng riêng, từ điển thay thế.

const DIGITS = ["không", "một", "hai", "ba", "bốn", "năm", "sáu", "bảy", "tám", "chín"];

// Đọc số 0..999
const readHundreds = (n, full) => {
  const tr = Math.floor(n / 100);
  const ch = Math.floor((n % 100) / 10);
  const dv = n % 10;
  const out = [];
  if (tr > 0 || full) out.push(`${DIGITS[tr]} trăm`);
  if (ch === 0) {
    if (dv > 0 && (tr > 0 || full)) out.push("linh");
  } else if (ch === 1) out.push("mười");
  else out.push(`${DIGITS[ch]} mươi`);
  if (dv > 0) {
    if (dv === 1 && ch > 1) out.push("mốt");
    else if (dv === 5 && ch > 0) out.push("lăm");
    else if (dv === 4 && ch > 1) out.push("tư");
    else out.push(DIGITS[dv]);
  }
  return out.join(" ");
};

export const numberToVietnamese = (num) => {
  let n = Math.floor(Math.abs(num));
  if (n === 0) return "không";
  const units = ["", "nghìn", "triệu", "tỷ"];
  const groups = [];
  while (n > 0) {
    groups.push(n % 1000);
    n = Math.floor(n / 1000);
  }
  const parts = [];
  for (let i = groups.length - 1; i >= 0; i--) {
    const g = groups[i];
    if (g === 0) continue;
    const full = i < groups.length - 1; // nhóm sau nhóm đầu phải đọc đủ "không trăm"
    parts.push(`${readHundreds(g, full)}${units[i] ? " " + units[i] : ""}`.trim());
  }
  return (num < 0 ? "âm " : "") + parts.join(" ");
};

const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const LETTER = "A-Za-zÀ-ỹĐđ";

export const normalizeText = (text, pron = {}) => {
  let t = String(text);
  // 1) Từ điển thay thế
  for (const [from, to] of Object.entries(pron.replace ?? {})) {
    const word = /^[\p{L}\p{N}]+$/u.test(from);
    const re = word
      ? new RegExp(`(?<![${LETTER}0-9])${escapeRe(from)}(?![${LETTER}0-9])`, "gi")
      : new RegExp(escapeRe(from), "gi");
    t = t.replace(re, to);
  }
  // 2) Ngày dạng 4/8 hoặc 4/8/1442
  if (pron.numbers?.dates !== false) {
    t = t.replace(/\b(\d{1,2})\/(\d{1,2})(?:\/(\d{3,4}))?\b/g, (_, d, m, y) => {
      const dn = parseInt(d, 10);
      const day = dn <= 10 ? `mùng ${numberToVietnamese(dn)}` : numberToVietnamese(dn);
      const mon = parseInt(m, 10) === 4 ? "tư" : numberToVietnamese(parseInt(m, 10));
      return `${day} tháng ${mon}${y ? ` năm ${numberToVietnamese(parseInt(y, 10))}` : ""}`;
    });
  }
  // 3) Số còn lại (bỏ dấu chấm phân cách hàng nghìn: 1.000.000)
  if (pron.numbers?.enabled !== false) {
    t = t.replace(/\d{1,3}(?:\.\d{3})+(?!\d)|\d+/g, (m) => numberToVietnamese(parseInt(m.replace(/\./g, ""), 10)));
  }
  // 4) Chữ cái đứng riêng: "Giả thuyết B" → "Giả thuyết Bê"
  for (const [L, say] of Object.entries(pron.letters ?? {})) {
    const re = new RegExp(`(?<![${LETTER}])${escapeRe(L)}(?![${LETTER}])`, "g");
    t = t.replace(re, say);
  }
  return t.replace(/\s+/g, " ").trim();
};

// Dạng rút gọn để so khớp vị trí (bỏ dấu câu, chữ thường).
export const plain = (s) =>
  String(s)
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
