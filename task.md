# Implementation Plan

状態の記号: 🔴 未実装 / 🟢 最小実装済 / ✅️ リファクタリング済 / ⚠️ ブロック済

> 既存の `offer-page/build.mjs`（試作版）には描画処理がすでにあるが、テストがないため各タスクは 🔴 から始める。既存コードはテストで現在の表示を固定してから分割・移植する。

## Phase 0: 開発環境

- [x] ✅️ 0.1. npm プロジェクトとテスト環境を用意する
  - ルートに `package.json` を作成（`"type": "module"`、`"engines": { "node": ">=20" }`）
  - scripts: `"test": "node --test offer-page/test/*.test.mjs"`、`"offer": "node offer-page/cli.mjs"`
  - `offer-page/test/` を作成し、動作確認用の最小テストを 1 件置く
  - 依存ライブラリはこの時点では追加しない
  - _Requirements: 12, 13_

## Phase 1: MVP（データ → 検証 → ページ）

- [ ] 🔴 1.1. 現在の表示をテストで固定する（特性テスト）
  - `examples/sample.json` から生成した HTML に、全セクションの見出し・全金額・注意書き・`noindex` が含まれることを確認するテストを書く
  - 既存の `build.mjs` の `render` をテストから呼べるよう export する（処理内容は変えない）
  - _Requirements: 4, 5, 12_

- [ ] 🔴 1.2. HTML 補助関数を `lib/html.mjs` に分離する
  - 先にテスト: `esc` が `<script>` や `"` を無害化する、`rich` が `**強調**` と改行のみを変換する、`icon` が未知の名前で空文字を返す
  - `esc` / `rich` / `paras` / `yen` / `icon` / `ICONS` を移植
  - _Requirements: 4, 13_

- [ ] 🔴 1.3. 図解を `lib/diagrams/` に分離し、対応表を作る
  - 先にテスト: 各図解（reading / steps / price / timeline / beforeAfter / balance / radiate）が入力の文字列を含む HTML を返す、天秤の傾き 0 と 14 度で皿の座標が変わる、料金グラフの幅が最大額比で計算される
  - `diagrams/index.mjs` に `MENU_DIAGRAMS` 対応表を置き、Renderer は種類名で引く
  - 図解内の文字サイズ 13px 以上を CSS で確認（`.sc-weight-text` など）
  - _Requirements: 5, 13_

- [ ] 🔴 1.4. ページ組み立てを `lib/render.mjs` に分離する
  - 先にテスト: 1.1 の特性テストがそのまま通ること、`pricing.set` がない場合に料金表のセット行とセット比較グラフが出ないこと、`apply.button.url` が空のときボタンが出ないこと、`page.deadline` がないとき画面下の固定バーが出ないこと
  - `renderPage(content)` を export。`build.mjs` は互換のため `cli.mjs build` を呼ぶだけにする
  - 注意書きを口コミ直後とページ末尾の 2 か所に出す（口コミがない場合は末尾のみ）
  - _Requirements: 4, 7, 9, 13_

- [ ] 🔴 1.5. データ形式をスキーマとして定義する（`lib/schema.mjs`）
  - **ライブラリ追加: `zod`（バージョンを固定。追加前にユーザーの合意を得る）**
  - 先にテスト: `examples/sample.json` が通る、`menus` 0 件・金額が文字列・未知の図解種類・`disclaimer` 空がそれぞれ失敗する
  - design.md の `OfferContent` インターフェースどおりに定義し、各項目に日本語の表示名を付ける
  - `fieldLabel(path)` で `["menus", 1, "price"]` → 「施術②の特別価格」に変換
  - _Requirements: 3, 13_

- [ ] 🔴 1.6. 検証処理を作る（`lib/validate.mjs`）
  - 先にテスト: JSON 構文エラーで行番号が返る、複数の誤りが全件返る、誤りが 0 件のときだけ `content` が返る
  - `parseJsonFile` / `validateContent` を実装し、zod の誤りを `Issue` に変換
  - _Requirements: 3_

- [ ] 🔴 1.7. 業務ルール検査を作る（`lib/rules.mjs`, `lib/phrases.mjs`）
  - 先にテスト（各ルールの違反あり／なし）:
    - 特別価格 > 通常価格 → error
    - セット通常合計 ≠ 各通常価格の合計 → warning
    - セット価格 ≥ 特別価格の合計 → warning
    - 期限なし → warning
    - `overview.steps[].menu` が存在しない施術番号 → error
    - 不安をあおる表現・効果の断定表現 → warning（禁止表現は `phrases.mjs` で一覧管理）
  - `validateContent` から呼び出す
  - _Requirements: 6, 7_

- [ ] 🔴 1.8. 日本語の結果表示を作る（`lib/report.mjs`）
  - 先にテスト: 誤りと警告が分かれて表示される、場所・直し方が含まれる、完了時にファイルパスが一覧される
  - _Requirements: 3, 6, 11_

- [ ] 🔴 1.9. CLI の `build` コマンドを作る（`cli.mjs`）
  - 先にテスト（一時フォルダで実行）: 正常データで HTML が出力され終了コード 0、誤りのあるデータで HTML が作られず終了コード 1、警告のみなら HTML が作られ警告が表示される
  - `npm run offer -- build <json> [--out <html>]`
  - _Requirements: 3, 6, 11_

## Phase 2: 機能拡張（文章からの自動変換）

- [ ] 🔴 2.1. 変換ルールを単一の原本にまとめる
  - `prompts/convert.md` を「手順書」と「変換ルール本文」に分け、本文を区切り記号で抽出できるようにする
  - 先にテスト: `loadConversionRules()` が本文のみを返し、手順書部分を含まない
  - 変換ルールにデータ形式の説明・図解の選び方・禁止事項（創作しない・不安をあおらない・注意書きを残す）を記載
  - _Requirements: 1, 2, 7_

- [ ] 🔴 2.2. Claude API による変換処理を作る（`lib/convert.mjs`）
  - **ライブラリ追加: `@anthropic-ai/sdk`（バージョンを固定。追加前にユーザーの合意を得る）**
  - 先にテスト（クライアントを差し替え）: 正常時に `OfferContent` を返す、`stop_reason: "refusal"`・`parsed_output: null`・認証エラー・レート制限をそれぞれ区別したエラーにする
  - `client.messages.parse()` + `zodOutputFormat(OfferContentSchema)`、モデル `claude-opus-5-5`（`OFFER_MODEL` で上書き可）、`effort: "medium"`、`max_tokens: 16000`、`maxRetries: 3`
  - system に変換ルール（キャッシュ対象）、user にオファー文
  - 拒否時フォールバック（`fallbacks: "default"`）の指定方法を SDK の資料で確認してから実装
  - API キー未設定時は手作業変換（Requirement 2）を案内
  - _Requirements: 1, 8_

- [ ] 🔴 2.3. 元の文章との照合を作る（`lib/fidelity.mjs`）
  - 先にテスト: 全角数字・カンマ・空白の違いを吸収する、元の文章にない口コミ・金額を warning として返す
  - `validateContent(data, { sourceText })` から呼び出す
  - _Requirements: 7_

- [ ] 🔴 2.4. CLI の `new` コマンドを作る
  - 先にテスト（クライアントを差し替え）: 文章 → `private/<名前>.json` → `dist/<名前>.html` まで作られる、同名データがあると `--force` なしで中止、解析失敗時に `private/<名前>.raw.txt` が保存される
  - `npm run offer -- new <お客様名> <文章ファイル> [--force]`
  - _Requirements: 1, 8, 11_

## Phase 3: 高度な機能

- [ ] 🔴 3.1. 共通設定を読み込む（`lib/config.mjs`）
  - 先にテスト: 設定ファイルなしでも動く、`signature`・LINE ボタンを補完する、データ側の値が設定より優先される
  - `private/config.json`（Git 管理外）
  - _Requirements: 9_

- [ ] 🔴 3.2. 確認画像を出力する（`lib/preview.mjs`）
  - **ライブラリ追加: `playwright`（devDependencies ではなく任意依存。追加前にユーザーの合意を得る）**
  - 先にテスト: Chromium がない環境では例外を投げずに理由を返す、ある環境では PNG が作られ `overflow` が判定される
  - `build` / `new` に `--preview` オプションを追加
  - _Requirements: 10_

- [ ] 🔴 3.3. スマホ表示のテストを追加する
  - 幅 360 / 390 / 430px で横スクロールなし、本文 17px 以上、ボタン高さ 44px 以上、Web フォントなしでも崩れない
  - Chromium がない環境ではスキップ
  - _Requirements: 4, 12_

## Phase 4: 本番化対応

- [ ] 🔴 4.1. 個人情報の保護を確認する
  - テスト: `examples/` 配下に `prev_access_key` や実在の顧客名が含まれない、生成 HTML に `noindex` が入る
  - `.gitignore` に `private/` と `dist/` が含まれることをテストで確認
  - _Requirements: 8_

- [ ] 🔴 4.2. パフォーマンスを確認する
  - 施術 6 件・口コミ 20 件のデータで `renderPage` が 200ms 以内
  - _Requirements: 12_

- [ ] 🔴 4.3. 手順書を更新する
  - `offer-page/README.md` を新しいコマンド（`new` / `build` / `--preview`）・共通設定・API キーの設定方法に合わせて書き直す
  - 公開前チェック（二重価格表示・特定商取引法・消費者契約法）を維持
  - 対応 Node.js バージョンを 20 以上に更新
  - _Requirements: 2, 7, 11, 13_
