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
const ANALYTICS_ID_STORAGE_KEY = "shipcheck_analytics_id";
const BLOCKED_PROPERTY_KEYS = new Set(["reportId", "sessionId", "errorMessage"]);

function fallbackAnalyticsId() {
  return `visitor-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function sanitizeAnalyticsProperties(properties?: Record<string, unknown>) {
  if (!properties) return undefined;

  return Object.fromEntries(
    Object.entries(properties)
      .filter(([key]) => !BLOCKED_PROPERTY_KEYS.has(key))
      .map(([key, value]) => [key, typeof value === "string" ? value.slice(0, 120) : value]),
  );
}

export function track(event: string, properties?: Record<string, unknown>) {
  if (typeof window === "undefined") return;
  window.pendo?.track?.(event, sanitizeAnalyticsProperties(properties));
}

export function getOrCreateAnalyticsVisitorId(): string {
  if (typeof window === "undefined") return fallbackAnalyticsId();

  const storedId = window.localStorage.getItem(ANALYTICS_ID_STORAGE_KEY);
  if (storedId) return storedId;

  const visitorId = typeof window.crypto?.randomUUID === "function" ? window.crypto.randomUUID() : fallbackAnalyticsId();
  window.localStorage.setItem(ANALYTICS_ID_STORAGE_KEY, visitorId);
  return visitorId;
}

export function initializeAnalyticsVisitor(visitorId: string) {
  if (typeof window === "undefined" || !visitorId) return;

  const options: PendoOptions = {
    visitor: { id: visitorId },
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
