import { test } from "node:test";
import assert from "node:assert/strict";
import { esc, rich, paras, yen, icon } from "../lib/html.mjs";

test("esc は HTML の特殊文字を無害化する", () => {
  assert.equal(esc('<script>alert("x")</script>&'), "&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt;&amp;");
  assert.equal(esc(undefined), "");
  assert.equal(esc(15800), "15800");
});

test("rich は **強調** と改行だけを HTML に変換する", () => {
  assert.equal(rich("今の**不安**を\n手放す"), '今の<strong class="mark">不安</strong>を<br>手放す');
  assert.equal(rich("<b>太字</b>"), "&lt;b&gt;太字&lt;/b&gt;");
});

test("paras は段落ごとに <p> を作り、未指定なら空文字を返す", () => {
  assert.equal(paras(["一", "二"]), "<p>一</p>\n<p>二</p>");
  assert.equal(paras(["一"], "small"), '<p class="small">一</p>');
  assert.equal(paras(undefined), "");
});

test("yen は3桁区切りにする", () => {
  assert.equal(yen(105000), "105,000");
});

test("icon は既知の名前で SVG を、未知の名前で空文字を返す", () => {
  assert.match(icon("heart"), /^<svg class="icon"/);
  assert.match(icon("heart", "big"), /^<svg class="big"/);
  assert.equal(icon("unknown"), "");
});
