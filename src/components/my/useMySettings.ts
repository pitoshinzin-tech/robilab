"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { createSupabaseBrowser } from "@/lib/supabase/client";
import { errorCodeOf } from "@/lib/lobby-errors";
import { emptyMySettings, parseMySettings, validateMySettings, type FieldErrors, type MySettings } from "@/lib/my-settings";
import { browserStorage, clearLocal, loadLocal, pickNewer, saveLocal } from "@/lib/my-settings-store";

export type SyncStatus = "local" | "memory" | "saving" | "synced" | "server-error";

export function serverErrorMessage(code: string | undefined): string {
  if (code === "NG_WORD") return "デバイス名・ゲーム名・表示名に使えない言葉が含まれています。直すまでサーバーには保存されません。";
  if (code === "NOT_FOUND") return "先に設定を保存してから公開してください。";
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
  const [revision, setRevision] = useState(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latestStamp = useRef<string | null>(null);
  const hasServerRow = useRef(false);
  const validation = validateMySettings(draft);
  const errors: FieldErrors = validation.ok ? {} : validation.errors;

  const pushToServer = useCallback(async (s: MySettings): Promise<boolean> => {
    setStatus("saving");
    const { data, error } = await createSupabaseBrowser().rpc("save_my_settings", { p_data: s });
    if (error) {
      setStatus("server-error");
      setServerError(serverErrorMessage(errorCodeOf(error)));
      return false;
    }
    hasServerRow.current = true;
    setServerError(null);
    setStatus("synced");
    // 送ったあとに編集していなければ、サーバーが付けた updatedAt を取り込む(値は同じ)
    const saved = parseMySettings(data ?? null);
    if (saved && latestStamp.current === s.updatedAt) {
      latestStamp.current = saved.updatedAt;
      saveLocal(storage, saved);
      setDraft(saved);
    }
    return true;
  }, [storage]);

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
      hasServerRow.current = Boolean(row);
      setSlug((row?.public_slug as string | null) ?? null);
      const server = parseMySettings(row?.data ?? null);
      const local = loadLocal(storage);
      const side = pickNewer(local, server);
      if (side === "server" && server) {
        saveLocal(storage, server);
        latestStamp.current = server.updatedAt;
        setDraft(server);
        setRevision((r) => r + 1);
        setStatus("synced");
      } else if (side === "local" && local) {
        latestStamp.current = local.updatedAt;
        await pushToServer(local);
      } else {
        setStatus("synced");
      }
    })();
    return () => { cancelled = true; };
  }, [pushToServer, storage]);

  const update = useCallback((patch: Partial<MySettings>) => {
    const next: MySettings = { ...draft, ...patch, updatedAt: new Date().toISOString() };
    latestStamp.current = next.updatedAt;
    setDraft(next);
    const v = validateMySettings(next);
    if (!v.ok) return;
    saveLocal(storage, v.value);
    if (!loggedIn) return;
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => { timer.current = null; void pushToServer(v.value); }, SAVE_DELAY_MS);
  }, [draft, loggedIn, pushToServer, storage]);

  const setPublic = useCallback(async (on: boolean) => {
    if (on && (timer.current || !hasServerRow.current)) {
      // まだサーバーに届いていない入力があれば、先に保存する
      if (timer.current) { clearTimeout(timer.current); timer.current = null; }
      const v = validateMySettings(draft);
      if (!v.ok) return;
      if (!(await pushToServer(v.value))) return;
    }
    const { data, error } = await createSupabaseBrowser().rpc("set_card_public", { p_public: on });
    if (error) { setServerError(serverErrorMessage(errorCodeOf(error))); return; }
    setServerError(null);
    setSlug((data as string | null) ?? null);
  }, [draft, pushToServer]);

  const removeAll = useCallback(async (): Promise<boolean> => {
    if (timer.current) { clearTimeout(timer.current); timer.current = null; }
    if (loggedIn) {
      const { error } = await createSupabaseBrowser().rpc("delete_my_settings");
      if (error) { setServerError(serverErrorMessage(errorCodeOf(error))); return false; }
      hasServerRow.current = false;
      setSlug(null);
    }
    clearLocal(storage);
    latestStamp.current = null;
    setDraft(emptyMySettings());
    setRevision((r) => r + 1);
    return true;
  }, [loggedIn, storage]);

  return { draft, errors, update, loggedIn, slug, status, serverError, revision, setPublic, removeAll };
}
