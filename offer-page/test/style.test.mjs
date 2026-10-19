import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const css = readFileSync(new URL("../template/style.css", import.meta.url), "utf8");

// 「セレクタ { ... font-size: Npx ... }」の組を取り出す（clamp などの可変値は対象外）
const fontSizes = () =>
  [...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)].flatMap(([, selector, body]) => {
    const m = body.match(/font-size:\s*(\d+)px/);
    return m ? [{ selector: selector.trim(), px: Number(m[1]) }] : [];
  });

test("図解の中の文字は 13px 以上", () => {
  const small = fontSizes().filter((f) => /\.(dg|sc)-/.test(f.selector) && f.px < 13);
  assert.deepEqual(small, []);
});

test("本文の文字は 17px 以上", () => {
  const body = fontSizes().find((f) => f.selector === "body");
  assert.ok(body && body.px >= 17, `body の font-size: ${body?.px}`);
});
