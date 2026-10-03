import { MY_SETTINGS_KEY } from "@/lib/my-settings-store";
import { SUPABASE_SESSION_COOKIE_RE } from "@/lib/auth-cookie";

/**
 * 表示速度(docs/design/perf.md):/mouse の読み込み中の面(入力画面を見えないまま置き、Skeleton を重ねる)を、
 * 初めての人(この端末にマイ設定がなく、ログインの cookie もない人)にだけ、ハイドレーションの前から入力画面として見せる。
 * この人たちはハイドレーションのあとすぐ同じ入力画面になるので、最後の見た目は同じで、出るのが早くなるだけ。
 * 設定がある人・ログインしている人は印を付けないので、今までどおり Skeleton(CEO の判断:ログインしている人の読み込み中は変えない)。
 */
export const FRESH_VISITOR_CLASS = "rl-fresh";

/** <html> に印を付ける 1 行の script(ページの HTML の中で、読み込み中の面より前に置く) */
export function freshVisitorScript(): string {
  return `try{if(!localStorage.getItem(${JSON.stringify(MY_SETTINGS_KEY)})&&!${SUPABASE_SESSION_COOKIE_RE.toString()}.test(document.cookie))document.documentElement.classList.add(${JSON.stringify(FRESH_VISITOR_CLASS)})}catch(e){}`;
}
