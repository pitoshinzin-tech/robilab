import type { MetadataRoute } from "next";
import { appManifest } from "@/lib/pwa/manifest-data";

// /manifest.webmanifest で配られ、<link rel="manifest"> は Next.js が自動で付ける(layout に metadata.manifest は書かない)。
// リクエストの情報を使わないので、ビルドのときに作られてキャッシュされる。
export default function manifest(): MetadataRoute.Manifest {
  return appManifest();
}
