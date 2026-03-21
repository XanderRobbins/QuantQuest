"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { TrendingUp, BarChart3, ShoppingBag, Brain } from "lucide-react";
import { loadPortfolio } from "@/lib/portfolio";
import { useEffect, useState } from "react";

const links = [
  { href: "/dashboard", label: "Dashboard", icon: BarChart3 },
  { href: "/invest", label: "Invest", icon: ShoppingBag },
  { href: "/analysis", label: "Analysis", icon: Brain },
];

export function Navbar() {
  const pathname = usePathname();
  const [username, setUsername] = useState<string | null>(null);

  useEffect(() => {
    const p = loadPortfolio();
    if (p?.username) setUsername(p.username);
  }, []);

  return (
    <nav className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/dashboard" className="flex items-center gap-2 font-bold text-xl">
          <div className="rounded-lg bg-primary/10 p-1.5">
            <TrendingUp className="h-5 w-5 text-primary" />
          </div>
          <span>
            Quant<span className="text-primary">Quest</span>
          </span>
        </Link>

        <div className="flex items-center gap-1">
          {links.map((link) => {
            const Icon = link.icon;
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-all",
                  active
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                )}
              >
                <Icon className="h-4 w-4" />
                {link.label}
              </Link>
            );
          })}
        </div>

        {username && (
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary text-sm font-bold">
              {username[0].toUpperCase()}
            </div>
            <span className="hidden text-sm font-medium sm:block">{username}</span>
          </div>
        )}
      </div>
    </nav>
  );
}
