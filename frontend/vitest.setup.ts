/**
 * Global test setup for Vitest + React Testing Library.
 *
 * - Extends expect() with DOM-specific matchers (toBeInTheDocument, etc.)
 * - Cleans up rendered components after each test
 */
import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

// Automatically unmount React trees after every test
afterEach(() => {
  cleanup();
});
