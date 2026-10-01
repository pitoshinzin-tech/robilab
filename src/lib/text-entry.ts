/** スマホでキーボードが開く欄か。開いている間は下のタブバーを隠す(入力欄を隠さないため)。 */
const NON_TEXT = new Set(["button", "checkbox", "color", "file", "hidden", "image", "radio", "range", "reset", "submit"]);

export function isTextEntry(el: { tagName: string; type?: string | null; isContentEditable?: boolean } | null | undefined): boolean {
  if (!el) return false;
  if (el.isContentEditable) return true;
  const tag = el.tagName.toLowerCase();
  if (tag === "textarea") return true;
  if (tag !== "input") return false;
  return !NON_TEXT.has((el.type ?? "text").toLowerCase());
}
