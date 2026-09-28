import { defineConfig } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";
import { config } from "dotenv";

config({ path: ".env.test.local" });

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: { environment: "node", include: ["tests/rls/**/*.rls.test.ts"], testTimeout: 30000, fileParallelism: false },
});
