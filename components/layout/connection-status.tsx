"use client";

import { useEffect, useState } from "react";

type HealthResponse = {
  status: "checking" | "connected" | "auth_required" | "db_issue";
  message?: string;
};

export function ConnectionStatus() {
  const [state, setState] = useState<HealthResponse>({
    status: "checking"
  });

  useEffect(() => {
    let active = true;

    async function checkConnection() {
      try {
        const response = await fetch("/api/health", {
          cache: "no-store"
        });
        const data = (await response.json()) as HealthResponse;

        if (!active) {
          return;
        }

        setState({
          status: data.status,
          message: data.message
        });
      } catch (error) {
        if (active) {
          setState({
            status: "db_issue",
            message: error instanceof Error ? error.message : "Unable to contact health endpoint."
          });
        }
      }
    }

    void checkConnection();
    const timer = window.setInterval(() => {
      void checkConnection();
    }, 30000);

    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, []);

  const config =
    state.status === "connected"
      ? {
          label: "Connected",
          tone: "bg-green-500",
          dot: "bg-green-500"
        }
      : state.status === "auth_required"
        ? {
            label: "Connecting",
            tone: "bg-yellow-500",
            dot: "bg-yellow-500"
          }
        : state.status === "db_issue"
          ? {
              label: "Not connected",
              tone: "bg-red-500",
              dot: "bg-red-500"
            }
          : {
              label: "Connecting",
              tone: "bg-yellow-500",
              dot: "bg-yellow-500"
            };

  return (
    <span
      title={state.message ?? config.label}
      aria-label={config.label}
      className={`inline-flex h-3 w-3 rounded-full ${config.tone} shadow-[0_0_0_3px_rgba(15,23,42,0.08)]`}
    />
  );
}
