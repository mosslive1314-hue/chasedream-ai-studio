import { useState, useEffect } from "react";

/**
 * Detects if the app is running inside an iframe (Eazo platform embedded mode)
 * and conditionally renders the WorkbenchHeader.
 * In embedded mode, the host platform provides its own chrome (header/nav),
 * so we hide our WorkbenchHeader to avoid double-chrome.
 */
export function EmbeddedAdapter({
  header,
  children,
}: {
  header: React.ReactNode;
  children: React.ReactNode;
}) {
  const [embedded, setEmbedded] = useState(false);

  useEffect(() => {
    // Detect iframe embedding: window.parent !== window means we're in an iframe
    try {
      const isIframe = window.self !== window.top;
      setEmbedded(isIframe);
    } catch {
      // Cross-origin iframe throws SecurityError on window.top access
      setEmbedded(true);
    }
  }, []);

  return (
    <>
      {!embedded && header}
      {children}
    </>
  );
}
