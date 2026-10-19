import { esc, rich, icon } from "../html.mjs";

// 中心のテーマから 3 方向へ広がる
export function renderRadiate(d) {
  return `
<figure class="dg dg-rad">
  <div class="dg-rad__center"><small>${esc(d.centerLabel ?? "")}</small>${rich(d.center)}</div>
  <ul class="dg-rad__branches">
    ${d.branches
      .map(
        (b) => `<li><div class="dg-rad__head">${icon(b.icon)}${esc(b.label)}</div><p>${rich(b.text)}</p></li>`
      )
      .join("")}
  </ul>
</figure>`;
}
