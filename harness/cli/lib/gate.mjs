// Cổng duyệt của người dùng (human in the loop): kịch bản → lồng tiếng → (mới được tạo hình, dựng video).
// Duyệt gắn với dấu vân tay của LỜI ĐỌC: sửa lời sau khi duyệt thì phải duyệt lại.
import fs from "node:fs";
import path from "node:path";
import { readJson, writeJson, ensureDir } from "./core.mjs";
import { hashText, spokenText } from "./episode.mjs";

export const GATES = {
  script: { label: "kịch bản", needs: null, review: "hs review <tập> script", before: "lồng tiếng (tốn credit)" },
  voice: { label: "lồng tiếng", needs: "script", review: "hs review <tập> voice", before: "tạo hình ảnh và dựng video (tốn credit)" },
};

export const textHash = (ep, pron) => hashText(ep.segments.map((s) => `${s.id}|${spokenText(s, pron)}`).join("\n"));
export const approvalsFile = (dir) => path.join(dir, "review", "approvals.json");
export const readApprovals = (dir) => readJson(approvalsFile(dir), {});

export const gateStatus = (dir, ep, pron, gate) => {
  const g = GATES[gate];
  const all = readApprovals(dir);
  if (g.needs) {
    const up = gateStatus(dir, ep, pron, g.needs);
    if (!up.ok) return up;
  }
  const a = all[gate];
  if (!a) return { ok: false, why: `Chưa duyệt ${g.label}.` };
  if (a.hash !== textHash(ep, pron)) return { ok: false, why: `Lời đọc đã đổi sau khi duyệt ${g.label} (${a.at?.slice(0, 16).replace("T", " ")}), cần duyệt lại.` };
  return { ok: true, approvedAt: a.at, note: a.note };
};

export const approve = (dir, ep, pron, gate, note) => {
  const all = readApprovals(dir);
  ensureDir(path.dirname(approvalsFile(dir)));
  all[gate] = { hash: textHash(ep, pron), at: new Date().toISOString(), note: note ?? null };
  writeJson(approvalsFile(dir), all);
};

// Dừng lại và nói rõ cần người dùng duyệt gì. Trả về true nếu bị chặn.
export const blocked = (name, dir, ep, pron, gate, opts = {}) => {
  if (opts["skip-review"]) return false;
  const st = gateStatus(dir, ep, pron, gate);
  if (st.ok) return false;
  const g = GATES[gate];
  console.log(`\n⛔ Dừng: ${st.why}`);
  console.log(`   Cần người dùng duyệt ${g.label} trước khi ${g.before}.`);
  console.log(`   1) ${g.review.replace("<tập>", name)}   → đọc review/${gate === "script" ? "kich-ban" : "long-tieng"}.md`);
  console.log(`   2) Người dùng đồng ý (hoặc yêu cầu sửa rồi duyệt lại) → hs approve ${name} ${gate}`);
  console.log(`   (Chỉ chạy hs approve khi người dùng đã nói rõ là duyệt. Bỏ qua cổng: --skip-review.)`);
  return true;
};
