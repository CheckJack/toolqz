"use client";

import { usePathname, useSearchParams } from "next/navigation";
import Script from "next/script";
import { useEffect, useState } from "react";
import {
  GA_CONSENT_EVENT,
  GA_MEASUREMENT_ID,
  isGaEnabled,
} from "@/lib/analytics";
import { getCookieConsent } from "@/lib/cookies";

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    dataLayer?: unknown[];
  }
}

function sendPageview(path: string) {
  if (!window.gtag) return;
  window.gtag("config", GA_MEASUREMENT_ID, { page_path: path });
}

export function GoogleAnalytics() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [consentGranted, setConsentGranted] = useState(false);
  const isAdmin = pathname?.startsWith("/admin") ?? false;

  useEffect(() => {
    if (!isGaEnabled() || isAdmin) return;

    setConsentGranted(getCookieConsent() === "accepted");

    function onConsent() {
      setConsentGranted(true);
    }

    window.addEventListener(GA_CONSENT_EVENT, onConsent);
    return () => window.removeEventListener(GA_CONSENT_EVENT, onConsent);
  }, [isAdmin]);

  useEffect(() => {
    if (!consentGranted || !isGaEnabled() || isAdmin) return;

    const query = searchParams.toString();
    const path = query ? `${pathname}?${query}` : pathname;
    sendPageview(path);
  }, [consentGranted, isAdmin, pathname, searchParams]);

  if (!isGaEnabled() || !consentGranted || isAdmin) {
    return null;
  }

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
        strategy="afterInteractive"
      />
      <Script id="toolqz-ga-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${GA_MEASUREMENT_ID}', { anonymize_ip: true });
        `}
      </Script>
    </>
  );
}
