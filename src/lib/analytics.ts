declare global {
  interface Window {
    pendo?: {
      initialize?: (options: PendoOptions) => void;
      identify?: (options: PendoOptions) => void;
      updateOptions?: (options: PendoOptions) => void;
      track?: (event: string, properties?: Record<string, unknown>) => void;
      pageLoad?: () => void;
    };
    __shipcheckPendoInitialized?: boolean;
  }
}

type PendoOptions = {
  visitor: {
    id: string;
  };
  account: {
    id: string;
  };
};

const PENDO_ACCOUNT_ID = "shipcheck-public";

export function track(event: string, properties?: Record<string, unknown>) {
  if (typeof window === "undefined") return;
  window.pendo?.track?.(event, properties);
}

export function initializeAnalyticsVisitor(sessionId: string) {
  if (typeof window === "undefined" || !sessionId) return;

  const options: PendoOptions = {
    visitor: { id: sessionId },
    account: { id: PENDO_ACCOUNT_ID },
  };

  if (window.__shipcheckPendoInitialized) {
    window.pendo?.identify?.(options);
    window.pendo?.updateOptions?.(options);
    return;
  }

  window.pendo?.initialize?.(options);
  window.__shipcheckPendoInitialized = true;
}

export function getStoredSessionId(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem("shipcheck_session_id");
}
