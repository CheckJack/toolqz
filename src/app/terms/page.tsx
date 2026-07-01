import type { Metadata } from "next";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { LegalInlineLink, LegalPageIntro, LegalSection } from "@/components/LegalPageContent";
import { StaticPageShell } from "@/components/StaticPageShell";

export const metadata: Metadata = {
  title: "Terms & Conditions — TOOLQZ",
  description:
    "Terms and conditions for using TOOLQZ — our curated directory of life-hack tools, reviews, and affiliate links.",
};

export default function TermsPage() {
  return (
    <>
      <Header />
      <StaticPageShell breadcrumb="Terms & Conditions">
        <LegalPageIntro
          title="Terms & Conditions"
          description="Please read these terms before using TOOLQZ. By accessing our site, you agree to them."
          updated="July 1, 2026"
        />

        <div className="space-y-8">
          <LegalSection title="1. About TOOLQZ">
            <p>
              TOOLQZ (&quot;we&quot;, &quot;us&quot;) operates a curated directory of websites and
              digital tools at toolqz.com. We publish reviews, comparisons, and editorial content
              to help readers discover tools worth their time.
            </p>
          </LegalSection>

          <LegalSection title="2. Using the site">
            <p>
              You may browse TOOLQZ for personal, non-commercial use. You agree not to misuse the
              site — including attempting to scrape content at scale, interfere with our systems, or
              use our brand in a way that suggests partnership without permission.
            </p>
            <p>
              Tool listings, ratings, and reviews reflect our opinion at the time of publication.
              Products change; always verify pricing, features, and terms on the official provider
              before signing up.
            </p>
          </LegalSection>

          <LegalSection title="3. Affiliate links">
            <p>
              Some outbound links on TOOLQZ are affiliate links. If you sign up or purchase through
              those links, we may earn a commission at no extra cost to you. Affiliate relationships
              do not determine whether a tool is listed — see our{" "}
              <LegalInlineLink href="/how-we-pick">how we pick tools</LegalInlineLink> page for our
              editorial process.
            </p>
          </LegalSection>

          <LegalSection title="4. Intellectual property">
            <p>
              TOOLQZ content — including text, layout, logos, and original graphics — is owned by
              us or our licensors. You may not copy, republish, or redistribute substantial portions
              without written permission. Short quotations with a clear link back to TOOLQZ are
              fine.
            </p>
            <p>
              Third-party trademarks, logos, and product names belong to their respective owners
              and are used on TOOLQZ for identification and review purposes only.
            </p>
          </LegalSection>

          <LegalSection title="5. Disclaimer">
            <p>
              TOOLQZ is provided &quot;as is&quot; without warranties of any kind. We do not
              guarantee that listings are complete, current, or error-free. We are not responsible
              for third-party products, services, billing, or support — your relationship is with
              the provider you choose.
            </p>
          </LegalSection>

          <LegalSection title="6. Limitation of liability">
            <p>
              To the fullest extent permitted by law, TOOLQZ and its operators will not be liable
              for any indirect, incidental, or consequential damages arising from your use of the
              site or reliance on our content.
            </p>
          </LegalSection>

          <LegalSection title="7. Changes">
            <p>
              We may update these terms from time to time. The &quot;Last updated&quot; date at the
              top of this page will change when we do. Continued use of the site after changes
              constitutes acceptance of the revised terms.
            </p>
          </LegalSection>

          <LegalSection title="8. Contact">
            <p>
              Questions about these terms? Reach us through our{" "}
              <LegalInlineLink href="/work-with-us">Partnerships</LegalInlineLink> page.
            </p>
          </LegalSection>
        </div>
      </StaticPageShell>
      <Footer />
    </>
  );
}
