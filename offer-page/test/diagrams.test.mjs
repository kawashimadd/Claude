import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  MENU_DIAGRAMS,
  renderReading,
  renderSteps,
  renderPrice,
  renderTimeline,
  scaleSvg,
} from "../lib/diagrams/index.mjs";

const sample = () => JSON.parse(readFileSync(new URL("../examples/sample.json", import.meta.url), "utf8"));
const includesAll = (html, texts) => {
  for (const t of texts) assert.ok(html.includes(t), `「${t}」がない`);
};

test("鑑定図: 今・壁・望みの各文言を含む", () => {
  const { reading } = sample();
  includesAll(renderReading(reading), [
    reading.now.label,
    ...reading.now.items,
    reading.wall.label,
    reading.wish.label,
    ...reading.wish.items,
  ]);
});

test("3ステップ図: 動詞と施術の短い名前を含む", () => {
  const { overview, menus } = sample();
  const html = renderSteps(overview, menus);
  includesAll(html, overview.steps.map((s) => s.verb));
  includesAll(html, menus.map((m) => m.short));
});

test("料金グラフ: 3本の棒の幅が最大額との比で決まる", () => {
  const menus = [
    { price: 15800, normalPrice: 25000 },
    { price: 15800, normalPrice: 25000 },
    { price: 29800, normalPrice: 55000 },
  ];
  const html = renderPrice(menus, { label: "3つセット", normalTotal: 105000, price: 39800 });
  assert.deepEqual(
    [...html.matchAll(/width:([\d.]+)%/g)].map((m) => m[1]),
    ["100.0", "58.5", "37.9"]
  );
  assert.ok(html.includes("21,600円"), "個別合計との差額がない");
});

test("タイムライン: 場面の数だけ項目を作る", () => {
  const { future } = sample();
  const html = renderTimeline(future);
  assert.equal(html.split("<li>").length - 1, future.scenes.length);
  includesAll(html, future.scenes.map((s) => s.when));
});

test("天秤: 傾き0では左右の皿が同じ高さ、傾けると左が下がる", () => {
  const pans = (svg) => [...svg.matchAll(/<path d="M([\d.]+) ([\d.]+) h88/g)].map((m) => Number(m[2]));
  const [l0, r0] = pans(scaleSvg(0, "左", "右"));
  assert.equal(l0, r0);
  const [l14, r14] = pans(scaleSvg(14, "左", "右"));
  assert.ok(l14 > r14);
});

test("施術用の図解: 3種類が登録され、入力の文言を含む", () => {
  assert.deepEqual(Object.keys(MENU_DIAGRAMS).sort(), ["balance", "beforeAfter", "radiate"]);
  for (const m of sample().menus) {
    const d = m.diagram;
    const html = MENU_DIAGRAMS[d.type](d);
    const texts =
      d.type === "beforeAfter" ? [...d.before.items, ...d.after.items]
      : d.type === "balance" ? [d.left, d.right, d.afterTitle]
      : d.branches.map((b) => b.label);
    includesAll(html, texts);
  }
});

test("料金グラフ: 見出しの数は施術の数に合わせる", () => {
  const menus = [{ price: 10000, normalPrice: 20000 }, { price: 10000, normalPrice: 20000 }];
  const html = renderPrice(menus, { label: "2つセット", normalTotal: 40000, price: 18000 });
  assert.ok(html.includes("2つすべてを受ける場合"));
  assert.ok(!html.includes("3つ"));
});
