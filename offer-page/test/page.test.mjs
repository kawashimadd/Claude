import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { renderPage as render } from "../lib/render.mjs";

const sample = () => JSON.parse(readFileSync(new URL("../examples/sample.json", import.meta.url), "utf8"));

test("見本データから全セクションの見出しを含むページができる", () => {
  const c = sample();
  const html = render(c);
  for (const heading of [
    c.reading.heading,
    c.overview.heading,
    c.menusHeading,
    c.testimonials.heading,
    c.pricing.heading,
    c.future.heading,
    c.apply.heading,
  ]) {
    assert.ok(html.includes(heading), `見出し「${heading}」がない`);
  }
  for (const m of c.menus) assert.ok(html.includes(m.name), `施術名「${m.name}」がない`);
});

test("全金額がカンマ区切りで表示される", () => {
  const c = sample();
  const html = render(c);
  const amounts = [
    ...c.menus.flatMap((m) => [m.normalPrice, m.price]),
    c.pricing.set.normalTotal,
    c.pricing.set.price,
  ];
  for (const n of amounts) assert.ok(html.includes(n.toLocaleString("ja-JP")), `金額 ${n} がない`);
});

test("注意書きが口コミの直後とページ末尾の2か所に出る", () => {
  const c = sample();
  const html = render(c);
  const count = html.split(c.disclaimer[0]).length - 1;
  assert.equal(count, 2);
});

test("検索エンジンに登録されないよう noindex が入る", () => {
  assert.match(render(sample()), /<meta name="robots" content="noindex, nofollow">/);
});

test("セット価格がない場合は、料金表のセット行と比較グラフを出さない", () => {
  const c = sample();
  delete c.pricing.set;
  const html = render(c);
  assert.ok(!html.includes('class="is-set"'));
  assert.ok(!html.includes('class="dg dg-price"'));
  for (const m of c.menus) assert.ok(html.includes(m.price.toLocaleString("ja-JP")));
});

test("LINE の URL が空ならボタンを出さず、あれば出す", () => {
  const c = sample();
  c.apply.button = { label: "LINEで返信する", url: "" };
  assert.ok(!render(c).includes('class="btn"'));
  c.apply.button.url = "https://line.me/R/ti/p/@example";
  assert.match(render(c), /<a class="btn" href="https:\/\/line\.me\/R\/ti\/p\/@example">/);
});

test("期限がない場合は画面下の固定バーを出さない", () => {
  const c = sample();
  delete c.page.deadline;
  assert.ok(!render(c).includes('class="sticky"'));
});

test("口コミがない場合、注意書きはページ末尾の1か所に出る", () => {
  const c = sample();
  delete c.testimonials;
  assert.equal(render(c).split(c.disclaimer[0]).length - 1, 1);
});

test("ページを作っても入力データを書き換えない", () => {
  const c = sample();
  const before = JSON.stringify(c);
  render(c);
  assert.equal(JSON.stringify(c), before);
});
