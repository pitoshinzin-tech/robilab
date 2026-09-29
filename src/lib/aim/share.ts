export function buildAimShareText(glyph: string, score: number, accuracy: number, timeMs: number): string {
  return `今日の文字【${glyph}】 ${score.toLocaleString("ja-JP")} 点(正確さ ${Math.round(accuracy)}%・${(timeMs / 1000).toFixed(1)} 秒) #ロビラボ #今日の文字`;
}

export function aimErrorMessage(code: string | undefined): string {
  switch (code) {
    case "WRONG_DATE": return "日付が変わったため、この記録はランキングに送れません。今日の文字でもう一度どうぞ。";
    case "WRONG_CHAR": return "お題が変わったため、この記録はランキングに送れません。";
    case "NOT_LOGGED_IN": return "ログインが切れました。ログインし直してください。";
    case "TOO_FAST": return "続けて送ることはできません。少し待ってからもう一度送ってください。";
    case "NOT_ACTIVE": return "アカウントが利用停止中のため、ランキングには載りません。";
    case "BANNED": return "このアカウントではランキングをご利用いただけません。";
    case "INVALID_INPUT": return "記録が正しくないため、ランキングに送れませんでした。";
    default: return "ランキングに送れませんでした。もう一度送ってください。";
  }
}

/** シェア画像の URL。日付を入れて、X や Discord が前の日の画像を使い回さないようにする。 */
export function aimOgImagePath(date: string): string {
  return `/aim/opengraph-image?d=${encodeURIComponent(date)}`;
}
