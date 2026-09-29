import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";

// Next.js 16 で Middleware は Proxy に改称された(機能は同じ)。
// node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/proxy.md 参照。
export function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = { matcher: ["/lobby/:path*", "/auth/:path*", "/my", "/aim", "/mouse"] };
