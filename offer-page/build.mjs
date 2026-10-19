#!/usr/bin/env node
// オファーページ生成スクリプト
//   使い方: node offer-page/build.mjs <content.json> [出力先.html]
//   content.json の書き方は offer-page/README.md と examples/sample.json を参照。

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, basename, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import { renderPage } from "./lib/render.mjs";

const here = dirname(fileURLToPath(import.meta.url));

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
  writeFileSync(out, renderPage(content));
  console.log(`生成しました: ${out}`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) main();
