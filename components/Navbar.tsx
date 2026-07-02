"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { NAV_LINKS } from "@/lib/branding";

interface NavbarProps {
  isLive?: boolean;
  roundLabel?: string;
}

export default function Navbar({ isLive = false, roundLabel }: NavbarProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-neutral-800 bg-neutral-950/95 backdrop-blur-sm">
      <div className="iame-gradient-bar" />
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex shrink-0 items-center gap-3">
          <Image
            src="/assets/logo-iame.png"
            alt="IAME Series Argentina"
            width={120}
            height={40}
            className="h-9 w-auto object-contain"
            priority
          />
        </Link>

        <button
          type="button"
          className="flex h-10 w-10 flex-col items-center justify-center gap-1.5 border border-neutral-800 md:hidden"
          onClick={() => setOpen(!open)}
          aria-label="Menú"
        >
          <span className={`h-0.5 w-5 bg-white transition ${open ? "translate-y-2 rotate-45" : ""}`} />
          <span className={`h-0.5 w-5 bg-white transition ${open ? "opacity-0" : ""}`} />
          <span className={`h-0.5 w-5 bg-white transition ${open ? "-translate-y-2 -rotate-45" : ""}`} />
        </button>

        <nav className="hidden items-center gap-0.5 lg:flex">
          {NAV_LINKS.slice(0, 8).map((link) => {
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`px-2.5 py-2 text-[10px] font-semibold uppercase tracking-wider transition ${
                  active ? "text-white" : "text-neutral-400 hover:text-white"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="hidden items-center gap-3 sm:flex">
          {isLive && (
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping bg-iame-red opacity-75" />
                <span className="relative inline-flex h-2 w-2 bg-iame-red" />
              </span>
              <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-iame-red">
                En Vivo
              </span>
            </div>
          )}
          {roundLabel && (
            <div className="border border-iame-navy/50 bg-iame-navy/20 px-3 py-1 font-mono text-[10px] text-neutral-200">
              {roundLabel}
            </div>
          )}
        </div>
      </div>

      {open && (
        <nav className="border-t border-neutral-800 bg-neutral-950 px-4 py-3 md:hidden">
          <div className="grid grid-cols-2 gap-1">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className={`px-3 py-2.5 text-[10px] font-semibold uppercase tracking-wider ${
                  pathname === link.href
                    ? "border-l-2 border-iame-red bg-neutral-900 text-white"
                    : "text-neutral-400"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </nav>
      )}
    </header>
  );
}
