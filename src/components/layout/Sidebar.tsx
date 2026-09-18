"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { navForRole } from "@/lib/nav";
import type { Role } from "@prisma/client";
import { X } from "lucide-react";

export function Sidebar({ role, mobileOpen, onClose }: { role: Role; mobileOpen: boolean; onClose: () => void }) {
  const pathname = usePathname();
  const items = navForRole(role);

  return (
    <>
      {mobileOpen && (
        <div className="fixed inset-0 z-40 bg-black/40 lg:hidden" onClick={onClose} />
      )}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-64 shrink-0 flex-col bg-primary text-white transition-transform lg:static lg:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex items-center gap-3 px-5 py-5 border-b border-white/10">
          <Image src="/logo.png" alt="Troysining" width={40} height={40} className="rounded-full shrink-0" />
          <div className="min-w-0">
            <p className="truncate text-sm font-bold leading-tight">Troysining</p>
            <p className="truncate text-[11px] leading-tight text-white/60">Printing Services</p>
          </div>
          <button onClick={onClose} className="ml-auto text-white/70 hover:text-white lg:hidden">
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          {items.map((item) => {
            const active = pathname === item.href || pathname.startsWith(item.href + "/");
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={cn(
                  "group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  active ? "bg-white/10 text-white" : "text-white/70 hover:bg-white/5 hover:text-white"
                )}
              >
                {active && <span className="absolute left-0 top-1/2 h-5 -translate-y-1/2 w-1 rounded-r-full bg-accent" />}
                <Icon className="h-[18px] w-[18px] shrink-0" strokeWidth={1.9} />
                <span className="truncate">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-white/10 px-5 py-4">
          <p className="text-[11px] text-white/40">&copy; {new Date().getFullYear()} Troysining Printing Services</p>
        </div>
      </aside>
    </>
  );
}
