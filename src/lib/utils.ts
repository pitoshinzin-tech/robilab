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
    },
  },
})
