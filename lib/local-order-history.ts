export type LocalOrderHistoryEntry = {
  id: string;
  orderId: string;
  customerName: string;
  action: "edited" | "deleted";
  reason: string;
  createdAt: string;
};

const STORAGE_KEY = "xprints-order-history";
export const LOCAL_ORDER_HISTORY_EVENT = "xprints-order-history-changed";

function emitLocalOrderHistoryChange() {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(new Event(LOCAL_ORDER_HISTORY_EVENT));
}

export function readLocalOrderHistory() {
  if (typeof window === "undefined") {
    return [] as LocalOrderHistoryEntry[];
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw) as LocalOrderHistoryEntry[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function appendLocalOrderHistory(entry: LocalOrderHistoryEntry) {
  if (typeof window === "undefined") {
    return;
  }

  const history = readLocalOrderHistory();
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify([entry, ...history].slice(0, 100)));
  emitLocalOrderHistoryChange();
}

export function clearLocalOrderHistory() {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(STORAGE_KEY);
  emitLocalOrderHistoryChange();
}
