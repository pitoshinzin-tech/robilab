import type { Axes, AxisId } from "@/data/axes";
import { GAMES, type Game, type Role } from "@/data/games";

const IDS: AxisId[] = ["attack", "instinct", "team", "heat"];

export function roleScore(user: Axes, target: Axes): number {
  const d = Math.sqrt(IDS.reduce((sum, id) => sum + (user[id] - target[id]) ** 2, 0));
  return Math.round(100 * (1 - d / 4));
}

export type GameRank = {
  game: Game;
  best: { role: Role; score: number };
  roles: { role: Role; score: number }[];
};

export function rankGames(user: Axes, games: Game[] = GAMES): GameRank[] {
  return games
    .map((game, index) => {
      const roles = game.roles
        .map((role) => ({ role, score: roleScore(user, role.target) }))
        .sort((x, y) => y.score - x.score);
      return { game, best: roles[0], roles, index };
    })
    .sort((x, y) => y.best.score - x.best.score || x.index - y.index)
    .map(({ index: _index, ...rest }) => rest);
}
