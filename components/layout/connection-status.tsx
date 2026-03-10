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
          label: "Live DB",
          tone: "bg-foreground text-background",
          dot: "bg-green-500"
        }
      : state.status === "auth_required"
        ? {
            label: "Auth required",
            tone: "bg-background text-foreground border border-border",
            dot: "bg-yellow-500"
          }
        : state.status === "db_issue"
          ? {
              label: "DB issue",
              tone: "bg-background text-foreground border border-border",
              dot: "bg-red-500"
            }
          : {
              label: "Checking",
              tone: "bg-background text-muted-foreground border border-border",
              dot: "bg-yellow-500"
            };

  return (
    <div
      title={state.message ?? config.label}
      className={`inline-flex items-center gap-2 rounded-full px-3 py-2 text-xs font-medium ${config.tone}`}
    >
      <span className={`h-2 w-2 rounded-full ${config.dot}`} />
      {config.label}
    </div>
  );
}
