// Ghi nhận người dùng đã duyệt một cổng: `hs approve <tập> script|voice [--note "..."]`. Không đối số cổng → xem trạng thái.
import { loadEpisode, fail } from "../lib/core.mjs";
import { GATES, gateStatus, approve } from "../lib/gate.mjs";

export default async ([name, gate], opts) => {
  const { dir, ep, pron } = loadEpisode(name);
  if (!gate) {
    for (const g of Object.keys(GATES)) {
      const st = gateStatus(dir, ep, pron, g);
      console.log(`${st.ok ? "✓" : "✗"} ${GATES[g].label}: ${st.ok ? `đã duyệt ${st.approvedAt.slice(0, 16).replace("T", " ")}${st.note ? ` — ${st.note}` : ""}` : st.why}`);
    }
    return 0;
  }
  if (!GATES[gate]) fail(`Cổng "${gate}" không có. Dùng: ${Object.keys(GATES).join(" | ")}`);
  const up = GATES[gate].needs && gateStatus(dir, ep, pron, GATES[gate].needs);
  if (up && !up.ok) fail(`Chưa thể duyệt ${GATES[gate].label}: ${up.why}`);
  approve(dir, ep, pron, gate, typeof opts.note === "string" ? opts.note : null);
  console.log(`✓ Đã ghi nhận duyệt ${GATES[gate].label} cho ${ep.id}.`);
  return 0;
};
