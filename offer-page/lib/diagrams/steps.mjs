import { esc, rich, icon, COLORS, MENU_ICON, CIRCLED } from "../html.mjs";

// 過去・今・未来の 3 ステップ（術式の役割分担）
export function renderSteps(o, menus) {
  const items = o.steps
    .map((s, i) => {
      const m = menus.find((x) => x.no === s.menu) ?? {};
      const color = m.color ?? COLORS[i % COLORS.length];
      return `
    <li class="dg-steps__item c-${color}">
      <span class="dg-steps__time">${esc(s.time)}</span>
      <span class="dg-steps__circle">${icon(MENU_ICON[color] ?? "sparkle")}<b>${esc(s.verb)}</b></span>
      <span class="dg-steps__what">${rich(s.what)}</span>
      <span class="dg-steps__menu">${CIRCLED[s.menu] ?? ""}${esc(m.short ?? "")}</span>
    </li>`;
    })
    .join("");
  return `
<figure class="dg dg-steps" aria-label="${esc(o.heading)}">
  <ol>${items}</ol>
</figure>`;
}
