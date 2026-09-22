import type { Role } from "@prisma/client";
import {
  LayoutDashboard,
  Users,
  Package,
  ClipboardList,
  Factory,
  Truck,
  FolderOpen,
  ShieldCheck,
  Wallet,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  roles: Role[];
}

export const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, roles: ["ADMIN", "SALES", "PRODUCTION", "DELIVERY", "ENCODER"] },
  { href: "/crm", label: "CRM & Clients", icon: Users, roles: ["ADMIN", "SALES", "ENCODER"] },
  { href: "/products", label: "Products", icon: Package, roles: ["ADMIN", "SALES"] },
  { href: "/orders", label: "Sales & Orders", icon: ClipboardList, roles: ["ADMIN", "SALES"] },
  { href: "/expenses", label: "Expenses", icon: Wallet, roles: ["ADMIN", "SALES"] },
  { href: "/production", label: "Production Tracker", icon: Factory, roles: ["ADMIN", "PRODUCTION"] },
  { href: "/delivery", label: "Delivery Tracker", icon: Truck, roles: ["ADMIN", "DELIVERY", "ENCODER"] },
  { href: "/files", label: "File Organizer", icon: FolderOpen, roles: ["ADMIN", "SALES", "PRODUCTION", "DELIVERY", "ENCODER"] },
  { href: "/admin", label: "Admin", icon: ShieldCheck, roles: ["ADMIN"] },
];

export function navForRole(role: Role): NavItem[] {
  return NAV_ITEMS.filter((item) => item.roles.includes(role));
}
