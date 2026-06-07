"use client";

import { useEffect } from "react";

export function SessionBootstrap() {
  useEffect(() => {
    if (window.localStorage.getItem("shipcheck_session_id")) return;

    fetch("/api/sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userAgent: window.navigator.userAgent }),
    })
      .then((response) => response.json())
      .then((data: { sessionId?: string }) => {
        if (data.sessionId) window.localStorage.setItem("shipcheck_session_id", data.sessionId);
      })
      .catch(() => undefined);
  }, []);

  return null;
}
