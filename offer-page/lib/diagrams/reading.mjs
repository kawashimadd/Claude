import { esc, rich, icon } from "../html.mjs";

// 今の状態 →（壁）→ 望む状態
export function renderReading(r) {
  return `
<figure class="dg dg-reading" aria-label="${esc(r.heading)}">
  <div class="dg-reading__box dg-reading__box--now">
    <div class="dg-reading__label">${icon("cloud")}${esc(r.now.label)}</div>
    <ul>${r.now.items.map((i) => `<li>${rich(i)}</li>`).join("")}</ul>
  </div>
  <div class="dg-reading__wall">
    <span class="dg-reading__wall-tag">${esc(r.wall?.label ?? "壁")}</span>
    <p>${rich(r.wall?.text ?? "")}</p>
  </div>
  <div class="dg-reading__box dg-reading__box--wish">
    <div class="dg-reading__label">${icon("heart")}${esc(r.wish.label)}</div>
    <ul>${r.wish.items.map((i) => `<li>${rich(i)}</li>`).join("")}</ul>
  </div>
</figure>`;
}
