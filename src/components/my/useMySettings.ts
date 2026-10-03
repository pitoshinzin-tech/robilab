"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { loadSupabaseBrowser } from "@/lib/supabase/lazy";
import { errorCodeOf } from "@/lib/lobby-errors";
import { emptyMySettings, parseMySettings, validateMySettings, type FieldErrors, type MySettings } from "@/lib/my-settings";
import { browserStorage, clearDirty, clearLocal, loadDirty, loadLocal, markDirty, mergeForSync, saveLocal } from "@/lib/my-settings-store";

export type SyncStatus = "local" | "memory" | "saving" | "synced" | "server-error";

export function serverErrorMessage(code: string | undefined): string {
  if (code === "NG_WORD") return "デバイス名・ゲーム名・表示名に使えない言葉が含まれています。直すまでサーバーには保存されません。";
  if (code === "NOT_FOUND") return "先に設定を保存してから公開してください。";
  if (code === "NOT_ACTIVE") return "アカウントが利用停止中のため、マイ設定の保存と名刺の公開はできません。";
  if (code === "BANNED") return "このアカウントではマイ設定の保存と名刺の公開をご利用いただけません。";
  if (code === "CARD_LOCKED") return "この名刺は運営の判断により公開できません。";
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
  // サーバーへの保存を順番どおりに届けるため、前の保存が終わってから次を始める
  const saveChain = useRef<Promise<unknown>>(Promise.resolve());
  // 入力に誤りがあって保存できなかったあいだに変えた項目。次に保存できたときに dirty にする
  const pendingKeys = useRef<string[]>([]);
  // サーバーの設定を読んで引き継ぎが終わるまでは、編集をサーバーへ送らない(読めなかったときも送らない)
  const syncReady = useRef(false);
  const validation = validateMySettings(draft);
  const errors: FieldErrors = validation.ok ? {} : validation.errors;

  const pushToServer = useCallback((s: MySettings): Promise<boolean> => {
    setStatus("saving");
    const run = async (): Promise<boolean> => {
      const { data, error } = await (await loadSupabaseBrowser()).rpc("save_my_settings", { p_data: s });
      if (error) {
        setStatus("server-error");
        setServerError(serverErrorMessage(errorCodeOf(error)));
        return false;
      }
      hasServerRow.current = true;
      setServerError(null);
      setStatus("synced");
      // 送ったあとに編集していなければ、サーバーが付けた updatedAt を取り込む(値は同じ)。変えた項目の印も消す
      if (latestStamp.current === s.updatedAt) {
        clearDirty(storage);
        const saved = parseMySettings(data ?? null);
        if (saved) {
          latestStamp.current = saved.updatedAt;
          saveLocal(storage, saved);
          setDraft(saved);
        }
      }
      return true;
    };
    const next = saveChain.current.then(run, run);
    saveChain.current = next;
    return next;
  }, [storage]);

  // ログインしていれば、サーバーの設定を土台にし、この端末で前回の同期以降に変えた項目だけを上書きする
  useEffect(() => {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return;
    let cancelled = false;
    (async () => {
      const supabase = await loadSupabaseBrowser();
      if (cancelled) return;
      const { data: { user } } = await supabase.auth.getUser();
      if (cancelled || !user) return;
      setLoggedIn(true);
      const { data: row, error } = await supabase.from("my_settings").select("data, public_slug").maybeSingle();
      if (cancelled) return;
      if (error) {
        // 読めなかったときは「行がない」と扱わない(上書きや空の保存を防ぐ)
        setStatus("server-error");
        setServerError("サーバーから設定を読めませんでした。この端末の設定だけを使っています。");
        return;
      }
      hasServerRow.current = Boolean(row);
      setSlug((row?.public_slug as string | null) ?? null);
      const server = parseMySettings(row?.data ?? null);
      const local = loadLocal(storage);
      syncReady.current = true;
      const { result, push } = mergeForSync(local, server, loadDirty(storage));
      if (result && JSON.stringify(result) !== JSON.stringify(local)) {
        saveLocal(storage, result);
        setDraft(result);
        setRevision((r) => r + 1);
      }
      if (result) latestStamp.current = result.updatedAt;
      if (result && push) {
        await pushToServer(result);
      } else {
        // サーバーの内容をそのまま使うので、この端末の変更の印はもう要らない
        if (result) clearDirty(storage);
        setStatus("synced");
      }
    })();
    return () => { cancelled = true; };
  }, [pushToServer, storage]);

  const update = useCallback((patch: Partial<MySettings>) => {
    const next: MySettings = { ...draft, ...patch, updatedAt: new Date().toISOString() };
    latestStamp.current = next.updatedAt;
    setDraft(next);
    pendingKeys.current = [...pendingKeys.current, ...Object.keys(patch)];
    const v = validateMySettings(next);
    if (!v.ok) return;
    saveLocal(storage, v.value);
    markDirty(storage, pendingKeys.current);
    pendingKeys.current = [];
    if (!loggedIn || !syncReady.current) return;
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => { timer.current = null; void pushToServer(v.value); }, SAVE_DELAY_MS);
  }, [draft, loggedIn, pushToServer, storage]);

  const setPublic = useCallback(async (on: boolean) => {
    // サーバーの設定を読み終わる前(または読めなかったとき)は、公開の切り替えをしない
    if (!syncReady.current) return;
    if (on && (timer.current || !hasServerRow.current)) {
      // まだサーバーに届いていない入力があれば、先に保存する
      if (timer.current) { clearTimeout(timer.current); timer.current = null; }
      const v = validateMySettings(draft);
      if (!v.ok) return;
      if (!(await pushToServer(v.value))) return;
    }
    const { data, error } = await (await loadSupabaseBrowser()).rpc("set_card_public", { p_public: on });
    if (error) { setServerError(serverErrorMessage(errorCodeOf(error))); return; }
    setServerError(null);
    setSlug((data as string | null) ?? null);
  }, [draft, pushToServer]);

  const removeAll = useCallback(async (): Promise<boolean> => {
    if (timer.current) { clearTimeout(timer.current); timer.current = null; }
    if (loggedIn) {
      const { error } = await (await loadSupabaseBrowser()).rpc("delete_my_settings");
      if (error) { setServerError(serverErrorMessage(errorCodeOf(error))); return false; }
      hasServerRow.current = false;
      setSlug(null);
    }
    clearLocal(storage);
    clearDirty(storage);
    pendingKeys.current = [];
    latestStamp.current = null;
    setDraft(emptyMySettings());
    setRevision((r) => r + 1);
    return true;
  }, [loggedIn, storage]);

  return { draft, errors, valid: validation.ok, update, loggedIn, slug, status, serverError, revision, setPublic, removeAll };
}
