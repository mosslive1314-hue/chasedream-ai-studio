"use client";
import { useEffect } from "react";

/**
 * Injects CSS overrides at runtime to hide Eazo platform handoff banners.
 * This is necessary because the Eazo SDK injects its styles via JavaScript
 * <style> tags directly into the DOM, which can override compiled CSS.
 * By injecting our own <style> tag at runtime, we ensure proper cascade order.
 */
export function EazoBannerHider() {
  useEffect(() => {
    const id = "eazo-banner-override";
    if (document.getElementById(id)) return;

    const style = document.createElement("style");
    style.id = id;
    style.textContent = `
      .eazo-handoff-root { display: none !important; }
      html.eazo-host-web { padding-top: 0 !important; padding-bottom: 0 !important; }
      html.eazo-host-web .eazo-app-area { inset: 0 !important; }
      html.eazo-host-web .eazo-app-area-scroller { inset: 0 !important; }
    `;
    document.head.appendChild(style);

    // Also reset inline styles the SDK sets on <html>
    const html = document.documentElement;
    html.style.paddingTop = "0";
    html.style.paddingBottom = "0";

    return () => {
      style.remove();
    };
  }, []);

  return null;
}
