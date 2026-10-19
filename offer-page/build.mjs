#!/usr/bin/env node
// オファーページ生成スクリプト
//   使い方: node offer-page/build.mjs <content.json> [出力先.html]
//   content.json の書き方は offer-page/README.md と examples/sample.json を参照。
//   外部ライブラリ不要。CSS をインライン化した 1 枚の HTML を出力します。

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, basename, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import { esc, rich, paras, yen, icon, COLORS, MENU_ICON, CIRCLED } from "./lib/html.mjs";
import { MENU_DIAGRAMS, renderReading, renderSteps, renderPrice, renderTimeline } from "./lib/diagrams/index.mjs";

const here = dirname(fileURLToPath(import.meta.url));


// ---------- セクション ----------

function sectionMenu(m) {
  const diagram = m.diagram && MENU_DIAGRAMS[m.diagram.type] ? MENU_DIAGRAMS[m.diagram.type](m.diagram) : "";
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
  ${renderReading(c.reading)}
  ${paras(c.reading.after)}
</section>

${c.message?.length ? `<section class="sec quote-block">${paras(c.message)}</section>` : ""}

<section class="sec">
  <h2 class="h2"><span>${esc(c.overview.kicker ?? "全体像")}</span>${esc(c.overview.heading)}</h2>
  ${paras(c.overview.intro)}
  ${renderSteps(c.overview, menus)}
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
  ${renderPrice(menus, c.pricing.set)}
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
  ${renderTimeline(c.future)}
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
