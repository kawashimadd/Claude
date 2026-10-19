// HTML を組み立てるための共通部品（エスケープ・簡易記法・アイコン・施術の色）

export const esc = (s) =>
  String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

// 文章中の簡易記法: **強調** → マーカー、改行 → <br>
export const rich = (s) =>
  esc(s)
    .replace(/\*\*(.+?)\*\*/g, '<strong class="mark">$1</strong>')
    .replace(/\n/g, "<br>");

export const paras = (list, cls = "") =>
  (list ?? []).map((p) => `<p${cls ? ` class="${cls}"` : ""}>${rich(p)}</p>`).join("\n");

export const yen = (n) => Number(n).toLocaleString("ja-JP");

export const ICONS = {
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
  calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',
  family: '<circle cx="9" cy="6" r="2.5"/><circle cx="17" cy="10" r="2"/><path d="M4.5 21v-5a4.5 4.5 0 0 1 9 0v5M13.5 21v-3a3.5 3.5 0 0 1 7 0v3"/>',
  heart: '<path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/>',
  leaf: '<path d="M5 20c0-9 5-15 15-15 0 10-6 15-14 15"/><path d="M5 20c3-4 6-7 10-9"/>',
  wave: '<path d="M2 10c2.5-4 5-4 7.5 0s5 4 7.5 0 3.5-3 5-1.5"/><path d="M2 16c2.5-4 5-4 7.5 0s5 4 7.5 0 3.5-3 5-1.5"/>',
  sparkle: '<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"/><path d="M19 15l.7 2 2 .7-2 .7-.7 2-.7-2-2-.7 2-.7z"/>',
  coin: '<circle cx="12" cy="12" r="9"/><path d="M8.5 7.5L12 12l3.5-4.5M12 12v5M9 12.5h6M9 15h6"/>',
  briefcase: '<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7V5h8v2M3 12h18"/>',
  home: '<path d="M3 11l9-7 9 7"/><path d="M5 10v10h14V10"/><path d="M10 20v-5h4v5"/>',
  cloud: '<path d="M7 18a4 4 0 0 1-.5-8A5.5 5.5 0 0 1 17 9a4.5 4.5 0 0 1 .5 9z"/>',
  check: '<path d="M5 12.5l4.5 4.5L19 7"/>',
  line: '<path d="M12 3C6.5 3 2 6.6 2 11c0 3.9 3.5 7.2 8.3 7.9.3.1.8.2.9.5l.1 1.3s.1.6.6.3c.5-.3 4.7-2.8 6.6-5.1C20.8 14.4 22 12.8 22 11c0-4.4-4.5-8-10-8z"/>',
};

export const icon = (name, cls = "icon") =>
  ICONS[name]
    ? `<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name]}</svg>`
    : "";

export const COLORS = ["sage", "lavender", "gold", "rose"];
export const MENU_ICON = { sage: "leaf", lavender: "wave", gold: "sparkle", rose: "heart" };
export const CIRCLED = ["", "①", "②", "③", "④", "⑤", "⑥"];
