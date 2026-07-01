import Script from "next/script";
import { ADSENSE_CLIENT_ID, isAdSenseEnabled } from "@/lib/adsense";

export default function BlogLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {isAdSenseEnabled() && (
        <Script
          id="adsense-script"
          async
          src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT_ID}`}
          crossOrigin="anonymous"
          strategy="afterInteractive"
        />
      )}
      {children}
    </>
  );
}
