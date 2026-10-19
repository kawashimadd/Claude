import { esc, yen } from "../html.mjs";

// 料金比較（棒グラフ）
export function renderPrice(menus, set) {
  const max = Math.max(set.normalTotal, ...menus.map((m) => m.normalPrice));
  const sepTotal = menus.reduce((s, m) => s + m.price, 0);
  const bar = (label, amount, cls, sub = "") => `
    <div class="dg-price__row ${cls}">
      <div class="dg-price__label">${esc(label)}${sub ? `<small>${esc(sub)}</small>` : ""}</div>
      <div class="dg-price__track"><div class="dg-price__bar" style="width:${((amount / max) * 100).toFixed(1)}%"></div></div>
      <div class="dg-price__amt">${yen(amount)}<small>円</small></div>
    </div>`;
  return `
<figure class="dg dg-price" aria-label="${menus.length}つを受ける場合の料金比較">
  <figcaption>${menus.length}つすべてを受ける場合のお支払い額</figcaption>
  ${bar("通常価格の合計", set.normalTotal, "is-normal")}
  ${bar("特別価格で個別に申込", sepTotal, "is-sep", menus.map((m) => yen(m.price)).join("＋"))}
  ${bar(set.label, set.price, "is-set")}
  <p class="dg-price__diff">セットなら、個別申込より <b>${yen(sepTotal - set.price)}円</b> お得です</p>
</figure>`;
}
