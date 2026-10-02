import { createCn } from "cn/config"

/**
 * クラス名をまとめる。ロビラボの角丸(rounded-rl-*)と影(shadow-rl-*)を
 * 「同じ種類」として知っているので、className で上書きできる。
 */
export const cn = createCn({
  extend: {
    theme: {
      radius: ["rl-sm", "rl-md", "rl-pill"],
      shadow: ["rl-glow-1", "rl-glow-2", "rl-float"],
      // 追補 4-2・5-2:32px の見出しの段・表示用の文字の段・間の 3 段・線のイージング
      text: ["rl-title", "rl-display-1", "rl-display-2", "rl-display-3", "rl-hero"],
      spacing: ["rl-ma-lg", "rl-ma-md", "rl-ma-sm"],
      ease: ["rl-line"],
    },
  },
})
