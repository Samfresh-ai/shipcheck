declare global {
  interface Window {
    pendo?: {
      track?: (event: string, properties?: Record<string, unknown>) => void;
      pageLoad?: () => void;
    };
  }
}

export function track(event: string, properties?: Record<string, unknown>) {
  if (typeof window === "undefined") return;
  window.pendo?.track?.(event, properties);
}

export function getStoredSessionId(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem("shipcheck_session_id");
}
