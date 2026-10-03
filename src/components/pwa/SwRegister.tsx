"use client";
import { useEffect } from "react";
import { scheduleSwRegister } from "@/lib/pwa/sw-register";
import { installPromptStore } from "@/lib/pwa/install-prompt";

/** 何も描かない。本番だけ service worker を登録し、「ホーム画面に追加」の知らせを受け取り始める(設計書 3-2・4-2) */
export function SwRegister() {
  useEffect(() => {
    installPromptStore.start(window);
    return scheduleSwRegister({
      nodeEnv: process.env.NODE_ENV,
      serviceWorker: "serviceWorker" in navigator ? navigator.serviceWorker : undefined,
      readyState: document.readyState,
      addLoadListener: (fn) => {
        window.addEventListener("load", fn, { once: true });
        return () => window.removeEventListener("load", fn);
      },
    });
  }, []);
  return null;
}
