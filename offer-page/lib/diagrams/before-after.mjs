import { esc, rich, icon } from "../html.mjs";

// ビフォー → アフター
export function renderBeforeAfter(d) {
  const col = (side, cls, ic) => `
  <div class="dg-ba__col ${cls}">
    <div class="dg-ba__title">${icon(ic)}${esc(side.title)}</div>
    <ul>${side.items.map((i) => `<li>${rich(i)}</li>`).join("")}</ul>
  </div>`;
  return `
<figure class="dg dg-ba">
  ${col(d.before, "dg-ba__col--before", "cloud")}
  <div class="dg-ba__arrow"><span>${esc(d.arrow ?? "")}</span></div>
  ${col(d.after, "dg-ba__col--after", "sun")}
</figure>`;
}
