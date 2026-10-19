import { esc, rich } from "../html.mjs";

// 天秤（偏り → 調和）
export function scaleSvg(tiltDeg, left, right, heavyLabel) {
  const cx = 160, cy = 64, half = 108, drop = 54;
  const a = (tiltDeg * Math.PI) / 180;
  const lx = cx - half * Math.cos(a), ly = cy + half * Math.sin(a);
  const rx = cx + half * Math.cos(a), ry = cy - half * Math.sin(a);
  const pan = (x, y, label, cls) => `
    <line x1="${x}" y1="${y}" x2="${x - 34}" y2="${y + drop}" class="sc-string"/>
    <line x1="${x}" y1="${y}" x2="${x + 34}" y2="${y + drop}" class="sc-string"/>
    <path d="M${x - 44} ${y + drop} h88 a44 18 0 0 1 -88 0z" class="sc-pan ${cls}"/>
    <text x="${x}" y="${y + drop + 46}" text-anchor="middle" class="sc-label">${esc(label)}</text>`;
  return `
  <svg viewBox="0 0 320 210" class="dg-scale__svg" role="img" aria-label="${esc(left)}と${esc(right)}の天秤">
    <path d="M${cx} ${cy} L${cx - 26} 182 h52 z" class="sc-stand"/>
    <line x1="${lx}" y1="${ly}" x2="${rx}" y2="${ry}" class="sc-beam"/>
    <circle cx="${cx}" cy="${cy}" r="7" class="sc-pivot"/>
    ${pan(lx, ly, left, tiltDeg ? "sc-pan--heavy" : "")}
    ${pan(rx, ry, right, "")}
    ${heavyLabel ? `<rect x="${lx - 46}" y="${ly + drop - 26}" width="92" height="26" rx="6" class="sc-weight"/><text x="${lx}" y="${ly + drop - 8}" text-anchor="middle" class="sc-weight-text">${esc(heavyLabel)}</text>` : ""}
  </svg>`;
}

export function renderBalance(d) {
  return `
<figure class="dg dg-scale">
  <div class="dg-scale__item">
    <div class="dg-scale__cap dg-scale__cap--before">${esc(d.beforeTitle)}</div>
    ${scaleSvg(14, d.left, d.right, d.heavy)}
    <p class="dg-scale__note">${rich(d.beforeNote)}</p>
  </div>
  <div class="dg-scale__arrow" aria-hidden="true">▼</div>
  <div class="dg-scale__item">
    <div class="dg-scale__cap dg-scale__cap--after">${esc(d.afterTitle)}</div>
    ${scaleSvg(0, d.left, d.right)}
    <p class="dg-scale__note">${rich(d.afterNote)}</p>
  </div>
</figure>`;
}
