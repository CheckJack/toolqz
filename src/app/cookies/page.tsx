import type { Metadata } from "next";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { LegalInlineLink, LegalPageIntro, LegalSection } from "@/components/LegalPageContent";
import { StaticPageShell } from "@/components/StaticPageShell";

export const metadata: Metadata = {
  title: "Cookie Policy — TOOLQZ",
  description:
    "How TOOLQZ uses cookies — what we store, why we use them, and how you can manage your preferences.",
};

export default function CookiesPage() {
  return (
    <>
      <Header />
      <StaticPageShell breadcrumb="Cookie Policy">
        <LegalPageIntro
          title="Cookie Policy"
          description="This page explains what cookies are, how TOOLQZ uses them, and the choices you have."
          updated="July 1, 2026"
        />

        <div className="space-y-8">
          <LegalSection title="What are cookies?">
            <p>
              Cookies are small text files stored on your device when you visit a website. They
              help sites remember preferences, keep sessions secure, and understand how pages are
              used.
            </p>
          </LegalSection>

          <LegalSection title="How TOOLQZ uses cookies">
            <p>We use cookies in two broad ways:</p>
            <ul className="list-disc space-y-2 pl-5">
              <li>
                <strong className="font-medium text-white">Essential cookies</strong> — required
                for the site to function (for example, remembering that you accepted this notice).
              </li>
              <li>
                <strong className="font-medium text-white">Optional cookies</strong> — used only
                with your consent, for analytics and advertising (including on our blog via
                services such as Google AdSense).
              </li>
            </ul>
          </LegalSection>

          <LegalSection title="Cookies we may set">
            <ul className="space-y-4">
              <li className="surface rounded-lg p-4">
                <p className="font-medium text-white">toolqz-cookie-consent</p>
                <p className="mt-1 text-[14px]">
                  Stores whether you have accepted optional cookies. Duration: 1 year. Type:
                  essential (preference).
                </p>
              </li>
              <li className="surface rounded-lg p-4">
                <p className="font-medium text-white">toolqz-theme</p>
                <p className="mt-1 text-[14px]">
                  Remembers your light or dark mode preference. Duration: until cleared. Type:
                  essential (preference).
                </p>
              </li>
              <li className="surface rounded-lg p-4">
                <p className="font-medium text-white">Third-party advertising cookies</p>
                <p className="mt-1 text-[14px]">
                  On blog pages, advertising partners may set cookies to serve relevant ads and
                  measure performance. These are only loaded after you accept cookies in our banner.
                </p>
              </li>
            </ul>
          </LegalSection>

          <LegalSection title="Managing cookies">
            <p>
              When you first visit TOOLQZ, you&apos;ll see a cookie notice. You can accept optional
              cookies or read more before deciding. You can also clear or block cookies in your
              browser settings at any time — note that blocking essential cookies may affect site
              functionality.
            </p>
            <p>
              To opt out of personalised Google ads, visit{" "}
              <a
                href="https://adssettings.google.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-white underline-offset-2 hover:underline"
              >
                Google Ads Settings
              </a>
              .
            </p>
          </LegalSection>

          <LegalSection title="Updates">
            <p>
              We may update this policy when our use of cookies changes. Check the date at the top
              of this page. For how we handle site content and affiliate links, see our{" "}
              <LegalInlineLink href="/terms">Terms & Conditions</LegalInlineLink>.
            </p>
          </LegalSection>
        </div>
      </StaticPageShell>
      <Footer />
    </>
  );
}
