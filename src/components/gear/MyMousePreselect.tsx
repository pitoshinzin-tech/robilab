"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { MY_SETTINGS_STORAGE_KEY, myMouseIdFrom, shouldPreselect } from "@/lib/my-mouse";

/**
 * URL にマウスの指定がまったくないときだけ、マイ設定(この端末の保存)のマウスで選び直す(設計書 3-3)。何も描かない。
 * サーバーが知らない id は無視されるが、URL に ?mouse= が付くので、選び直しは 1 回だけ。
 */
export function MyMousePreselect() {
  const router = useRouter();
  useEffect(() => {
    if (!shouldPreselect(window.location.search)) return;
    let raw: string | null = null;
    try {
      raw = window.localStorage.getItem(MY_SETTINGS_STORAGE_KEY);
    } catch {
      return; // 保存が使えない(プライベートモードなど)
    }
    const id = myMouseIdFrom(raw);
    if (!id) return;
    const q = new URLSearchParams(window.location.search);
    q.set("mouse", id);
    q.set("from", "my");
    router.replace(`/skates?${q.toString()}`, { scroll: false });
  }, [router]);
  return null;
}
