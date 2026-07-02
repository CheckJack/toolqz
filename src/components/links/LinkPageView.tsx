import Image from "next/image";
import Link from "next/link";
import {
  getButtonRadiusClass,
  getPageBackgroundStyle,
  normalizeLinkUrl,
} from "@/lib/link-page";
import type { LinkPageSettings } from "@/types/link-page";

interface LinkPageViewProps {
  page: LinkPageSettings;
  preview?: boolean;
}

export function LinkPageView({ page, preview = false }: LinkPageViewProps) {
  const buttonRadius = getButtonRadiusClass(page.buttonStyle);
  const enabledLinks = page.links.filter((link) => link.enabled);

  return (
    <div
      className={`relative flex min-h-screen flex-col items-center px-5 py-12 sm:py-16 ${
        preview ? "min-h-[640px] rounded-2xl border border-dark-border" : ""
      }`}
      style={getPageBackgroundStyle(page)}
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(109,180,232,0.12)_0%,transparent_55%)]" />

      <div className="relative z-10 flex w-full max-w-md flex-col items-center">
        {page.avatarUrl ? (
          <div className="relative mb-4 h-24 w-24 overflow-hidden rounded-full border border-white/15 shadow-[0_12px_40px_rgba(0,0,0,0.25)]">
            <Image
              src={page.avatarUrl}
              alt=""
              fill
              className="object-cover"
              sizes="96px"
              unoptimized
            />
          </div>
        ) : (
          <div className="mb-4 flex h-24 w-24 items-center justify-center rounded-full border border-white/15 bg-white/5 text-3xl font-semibold text-white shadow-[0_12px_40px_rgba(0,0,0,0.25)]">
            {page.title.charAt(0).toUpperCase()}
          </div>
        )}

        <h1 className="text-center text-2xl font-semibold tracking-[-0.03em] text-white">
          {page.title}
        </h1>
        {page.bio && (
          <p className="mt-2 max-w-sm text-center text-[15px] leading-relaxed text-white/75">
            {page.bio}
          </p>
        )}

        <ul className="mt-8 flex w-full flex-col gap-3">
          {enabledLinks.map((link) => {
            const href = normalizeLinkUrl(link.url);
            const isExternal = /^https?:\/\//i.test(href);

            return (
              <li key={link.id}>
                <a
                  href={href}
                  target={isExternal ? "_blank" : undefined}
                  rel={isExternal ? "noopener noreferrer" : undefined}
                  className={`flex min-h-12 w-full items-center justify-center gap-2 border border-white/10 px-5 py-3 text-[15px] font-medium shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_8px_24px_rgba(0,0,0,0.18)] transition-transform hover:scale-[1.01] active:scale-[0.99] ${buttonRadius}`}
                  style={{
                    backgroundColor: page.buttonColor,
                    color: page.buttonTextColor,
                  }}
                >
                  {link.icon && <span aria-hidden>{link.icon}</span>}
                  <span>{link.title}</span>
                </a>
              </li>
            );
          })}
        </ul>

        {enabledLinks.length === 0 && (
          <p className="mt-8 text-center text-sm text-white/60">No links yet.</p>
        )}

        {page.showBranding && (
          <div className="mt-10">
            {preview ? (
              <span className="text-[13px] text-white/50">
                TOOL<span className="text-neon/80">QZ</span>
              </span>
            ) : (
              <Link
                href="/"
                className="text-[13px] font-semibold tracking-[-0.03em] text-white/50 transition-colors hover:text-white/80"
              >
                TOOL<span className="text-neon/80">QZ</span>
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
