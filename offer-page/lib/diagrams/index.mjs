// 図解の一覧。施術用の図解は MENU_DIAGRAMS に登録すると、データの diagram.type で選べるようになる。

import { renderBeforeAfter } from "./before-after.mjs";
import { renderBalance } from "./balance.mjs";
import { renderRadiate } from "./radiate.mjs";

export { renderReading } from "./reading.mjs";
export { renderSteps } from "./steps.mjs";
export { renderPrice } from "./price.mjs";
export { renderTimeline } from "./timeline.mjs";
export { scaleSvg } from "./balance.mjs";

export const MENU_DIAGRAMS = {
  beforeAfter: renderBeforeAfter,
  balance: renderBalance,
  radiate: renderRadiate,
};
