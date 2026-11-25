"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import {
  getAnalyticsDevice,
  getReferrerSource,
  getVisitorAndSessionIds,
  sendAnalyticsEvent,
} from "@/lib/analytics/client";

export function AnalyticsTracker() {
  const pathname = usePathname();
  const lastTrackedPathRef = useRef<string>("");

  // Track Page View on route change (KHUSUS halaman publik, jangan campur dengan /admin/*)
  useEffect(() => {
    if (!pathname || pathname.startsWith("/admin") || pathname === lastTrackedPathRef.current) return;
    lastTrackedPathRef.current = pathname;

    const { visitorId, sessionId } = getVisitorAndSessionIds();
    sendAnalyticsEvent({
      type: "pageview",
      visitorId,
      sessionId,
      path: pathname,
      device: getAnalyticsDevice(),
      referrer: getReferrerSource(),
    });
  }, [pathname]);

  // Track Live Heartbeat (KHUSUS pengunjung publik, kirim awal 2 detik & setiap 20 detik saat tab aktif)
  useEffect(() => {
    if (pathname?.startsWith("/admin")) return;

    const sendBeat = (delta: number) => {
      if (document.visibilityState !== "visible") return;
      const { visitorId, sessionId } = getVisitorAndSessionIds();
      sendAnalyticsEvent({
        type: "heartbeat",
        visitorId,
        sessionId,
        path: pathname || "/",
        device: getAnalyticsDevice(),
        secondsDelta: delta,
      });
    };

    const initialTimer = setTimeout(() => sendBeat(5), 2000);
    const interval = setInterval(() => sendBeat(20), 20000);

    return () => {
      clearTimeout(initialTimer);
      clearInterval(interval);
    };
  }, [pathname]);

  // Track Button & Link Clicks (KHUSUS pengunjung publik)
  useEffect(() => {
    if (pathname?.startsWith("/admin")) return;
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;
      const clickable = target.closest("button, a") as HTMLElement | null;
      if (!clickable) return;

      const rawLabel =
        clickable.getAttribute("data-track") ||
        clickable.getAttribute("aria-label") ||
        clickable.getAttribute("title") ||
        clickable.innerText?.trim().replace(/\s+/g, " ") ||
        "";

      const cleanLabel = rawLabel.slice(0, 60).trim();
      if (!cleanLabel) return;

      const { visitorId, sessionId } = getVisitorAndSessionIds();
      sendAnalyticsEvent({
        type: "click",
        visitorId,
        sessionId,
        label: cleanLabel,
        path: pathname || "/",
        device: getAnalyticsDevice(),
      });
    };

    document.addEventListener("click", handleClick, { capture: true, passive: true });
    return () => document.removeEventListener("click", handleClick, { capture: true });
  }, [pathname]);

  return null;
}
