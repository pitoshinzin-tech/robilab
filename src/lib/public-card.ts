import { createSupabaseAnon } from "@/lib/supabase/anon";
import { validatePublicCardData, type PublicCardData } from "@/lib/card-view";

const SLUG_RE = /^[A-Za-z0-9]{10}$/;

export function isSlug(s: string): boolean {
  return SLUG_RE.test(s);
}

/** 公開中のカードを取る。非公開・存在しない・形がおかしいときは null。 */
export async function fetchPublicCard(slug: string): Promise<PublicCardData | null> {
  if (!isSlug(slug) || !process.env.NEXT_PUBLIC_SUPABASE_URL) return null;
  const { data, error } = await createSupabaseAnon().rpc("get_public_card", { p_slug: slug });
  if (error) throw new Error(error.message);
  return validatePublicCardData(data) ? data : null;
}
