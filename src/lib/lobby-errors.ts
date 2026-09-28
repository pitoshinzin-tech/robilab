const MESSAGES: Record<string, string> = {
  NOT_LOGGED_IN: "ログインが切れました。もう一度ログインしてください。",
  NO_DISCORD: "Discord でログインしてください。",
  BANNED: "このアカウントはご利用いただけません。",
  UNDER_AGE: "マッチングは18歳以上の方が対象です(15〜17歳の方向けの枠は12月ごろ開放予定です)。",
  ALREADY_REGISTERED: "すでに登録済みです。",
  NG_WORD: "ニックネームかひとことに、使えない言葉が含まれています。",
  INVALID_INPUT: "入力内容を確認してください(ゲームと時間帯は1つ以上選んでください)。",
  NOT_ACTIVE: "現在、アカウントが一時停止中です。",
  NOT_FOUND: "相手が見つかりませんでした。",
  DAILY_LIMIT: "今日の声かけは上限(10人)です。明日また来てね。",
  ALREADY_PENDING: "この人には、すでに声をかけています。返事を待ってね。",
  ALREADY_MATCHED: "この人とは、すでにつながっています。通知から Discord 名を確認できます。",
  BLOCKED: "この声かけには返事できません。",
  ALREADY_REPORTED: "この人はすでに通報済みです。",
  REPORT_LIMIT: "今日の通報は上限に達しました。明日以降にお願いします。",
};

export function lobbyErrorMessage(code: string | undefined): string {
  return (code && MESSAGES[code]) || "うまくいきませんでした。時間をおいて、もう一度お試しください。";
}

export function errorCodeOf(error: { message?: string } | null): string | undefined {
  return error?.message?.match(/[A-Z_]{4,}/)?.[0];
}
