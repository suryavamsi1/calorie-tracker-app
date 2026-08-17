import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    env: {
      NODE_ENV: "test",
      DATABASE_PATH: ":memory:",
      JWT_SECRET: "test-secret",
    },
    fileParallelism: false,
  },
});
