import path from "path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [],
  test: {
    setupFiles: [path.join(__dirname, "setupTests.ts")],
    include: ["./src/**/*.test.ts"],
    exclude: ["./src/**/*.int.test.ts"],
    globals: true,
  },
});
