"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { HOME_NAV_LINKS, MORE_NAV_LINKS } from "@/lib/branding";

interface NavbarProps {
  isLive?: boolean;
  roundLabel?: string;
}

export default function Navbar({ isLive = false, roundLabel }: NavbarProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const allLinks = [...HOME_NAV_LINKS, ...MORE_NAV_LINKS];

  return (
    <header className="sticky top-0 z-50 bg-[#070E1A]">
      <div className="mx-auto flex min-h-16 max-w-[1320px] items-center justify-between gap-4 px-5 sm:min-h-[4.5rem] sm:px-8">
        <Link href="/" className="shrink-0 py-1">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/assets/logo-bs-proyect.png"
            alt="BS Proyect"
            className="h-11 w-auto max-w-[9.5rem] object-contain object-left sm:h-12"
            decoding="async"
            fetchPriority="high"
          />
        </Link>

        <button
          type="button"
          className="flex h-12 w-12 flex-col items-center justify-center gap-1.5 lg:hidden"
          onClick={() => setOpen(!open)}
          aria-label="Menú"
        >
          <span className={`h-0.5 w-5 bg-white transition ${open ? "translate-y-2 rotate-45" : ""}`} />
          <span className={`h-0.5 w-5 bg-white transition ${open ? "opacity-0" : ""}`} />
          <span className={`h-0.5 w-5 bg-white transition ${open ? "-translate-y-2 -rotate-45" : ""}`} />
        </button>

        <nav className="hidden items-center gap-1 lg:flex">
          {HOME_NAV_LINKS.map((link) => {
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`px-2.5 py-2 text-[11px] font-bold uppercase tracking-[0.14em] ${
                  active
                    ? "border-b-2 border-[#E30613] text-[#E30613]"
                    : "text-white hover:text-[#E30613]"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
          <div className="relative">
            <button
              type="button"
              className={`px-2.5 py-2 text-[11px] font-bold uppercase tracking-[0.14em] ${
                moreOpen ? "text-[#E30613]" : "text-white hover:text-[#E30613]"
              }`}
              onClick={() => setMoreOpen((value) => !value)}
              aria-expanded={moreOpen}
            >
              Más
            </button>
            {moreOpen ? (
              <div className="absolute right-0 top-full z-50 min-w-44 border border-white/10 bg-[#070E1A] py-2 shadow-xl">
                {MORE_NAV_LINKS.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMoreOpen(false)}
                    className={`block px-4 py-2 text-[11px] font-bold uppercase tracking-wider ${
                      pathname === link.href
                        ? "text-[#E30613]"
                        : "text-white hover:bg-white/5"
                    }`}
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            ) : null}
          </div>
          {isLive ? (
            <span className="ml-2 text-[10px] font-bold uppercase tracking-widest text-[#E30613]">
              {roundLabel ? `En vivo · ${roundLabel}` : "En vivo"}
            </span>
          ) : null}
        </nav>
      </div>

      {open ? (
        <nav className="border-t border-white/10 bg-[#070E1A] px-5 py-3 lg:hidden">
          <div className="grid grid-cols-2 gap-1">
            {allLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className={`px-3 py-2.5 text-[11px] font-bold uppercase tracking-wider ${
                  pathname === link.href ? "text-[#E30613]" : "text-white"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </nav>
      ) : null}
    </header>
  );
}
