/**
 * HealthStatus — a tiny component that fetches GET /health from the backend.
 *
 * This component exists primarily as a testing example.
 * It shows how a React component that fetches data from FastAPI
 * can be tested with Vitest + React Testing Library.
 */
"use client";

import { useEffect, useState } from "react";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

type Status = "loading" | "healthy" | "unavailable";

export default function HealthStatus() {
  const [status, setStatus] = useState<Status>("loading");

  useEffect(() => {
    let cancelled = false;

    fetch(`${API_BASE_URL}/health`, { cache: "no-store" })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data) => {
        if (!cancelled) {
          setStatus(data.status === "ok" ? "healthy" : "unavailable");
        }
      })
      .catch(() => {
        if (!cancelled) setStatus("unavailable");
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div role="status" aria-live="polite">
      {status === "loading" && <span>Checking API…</span>}
      {status === "healthy" && <span>API is healthy</span>}
      {status === "unavailable" && <span>API unavailable</span>}
    </div>
  );
}
