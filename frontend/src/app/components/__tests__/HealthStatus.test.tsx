/**
 * Example Vitest + React Testing Library test.
 *
 * Demonstrates:
 *  - Rendering a React component in jsdom
 *  - Mocking global `fetch` to simulate backend API responses
 *  - Asserting on rendered DOM output
 *  - Waiting for asynchronous data to appear
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import HealthStatus from "../HealthStatus";

// ---------------------------------------------------------------------------
// Mock global fetch before each test
// ---------------------------------------------------------------------------

beforeEach(() => {
  vi.restoreAllMocks();
});

describe("HealthStatus component", () => {
  it("shows a loading indicator initially", () => {
    // Never-resolving fetch to keep the component in loading state
    vi.stubGlobal(
      "fetch",
      vi.fn(() => new Promise(() => {}))
    );

    render(<HealthStatus />);
    expect(screen.getByText(/checking/i)).toBeInTheDocument();
  });

  it("displays 'API is healthy' when backend returns ok", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({ status: "ok" }),
      })
    );

    render(<HealthStatus />);

    await waitFor(() => {
      expect(screen.getByText(/healthy/i)).toBeInTheDocument();
    });
  });

  it("displays an error message when fetch fails", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValueOnce(new Error("Network error"))
    );

    render(<HealthStatus />);

    await waitFor(() => {
      expect(screen.getByText(/unavailable/i)).toBeInTheDocument();
    });
  });

  it("displays an error when backend returns non-ok status", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ detail: "Internal Server Error" }),
      })
    );

    render(<HealthStatus />);

    await waitFor(() => {
      expect(screen.getByText(/unavailable/i)).toBeInTheDocument();
    });
  });

  it("calls the correct backend URL", async () => {
    const mockFetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({ status: "ok" }),
    });
    vi.stubGlobal("fetch", mockFetch);

    render(<HealthStatus />);

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("/health"),
        expect.any(Object)
      );
    });
  });
});
