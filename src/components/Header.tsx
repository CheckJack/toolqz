"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { BrandLogo } from "@/components/BrandLogo";

const navLinks = [
  { href: "/", label: "Browse", scrollHomeTop: true },
  { href: "/blog", label: "Blog" },
  { href: "/how-we-pick", label: "How we pick" },
  { href: "/work-with-us", label: "Partnerships" },
] as const;

function isNavLinkActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  if (href === "/blog") return pathname === href || pathname.startsWith("/blog");
  return pathname === href;
}

export function Header() {
  const pathname = usePathname();
  const isAdmin = pathname.startsWith("/admin");
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(isAdmin);

  useEffect(() => {
    if (isAdmin) {
      setScrolled(true);
      return;
    }

    function onScroll() {
      setScrolled(window.scrollY > 24);
    }

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [isAdmin]);

  const solidHeader = isAdmin || scrolled || menuOpen;

  useEffect(() => {
    if (!menuOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setMenuOpen(false);
    }
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [menuOpen]);

  return (
    <header
      className={`sticky top-0 z-50 pt-[env(safe-area-inset-top,0px)] transition-[background-color,backdrop-filter] duration-300 ${
        solidHeader
          ? menuOpen
            ? "bg-dark backdrop-blur-lg md:bg-dark/90"
            : "bg-dark/90 backdrop-blur-lg"
          : "bg-transparent"
      }`}
    >
      <div className="relative mx-auto flex h-14 max-w-6xl items-center justify-between px-5 sm:px-8">
        <BrandLogo size="lg" onClick={() => setMenuOpen(false)} />

        <nav className="hidden items-center gap-7 md:flex">
          {navLinks.map((link) => {
            const active = isNavLinkActive(pathname, link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={(e) => {
                  if (link.scrollHomeTop && pathname === "/") {
                    e.preventDefault();
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }
                }}
                className={`text-[13px] transition-colors ${
                  active ? "text-white" : "text-muted hover:text-white"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-1">
          <button
            type="button"
            className="hover-subtle flex h-11 w-11 items-center justify-center rounded-lg text-muted transition-colors hover:text-white md:hidden"
            onClick={() => setMenuOpen((open) => !open)}
            aria-expanded={menuOpen}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              {menuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 7h16M4 12h16M4 17h16" />
              )}
            </svg>
          </button>
        </div>

        {menuOpen && (
          <>
            <button
              type="button"
              className="fixed inset-0 top-[calc(var(--header-height)+env(safe-area-inset-top,0px))] z-40 bg-black/50 md:hidden"
              onClick={() => setMenuOpen(false)}
              aria-label="Close menu"
            />
            <nav className="fixed inset-x-0 top-[calc(var(--header-height)+env(safe-area-inset-top,0px))] z-50 border-b border-dark-border bg-dark px-5 py-3 shadow-[0_16px_40px_rgba(0,0,0,0.35)] md:hidden">
              <ul className="space-y-0.5">
                {navLinks.map((link) => {
                  const active = isNavLinkActive(pathname, link.href);
                  return (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        onClick={(e) => {
                          if (link.scrollHomeTop && pathname === "/") {
                            e.preventDefault();
                            window.scrollTo({ top: 0, behavior: "smooth" });
                          }
                          setMenuOpen(false);
                        }}
                        className={`hover-subtle block min-h-11 rounded-lg px-3 py-3 text-[15px] transition-colors hover:text-white ${
                          active ? "font-medium text-white" : "text-muted"
                        }`}
                      >
                        {link.label}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </nav>
          </>
        )}
      </div>
    </header>
  );
}
