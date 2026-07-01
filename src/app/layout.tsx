import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "@/components/ThemeProvider";
import { CookieNotice } from "@/components/CookieNotice";
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
};

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

const themeInitScript = `(function(){try{var k=${JSON.stringify(THEME_STORAGE_KEY)};var t=localStorage.getItem(k);var d=document.documentElement;if(t==='light'||t==='dark'){d.setAttribute('data-theme',t);d.style.colorScheme=t;return;}if(window.matchMedia('(prefers-color-scheme: light)').matches){d.setAttribute('data-theme','light');d.style.colorScheme='light';}else{d.setAttribute('data-theme','dark');d.style.colorScheme='dark';}}catch(e){document.documentElement.setAttribute('data-theme','dark');}})();`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <ThemeProvider>
          <SiteBackground />
          <PublicContent>{children}</PublicContent>
          <CookieNotice />
        </ThemeProvider>
      </body>
    </html>
  );
}
