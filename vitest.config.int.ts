import path from "path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [],
  resolve: {
    alias: {
      src: path.resolve(__dirname, "./src"),
    },
  },
  test: {
    setupFiles: [path.join(__dirname, "setupIntTests.ts")],
    include: ["./src/**/*.int.test.ts"],
    globals: true,
    // Increase timeout for integration tests (Docker containers can be slow)
    testTimeout: 120000, // 2 minutes
    hookTimeout: 180000, // 3 minutes for Docker startup
    // Run tests sequentially to avoid Docker conflicts
    pool: 'forks',
    poolOptions: {
      forks: {
        singleFork: true,
      },
    },
  },
});
