import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { headers } from "next/headers";
import { Suspense } from "react";
import { ThemeProvider } from "@/components/ThemeProvider";
import { CookieNotice } from "@/components/CookieNotice";
import { GoogleAnalytics } from "@/components/GoogleAnalytics";
import { NewsletterPopup } from "@/components/NewsletterPopup";
import { SiteBackground } from "@/components/SiteBackground";
import { PublicContent } from "@/components/PublicContent";
import { THEME_STORAGE_KEY } from "@/lib/theme";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover" as const,
  colorScheme: "dark" as const,
};

/** Avoid serving year-long cached HTML that references stale build chunks after deploy. */
export const revalidate = 3600;

export const metadata: Metadata = {
  icons: {
    icon: "/favicon.svg",
  },
  title: "TOOLQZ — Discover Life-Hack Websites",
  description:
    "Search and discover curated life-hack websites across productivity, food, finance, entertainment, and more. Tested, verified, and promoted by TOOLQZ.",
  keywords: [
    "life hacks",
    "tools",
    "websites",
    "productivity",
    "curated",
    "TOOLQZ",
  ],
  openGraph: {
    title: "TOOLQZ — Discover Life-Hack Websites",
    description:
      "Your go-to directory for the best websites across every category.",
    type: "website",
  },
};

const themeInitScript = `(function(){try{var d=document.documentElement;d.setAttribute('data-theme','dark');d.style.colorScheme='dark';localStorage.removeItem(${JSON.stringify(THEME_STORAGE_KEY)});}catch(e){}})();`;

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const isAuthPage = (await headers()).get("x-toolqz-auth-page") === "1";

  return (
    <html lang="en" data-theme="dark" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        {isAuthPage ? (
          children
        ) : (
          <ThemeProvider>
            <SiteBackground />
            <PublicContent>{children}</PublicContent>
            <Suspense fallback={null}>
              <GoogleAnalytics />
            </Suspense>
            <CookieNotice />
            <NewsletterPopup />
          </ThemeProvider>
        )}
      </body>
    </html>
  );
}
