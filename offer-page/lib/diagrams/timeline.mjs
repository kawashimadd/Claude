import { esc, rich, icon } from "../html.mjs";

// 未来の一日（タイムライン）
export function renderTimeline(f) {
  return `
<ol class="dg dg-time">
  ${f.scenes
    .map(
      (s) => `<li><span class="dg-time__dot">${icon(s.icon)}</span><div><b class="dg-time__when">${esc(s.when)}</b><p>${rich(s.text)}</p></div></li>`
    )
    .join("")}
</ol>`;
}
