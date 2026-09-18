"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Menu, Search, Bell, LogOut, ChevronDown } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { ROLE_LABELS } from "@/lib/roles";
import type { Role } from "@prisma/client";

export function Topbar({
  name,
  role,
  avatarColor,
  alertCount,
  onMenuClick,
}: {
  name: string;
  role: Role;
  avatarColor: string;
  alertCount: number;
  onMenuClick: () => void;
}) {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [bellOpen, setBellOpen] = useState(false);
  const [query, setQuery] = useState("");
  const menuRef = useRef<HTMLDivElement>(null);
  const bellRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
      if (bellRef.current && !bellRef.current.contains(e.target as Node)) setBellOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (query.trim()) router.push(`/crm?q=${encodeURIComponent(query.trim())}`);
  }

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-surface/90 px-4 backdrop-blur sm:px-6">
      <button onClick={onMenuClick} className="text-muted hover:text-foreground lg:hidden">
        <Menu className="h-5 w-5" />
      </button>

      <form onSubmit={handleSearch} className="hidden flex-1 max-w-md sm:block">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-light" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search clients, orders..."
            className="w-full rounded-lg border border-border bg-canvas py-2 pl-9 pr-3 text-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
          />
        </div>
      </form>

      <div className="ml-auto flex items-center gap-2">
        <div className="relative" ref={bellRef}>
          <button
            onClick={() => setBellOpen((v) => !v)}
            className="relative flex h-9 w-9 items-center justify-center rounded-lg text-muted hover:bg-slate-100 hover:text-foreground"
          >
            <Bell className="h-[18px] w-[18px]" />
            {alertCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[10px] font-bold text-white">
                {alertCount > 9 ? "9+" : alertCount}
              </span>
            )}
          </button>
          {bellOpen && (
            <div className="absolute right-0 mt-2 w-72 animate-fade-in rounded-xl border border-border bg-surface p-3 shadow-lg">
              <p className="px-1 pb-2 text-sm font-semibold">Attention needed</p>
              {alertCount > 0 ? (
                <p className="rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger">
                  {alertCount} job{alertCount === 1 ? "" : "s"} overdue or due today. Check your dashboard.
                </p>
              ) : (
                <p className="px-1 text-sm text-muted">No urgent deadlines right now. Nice work!</p>
              )}
            </div>
          )}
        </div>

        <div className="relative" ref={menuRef}>
          <button onClick={() => setMenuOpen((v) => !v)} className="flex items-center gap-2 rounded-lg py-1 pl-1 pr-2 hover:bg-slate-100">
            <Avatar name={name} color={avatarColor} size="sm" />
            <div className="hidden text-left sm:block">
              <p className="text-sm font-medium leading-tight">{name}</p>
              <p className="text-[11px] leading-tight text-muted">{ROLE_LABELS[role]}</p>
            </div>
            <ChevronDown className="hidden h-4 w-4 text-muted-light sm:block" />
          </button>
          {menuOpen && (
            <div className="absolute right-0 mt-2 w-48 animate-fade-in rounded-xl border border-border bg-surface p-1.5 shadow-lg">
              <button
                onClick={handleLogout}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-foreground hover:bg-danger-soft hover:text-danger"
              >
                <LogOut className="h-4 w-4" /> Log out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
