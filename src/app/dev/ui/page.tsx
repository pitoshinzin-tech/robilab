import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { UiShowcase } from "./UiShowcase";

export const metadata: Metadata = { title: "部品の確認", robots: { index: false, follow: false } };

/** 部品の状態(hover / active / focus-visible / disabled / loading)を確かめるページ。本番では出さない。 */
export default function DevUiPage() {
  if (process.env.NODE_ENV === "production") notFound();
  return <UiShowcase />;
}
