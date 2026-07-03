"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { getCookieConsent, setCookieConsent } from "@/lib/cookies";
import { dispatchAnalyticsConsent } from "@/lib/analytics";
import { BOTTOM_CHROME_VARS, setBottomChromeHeight } from "@/lib/bottom-chrome";

export function CookieNotice() {
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);
  const bannerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (pathname?.startsWith("/admin")) return;
    setVisible(getCookieConsent() !== "accepted");
  }, [pathname]);

  useEffect(() => {
    if (!visible) {
      setBottomChromeHeight(BOTTOM_CHROME_VARS.cookieNotice, 0);
      return;
    }

    const el = bannerRef.current;
    if (!el) return;

    function updateHeight() {
      setBottomChromeHeight(BOTTOM_CHROME_VARS.cookieNotice, el?.offsetHeight ?? 0);
    }

    updateHeight();
    const observer = new ResizeObserver(updateHeight);
    observer.observe(el);

    return () => {
      observer.disconnect();
      setBottomChromeHeight(BOTTOM_CHROME_VARS.cookieNotice, 0);
    };
  }, [visible]);

  function accept() {
    setCookieConsent();
    dispatchAnalyticsConsent();
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div
      ref={bannerRef}
      role="dialog"
      aria-label="Cookie notice"
      className="fixed inset-x-0 bottom-0 z-[45] border-t border-dark-border bg-dark p-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:p-5"
    >
      <div className="mx-auto flex max-w-6xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
        <p className="text-[13px] leading-relaxed text-muted sm:text-[14px]">
          We use essential cookies to run TOOLQZ. With your consent, we may also use cookies for
          analytics and advertising (including on our blog). See our{" "}
          <Link href="/cookies" className="text-white underline-offset-2 hover:underline">
            Cookie Policy
          </Link>
          .
        </p>
        <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
          <Link
            href="/cookies"
            className="btn-ghost min-h-11 border border-dark-border px-4 py-2.5 text-center text-[13px]"
          >
            Learn more
          </Link>
          <button type="button" onClick={accept} className="btn-primary px-5 py-2.5 text-[13px]">
            Accept cookies
          </button>
        </div>
      </div>
    </div>
  );
}
