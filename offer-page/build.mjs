#!/usr/bin/env node
// オファーページ生成スクリプト
//   使い方: node offer-page/build.mjs <content.json> [出力先.html]
//   content.json の書き方は offer-page/README.md と examples/sample.json を参照。
//   外部ライブラリ不要。CSS をインライン化した 1 枚の HTML を出力します。

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, basename, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));

// ---------- ユーティリティ ----------

const esc = (s) =>
  String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

// 文章中の簡易記法: **強調** → マーカー、改行 → <br>
const rich = (s) =>
  esc(s)
    .replace(/\*\*(.+?)\*\*/g, '<strong class="mark">$1</strong>')
    .replace(/\n/g, "<br>");

const paras = (list, cls = "") =>
  (list ?? []).map((p) => `<p${cls ? ` class="${cls}"` : ""}>${rich(p)}</p>`).join("\n");

const yen = (n) => Number(n).toLocaleString("ja-JP");

const ICONS = {
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

const icon = (name, cls = "icon") =>
  ICONS[name]
    ? `<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name]}</svg>`
    : "";

const COLORS = ["sage", "lavender", "gold", "rose"];
const MENU_ICON = { sage: "leaf", lavender: "wave", gold: "sparkle", rose: "heart" };
const CIRCLED = ["", "①", "②", "③", "④", "⑤", "⑥"];

// ---------- 図解パーツ ----------

// 今の状態 →（壁）→ 望む状態
function diagramReading(r) {
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

// 過去・今・未来の 3 ステップ（術式の役割分担）
function diagramSteps(o, menus) {
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

// ビフォー → アフター
function diagramBeforeAfter(d) {
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

// 天秤（偏り → 調和）
function scaleSvg(tiltDeg, left, right, heavyLabel) {
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

function diagramBalance(d) {
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

// 中心のテーマから 3 方向へ広がる
function diagramRadiate(d) {
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

const DIAGRAMS = { beforeAfter: diagramBeforeAfter, balance: diagramBalance, radiate: diagramRadiate };

// 料金比較（棒グラフ）
function diagramPrice(menus, set) {
  const max = Math.max(set.normalTotal, ...menus.map((m) => m.normalPrice));
  const sepTotal = menus.reduce((s, m) => s + m.price, 0);
  const bar = (label, amount, cls, sub = "") => `
    <div class="dg-price__row ${cls}">
      <div class="dg-price__label">${esc(label)}${sub ? `<small>${esc(sub)}</small>` : ""}</div>
      <div class="dg-price__track"><div class="dg-price__bar" style="width:${((amount / max) * 100).toFixed(1)}%"></div></div>
      <div class="dg-price__amt">${yen(amount)}<small>円</small></div>
    </div>`;
  return `
<figure class="dg dg-price" aria-label="3つを受ける場合の料金比較">
  <figcaption>3つすべてを受ける場合のお支払い額</figcaption>
  ${bar("通常価格の合計", set.normalTotal, "is-normal")}
  ${bar("特別価格で個別に申込", sepTotal, "is-sep", menus.map((m) => yen(m.price)).join("＋"))}
  ${bar(set.label, set.price, "is-set")}
  <p class="dg-price__diff">セットなら、個別申込より <b>${yen(sepTotal - set.price)}円</b> お得です</p>
</figure>`;
}

// 未来の一日（タイムライン）
function diagramFuture(f) {
  return `
<ol class="dg dg-time">
  ${f.scenes
    .map(
      (s) => `<li><span class="dg-time__dot">${icon(s.icon)}</span><div><b class="dg-time__when">${esc(s.when)}</b><p>${rich(s.text)}</p></div></li>`
    )
    .join("")}
</ol>`;
}

// ---------- セクション ----------

function sectionMenu(m) {
  const diagram = m.diagram && DIAGRAMS[m.diagram.type] ? DIAGRAMS[m.diagram.type](m.diagram) : "";
  return `
<article class="menu c-${m.color}" id="menu-${m.no}">
  <header class="menu__head">
    <span class="menu__no">${icon(MENU_ICON[m.color] ?? "sparkle")}${esc(m.label ?? `施術 ${CIRCLED[m.no]}`)}</span>
    <h3 class="menu__name">${esc(m.name)}${m.badge ? ` <em class="menu__badge">${esc(m.badge)}</em>` : ""}</h3>
    <p class="menu__catch">${rich(m.catch)}</p>
  </header>
  ${paras(m.intro)}
  ${m.innerVoices?.length ? `<div class="voice-bubbles">${m.innerVoices.map((v) => `<p class="bubble">「${esc(v)}」</p>`).join("")}</div>` : ""}
  ${paras(m.body)}
  ${diagram}
  ${m.goal?.length ? `<div class="menu__goal"><b>${esc(m.goalTitle ?? "この施術で目指すこと")}</b><ul>${m.goal.map((g) => `<li>${icon("check")}${rich(g)}</li>`).join("")}</ul></div>` : ""}
  <div class="menu__price">
    <span class="menu__price-normal">通常 <s>${yen(m.normalPrice)}円</s></span>
    <span class="menu__price-special"><small>特別価格</small>${yen(m.price)}<small>円</small></span>
  </div>
</article>`;
}

export function render(c) {
  const { page, hero, menus } = c;
  menus.forEach((m, i) => (m.color ??= COLORS[i % COLORS.length]));
  const name = `${page.customerName}${page.honorific ?? "さん"}`;

  return `<!doctype html>
<html lang="ja">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<meta name="color-scheme" content="light">
<title>${esc(page.title)}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Noto+Serif+JP:wght@500;700&family=Zen+Kaku+Gothic+New:wght@400;500;700&display=swap" rel="stylesheet">
<style>
${readFileSync(join(here, "template/style.css"), "utf8")}
</style>
</head>
<body>

<header class="hero">
  <div class="hero__inner">
    <p class="hero__to">${esc(name)}へ</p>
    <p class="hero__label">${esc(hero.label)}</p>
    <h1 class="hero__title">${rich(hero.title)}</h1>
    <p class="hero__lead">${rich(hero.lead)}</p>
    ${page.deadline ? `<p class="hero__deadline">特別価格のご案内は <b>${esc(page.deadline)}</b> まで</p>` : ""}
  </div>
</header>

<main>

<section class="sec letter">
  ${paras(c.letter)}
</section>

<section class="sec">
  <h2 class="h2"><span>${esc(c.reading.kicker ?? "鑑定より")}</span>${esc(c.reading.heading)}</h2>
  ${paras(c.reading.intro)}
  ${diagramReading(c.reading)}
  ${paras(c.reading.after)}
</section>

${c.message?.length ? `<section class="sec quote-block">${paras(c.message)}</section>` : ""}

<section class="sec">
  <h2 class="h2"><span>${esc(c.overview.kicker ?? "全体像")}</span>${esc(c.overview.heading)}</h2>
  ${paras(c.overview.intro)}
  ${diagramSteps(c.overview, menus)}
  ${paras(c.overview.after)}
</section>

<section class="sec">
  <h2 class="h2"><span>施術のご説明</span>${esc(c.menusHeading ?? "それぞれの施術について")}</h2>
  ${menus.map(sectionMenu).join("\n")}
</section>

${c.testimonials ? `
<section class="sec">
  <h2 class="h2"><span>体験された方の声</span>${esc(c.testimonials.heading)}</h2>
  <ul class="testi">${c.testimonials.items.map((t) => `<li>${icon("heart")}<p>「${esc(t)}」</p></li>`).join("")}</ul>
  ${c.disclaimer ? paras(c.disclaimer, "small") : ""}
  ${c.testimonials.link?.url ? `<p class="testi__link"><a href="${esc(c.testimonials.link.url)}" target="_blank" rel="noopener">${esc(c.testimonials.link.label)} ›</a></p>` : ""}
</section>` : ""}

<section class="sec" id="price">
  <h2 class="h2"><span>料金のご案内</span>${esc(c.pricing.heading)}</h2>
  ${paras(c.pricing.intro)}
  <table class="price-table">
    <thead><tr><th>施術</th><th>通常価格</th><th>特別価格</th></tr></thead>
    <tbody>
      ${menus.map((m) => `<tr class="c-${m.color}"><td><b>${CIRCLED[m.no]}</b> ${esc(m.short)}${m.badge ? `<small>${esc(m.badge)}</small>` : ""}</td><td><s>${yen(m.normalPrice)}円</s></td><td class="em">${yen(m.price)}円</td></tr>`).join("")}
      <tr class="is-set"><td><b>${esc(c.pricing.set.short ?? c.pricing.set.label)}</b>${c.pricing.set.note ? `<small>${esc(c.pricing.set.note)}</small>` : ""}</td><td><s>${yen(c.pricing.set.normalTotal)}円</s></td><td class="em">${yen(c.pricing.set.price)}円</td></tr>
    </tbody>
  </table>
  ${diagramPrice(menus, c.pricing.set)}
  ${paras(c.pricing.after)}
  ${c.luckyDay ? `
  <div class="lucky">
    <p class="lucky__date">${esc(c.luckyDay.date)}</p>
    <div class="lucky__badges">${c.luckyDay.badges.map((b) => `<div><b>${esc(b.name)}</b><span>${esc(b.text)}</span></div>`).join("")}</div>
    <p>${rich(c.luckyDay.note)}</p>
  </div>` : ""}
  ${c.pricing.schedule?.length ? `<dl class="schedule">${c.pricing.schedule.map((s) => `<div><dt>${esc(s.label)}</dt><dd>${rich(s.text)}</dd></div>`).join("")}</dl>` : ""}
</section>

<section class="sec future">
  <h2 class="h2"><span>${esc(c.future.kicker ?? "これからの未来")}</span>${esc(c.future.heading)}</h2>
  ${paras(c.future.intro)}
  ${diagramFuture(c.future)}
  ${c.future.motto ? `<p class="motto">${rich(c.future.motto)}</p>` : ""}
  ${paras(c.future.after)}
</section>

<section class="sec apply" id="apply">
  <h2 class="h2"><span>お申し込み</span>${esc(c.apply.heading)}</h2>
  <ol class="apply__steps">${c.apply.steps.map((s) => `<li>${rich(s)}</li>`).join("")}</ol>
  ${c.apply.button?.url ? `<a class="btn" href="${esc(c.apply.button.url)}">${icon("line")}${esc(c.apply.button.label)}</a>` : ""}
  ${paras(c.apply.notes, "small")}
  <p class="sign">${esc(c.signature)}</p>
</section>

${c.disclaimer ? `<aside class="sec disclaimer"><b>ご確認ください</b>${paras(c.disclaimer)}</aside>` : ""}

</main>

${page.deadline ? `<a class="sticky" href="#apply"><span>特別価格は<b>${esc(page.deadline)}</b>まで</span><span class="sticky__btn">申し込み方法を見る</span></a>` : ""}

</body>
</html>
`;
}

// ---------- 実行 ----------

function main() {
  const [input, outArg] = process.argv.slice(2);
  if (!input) {
    console.error("使い方: node offer-page/build.mjs <content.json> [出力先.html]");
    process.exit(1);
  }
  const content = JSON.parse(readFileSync(resolve(input), "utf8"));
  const out = resolve(outArg ?? join(here, "dist", basename(input).replace(/\.json$/, ".html")));
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, render(content));
  console.log(`生成しました: ${out}`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) main();
