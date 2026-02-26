/// <reference types="vitest" />
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  test: {
    // Use jsdom so React components have a DOM to render into
    environment: "jsdom",
    // Run setup file before every test suite
    setupFiles: ["./vitest.setup.ts"],
    // Glob patterns for test files
    include: ["src/**/*.{test,spec}.{ts,tsx}"],
    // Enable global test APIs (describe, it, expect) without imports
    globals: true,
    // CSS handling — ignore CSS imports in tests
    css: false,
    // Coverage configuration (optional — run with `vitest --coverage`)
    coverage: {
      provider: "v8",
      include: ["src/**/*.{ts,tsx}"],
      exclude: [
        "src/**/*.d.ts",
        "src/**/*.test.{ts,tsx}",
        "src/**/*.spec.{ts,tsx}",
      ],
    },
  },
});
