import type { Axes } from "@/data/axes";

export type GameEntry = { id: string; rank?: string };

export type ProfileInput = {
  nickname: string;
  typeCode: string | null;
  axes: Axes | null;
  games: GameEntry[];
  platforms: string[];
  voiceOk: boolean;
  timeSlots: string[];
  bio: string;
};

export type Candidate = {
  id: string;
  nickname: string;
  type_code: string | null;
  axes: Axes | null;
  games: GameEntry[];
  platforms: string[];
  voice_ok: boolean;
  time_slots: string[];
  bio: string;
  created_at: string;
};

export type InboxRow = {
  kind: "received" | "sent" | "matched";
  approach_id: string;
  partner_id: string;
  nickname: string;
  type_code: string | null;
  axes: Axes | null;
  games: GameEntry[];
  discord_username: string | null;
  discord_user_id: string | null;
  status: "pending" | "accepted" | "expired";
  created_at: string;
};
