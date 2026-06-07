"use client";

import { useEffect } from "react";
import { getOrCreateAnalyticsVisitorId, initializeAnalyticsVisitor } from "@/src/lib/analytics";

function createFallbackSessionId() {
  if (typeof window.crypto?.randomUUID === "function") {
    return window.crypto.randomUUID();
  }

  return `shipcheck-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function SessionBootstrap() {
  useEffect(() => {
    const storedSessionId = window.localStorage.getItem("shipcheck_session_id");

    if (storedSessionId) {
      initializeAnalyticsVisitor(getOrCreateAnalyticsVisitorId());
      return;
    }

    fetch("/api/sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userAgent: window.navigator.userAgent }),
    })
      .then((response) => response.json())
      .then((data: { sessionId?: string }) => {
        const sessionId = data.sessionId || createFallbackSessionId();
        window.localStorage.setItem("shipcheck_session_id", sessionId);
        initializeAnalyticsVisitor(getOrCreateAnalyticsVisitorId());
      })
      .catch(() => {
        const sessionId = createFallbackSessionId();
        window.localStorage.setItem("shipcheck_session_id", sessionId);
        initializeAnalyticsVisitor(getOrCreateAnalyticsVisitorId());
      });
  }, []);

  return null;
}
