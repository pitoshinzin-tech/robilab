import { notFound, redirect } from "next/navigation";
import { publishedGame } from "@/lib/char-dex";

type Props = { params: Promise<{ game: string }> };

/**
 * 設計書 6-1:ゲームのページは将来のために空けておき、今は図鑑の一覧へ 307。
 * その場で動く小さなページ(静的に作ったページの中の redirect は状態コードが版で変わりうるため)。
 * 行き先は公開しているゲームの id だけで組み立てる(知らない・公開していないゲームは 404。開いた転送にならない)。
 */
export default async function GameRedirect({ params }: Props) {
  const { game } = await params;
  const found = publishedGame(game);
  if (!found) notFound();
  redirect(`/games/${found.game.id}/chars`);
}
