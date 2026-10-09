"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search, Bookmark, Columns2 } from "lucide-react";
import { BrandLogo } from "@/components/brand/BrandLogo";
import { ThemeToggle } from "@/components/common/ThemeToggle";
const links = [
  { href: "/", label: "Kentekencheck", icon: Search },
  { href: "/aanbod", label: "Autoaanbod", icon: Search },
  { href: "/vergelijken", label: "Vergelijken", icon: Columns2 },
  { href: "/opgeslagen", label: "Opgeslagen", icon: Bookmark },
];
export function Header() {
  const path = usePathname();
  return (
    <header className="site-header">
      <div className="container header-inner">
        <BrandLogo />
        <nav className="desktop-nav" aria-label="Hoofdnavigatie">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={
                path === link.href ||
                (link.href === "/" && path.startsWith("/auto/"))
                  ? "active"
                  : ""
              }
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="header-actions">
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
export function MobileNavigation() {
  const path = usePathname();
  return (
    <nav className="mobile-nav" aria-label="Mobiele navigatie">
      {links.map(({ href, label, icon: Icon }) => (
        <Link
          key={href}
          href={href}
          className={
            path === href || (href === "/" && path.startsWith("/auto/"))
              ? "active"
              : ""
          }
        >
          <Icon size={19} />
          <span>{label}</span>
        </Link>
      ))}
    </nav>
  );
}
