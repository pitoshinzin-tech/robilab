"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { createSupabaseBrowser } from "@/lib/supabase/client";
import { errorCodeOf } from "@/lib/lobby-errors";
import { emptyMySettings, parseMySettings, validateMySettings, type FieldErrors, type MySettings } from "@/lib/my-settings";
import { browserStorage, clearLocal, loadLocal, pickNewer, saveLocal } from "@/lib/my-settings-store";

export type SyncStatus = "local" | "memory" | "saving" | "synced" | "server-error";

export function serverErrorMessage(code: string | undefined): string {
  if (code === "NG_WORD") return "デバイス名・ゲーム名・表示名に使えない言葉が含まれています。直すまでサーバーには保存されません。";
  if (code === "INVALID_INPUT") return "入力内容を確認してください。";
  return "サーバーに保存できませんでした。この端末には保存されています。";
}

const SAVE_DELAY_MS = 800;

export function useMySettings() {
  const [storage] = useState(() => browserStorage());
  const [draft, setDraft] = useState<MySettings>(() => loadLocal(storage) ?? emptyMySettings());
  const [loggedIn, setLoggedIn] = useState(false);
  const [slug, setSlug] = useState<string | null>(null);
  const [status, setStatus] = useState<SyncStatus>(storage ? "local" : "memory");
  const [serverError, setServerError] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const validation = validateMySettings(draft);
  const errors: FieldErrors = validation.ok ? {} : validation.errors;

  const pushToServer = useCallback(async (s: MySettings) => {
    setStatus("saving");
    const { error } = await createSupabaseBrowser().rpc("save_my_settings", { p_data: s });
    if (error) {
      setStatus("server-error");
      setServerError(serverErrorMessage(errorCodeOf(error)));
      return;
    }
    setServerError(null);
    setStatus("synced");
  }, []);

  // ログインしていれば、サーバーの設定と比べて新しい方を採用する
  useEffect(() => {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return;
    let cancelled = false;
    (async () => {
      const supabase = createSupabaseBrowser();
      const { data: { user } } = await supabase.auth.getUser();
      if (cancelled || !user) return;
      setLoggedIn(true);
      const { data: row } = await supabase.from("my_settings").select("data, public_slug").maybeSingle();
      if (cancelled) return;
      setSlug((row?.public_slug as string | null) ?? null);
      const server = parseMySettings(row?.data ?? null);
      const local = loadLocal(storage);
      const side = pickNewer(local, server);
      if (side === "server" && server) {
        saveLocal(storage, server);
        setDraft(server);
        setStatus("synced");
      } else if (side === "local" && local) {
        await pushToServer(local);
      } else {
        setStatus("synced");
      }
    })();
    return () => { cancelled = true; };
  }, [pushToServer, storage]);

  const update = useCallback((patch: Partial<MySettings>) => {
    const next: MySettings = { ...draft, ...patch, updatedAt: new Date().toISOString() };
    setDraft(next);
    const v = validateMySettings(next);
    if (!v.ok) return;
    saveLocal(storage, v.value);
    if (!loggedIn) return;
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => void pushToServer(v.value), SAVE_DELAY_MS);
  }, [draft, loggedIn, pushToServer, storage]);

  const setPublic = useCallback(async (on: boolean) => {
    const { data, error } = await createSupabaseBrowser().rpc("set_card_public", { p_public: on });
    if (error) { setServerError(serverErrorMessage(errorCodeOf(error))); return; }
    setSlug((data as string | null) ?? null);
  }, []);

  const removeAll = useCallback(async () => {
    clearLocal(storage);
    if (loggedIn) {
      const { error } = await createSupabaseBrowser().rpc("delete_my_settings");
      if (error) { setServerError(serverErrorMessage(errorCodeOf(error))); return; }
      setSlug(null);
    }
    setDraft(emptyMySettings());
  }, [loggedIn, storage]);

  return { draft, errors, update, loggedIn, slug, status, serverError, setPublic, removeAll };
}
