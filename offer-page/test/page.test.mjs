import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { render } from "../build.mjs";

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
