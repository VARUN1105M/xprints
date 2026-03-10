"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { CheckCircle2, CircleAlert, X } from "lucide-react";
import { Button } from "@/components/ui/button";

type FeedbackTone = "success" | "error" | "info";

type FeedbackItem = {
  id: number;
  title: string;
  description?: string;
  tone: FeedbackTone;
};

type FeedbackContextValue = {
  notify: (item: Omit<FeedbackItem, "id">) => void;
};

const FeedbackContext = createContext<FeedbackContextValue | null>(null);

export function FeedbackProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<FeedbackItem[]>([]);

  const notify = useCallback((item: Omit<FeedbackItem, "id">) => {
    const id = Date.now() + Math.floor(Math.random() * 1000);
    setItems((current) => [...current, { ...item, id }]);
    window.setTimeout(() => {
      setItems((current) => current.filter((entry) => entry.id !== id));
    }, 4000);
  }, []);

  const value = useMemo(() => ({ notify }), [notify]);

  return (
    <FeedbackContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed right-4 top-4 z-[70] flex w-[min(92vw,360px)] flex-col gap-3">
        {items.map((item) => {
          const isSuccess = item.tone === "success";
          const isError = item.tone === "error";
          return (
            <div
              key={item.id}
              className={`pointer-events-auto rounded-2xl border p-4 shadow-soft backdrop-blur ${
                isSuccess
                  ? "border-foreground bg-foreground text-background"
                  : isError
                    ? "border-destructive/40 bg-background text-foreground"
                    : "border-border bg-background text-foreground"
              }`}
            >
              <div className="flex items-start gap-3">
                {isSuccess ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" /> : <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" />}
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold">{item.title}</p>
                  {item.description ? <p className={`mt-1 text-sm ${isSuccess ? "text-background/80" : "text-muted-foreground"}`}>{item.description}</p> : null}
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className={`h-7 w-7 shrink-0 ${isSuccess ? "text-background hover:bg-background/10" : ""}`}
                  onClick={() => setItems((current) => current.filter((entry) => entry.id !== item.id))}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </FeedbackContext.Provider>
  );
}

export function useFeedback() {
  const context = useContext(FeedbackContext);

  if (!context) {
    throw new Error("useFeedback must be used within FeedbackProvider");
  }

  return context;
}
