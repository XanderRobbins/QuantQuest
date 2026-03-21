"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { TrendingUp, BarChart3, ShoppingBag, Brain, LogOut, Sun, Moon, ChevronDown } from "lucide-react";
import { loadPortfolio, clearSession } from "@/lib/portfolio";
import { useEffect, useRef, useState } from "react";

const links = [
  { href: "/dashboard", label: "Dashboard", icon: BarChart3 },
  { href: "/invest", label: "Invest", icon: ShoppingBag },
  { href: "/analysis", label: "Analysis", icon: Brain },
];

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [username, setUsername] = useState<string | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Load theme preference on mount
  useEffect(() => {
    const saved = localStorage.getItem("theme");
    const prefersDark = saved === "dark";
    setIsDark(prefersDark);
    document.documentElement.classList.toggle("dark", prefersDark);
  }, []);

  useEffect(() => {
    const p = loadPortfolio();
    if (p?.username) setUsername(p.username);
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleLogout = () => {
    clearSession();
    router.push("/");
  };

  const toggleTheme = () => {
    const next = !isDark;
    setIsDark(next);
    localStorage.setItem("theme", next ? "dark" : "light");
    document.documentElement.classList.toggle("dark", next);
  };

  return (
    <nav className="sticky top-0 z-40 border-b border-border bg-card/90 backdrop-blur-xl shadow-sm">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link href="/dashboard" className="flex items-center gap-2.5 font-black text-xl tracking-tight">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/15 ring-1 ring-primary/30">
            <TrendingUp className="h-4 w-4 text-primary" />
          </div>
          <span>
            Quant<span className="text-gradient">Quest</span>
          </span>
        </Link>

        {/* Nav links */}
        <div className="flex items-center gap-1">
          {links.map((link) => {
            const Icon = link.icon;
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "relative flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-medium transition-all duration-150",
                  active
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-accent/60 hover:text-foreground"
                )}
              >
                <Icon className="h-4 w-4" />
                {link.label}
                {active && (
                  <span className="absolute bottom-0 left-1/2 h-0.5 w-4 -translate-x-1/2 rounded-full bg-primary" />
                )}
              </Link>
            );
          })}
        </div>

        {/* User section */}
        {username && (
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen((o) => !o)}
              className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-1.5 hover:bg-accent/60 transition-all"
            >
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/20 text-primary text-xs font-bold">
                {username[0].toUpperCase()}
              </div>
              <span className="hidden text-sm font-medium sm:block text-foreground/90">{username}</span>
              <ChevronDown className={cn("h-3.5 w-3.5 text-muted-foreground transition-transform duration-150", dropdownOpen && "rotate-180")} />
            </button>

            {/* Dropdown */}
            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-44 rounded-xl border border-border bg-card shadow-lg shadow-black/10 overflow-hidden z-50">
                <div className="px-3 py-2 border-b border-border">
                  <p className="text-xs text-muted-foreground">Signed in as</p>
                  <p className="text-sm font-semibold truncate">{username}</p>
                </div>
                <div className="p-1">
                  <button
                    onClick={toggleTheme}
                    className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-foreground hover:bg-accent transition-colors"
                  >
                    {isDark
                      ? <Sun className="h-4 w-4 text-yellow-500" />
                      : <Moon className="h-4 w-4 text-primary" />
                    }
                    {isDark ? "Light Mode" : "Dark Mode"}
                  </button>
                  <button
                    onClick={handleLogout}
                    className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-destructive hover:bg-destructive/10 transition-colors"
                  >
                    <LogOut className="h-4 w-4" />
                    Log Out
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}
