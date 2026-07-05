import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  Bell,
  FileText,
  FolderTree,
  Handshake,
  LayoutDashboard,
  Link2,
  Mail,
  MessageSquare,
  ScrollText,
  Server,
  Settings,
  Users,
  Wallet,
  Wrench,
} from "lucide-react";

export type NavBadgeKey = "crm" | "messages" | null;

export interface AdminNavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  badgeKey?: NavBadgeKey;
  adminOnly?: boolean;
}

export interface AdminNavGroup {
  label: string;
  items: AdminNavItem[];
}

export const ADMIN_NAV_GROUPS: AdminNavGroup[] = [
  {
    label: "Overview",
    items: [{ href: "/admin", label: "Dashboard", icon: LayoutDashboard }],
  },
  {
    label: "Insights",
    items: [{ href: "/admin/analytics", label: "Analytics", icon: BarChart3 }],
  },
  {
    label: "Catalog",
    items: [
      { href: "/admin/tools", label: "Tools", icon: Wrench },
      { href: "/admin/categories", label: "Categories", icon: FolderTree },
      { href: "/admin/blog", label: "Blog", icon: FileText },
      { href: "/admin/agent", label: "Assistant", icon: MessageSquare },
    ],
  },
  {
    label: "Revenue",
    items: [
      { href: "/admin/affiliate-directory", label: "Affiliate directory", icon: Link2 },
      { href: "/admin/affiliates", label: "Affiliate CRM", icon: Handshake, badgeKey: "crm" },
      { href: "/admin/finances", label: "Finances", icon: Wallet },
    ],
  },
  {
    label: "Audience",
    items: [
      { href: "/admin/messages", label: "Messages", icon: MessageSquare, badgeKey: "messages" },
      { href: "/admin/notifications", label: "Notifications", icon: Bell },
      { href: "/admin/subscribers", label: "Mailing list", icon: Mail },
    ],
  },
  {
    label: "Team & system",
    items: [
      { href: "/admin/team", label: "Team", icon: Users },
      { href: "/admin/settings", label: "Settings", icon: Settings },
      { href: "/admin/hosting", label: "Hosting", icon: Server, adminOnly: true },
      { href: "/admin/audit", label: "Audit log", icon: ScrollText, adminOnly: true },
    ],
  },
];

export interface AdminPageMeta {
  section: string;
  title: string;
}

const PAGE_META: { match: (path: string) => boolean; meta: AdminPageMeta }[] = [
  { match: (p) => p === "/admin", meta: { section: "Overview", title: "Dashboard" } },
  { match: (p) => p.startsWith("/admin/analytics"), meta: { section: "Insights", title: "Analytics" } },
  { match: (p) => p === "/admin/tools/new", meta: { section: "Catalog", title: "New tool" } },
  { match: (p) => p.startsWith("/admin/tools/"), meta: { section: "Catalog", title: "Edit tool" } },
  { match: (p) => p.startsWith("/admin/tools"), meta: { section: "Catalog", title: "Tools" } },
  { match: (p) => p.startsWith("/admin/categories"), meta: { section: "Catalog", title: "Categories" } },
  { match: (p) => p.startsWith("/admin/blog/"), meta: { section: "Catalog", title: "Edit post" } },
  { match: (p) => p.startsWith("/admin/blog"), meta: { section: "Catalog", title: "Blog" } },
  { match: (p) => p.startsWith("/admin/affiliates/"), meta: { section: "Revenue", title: "Affiliate program" } },
  { match: (p) => p.startsWith("/admin/affiliate-directory"), meta: { section: "Revenue", title: "Affiliate directory" } },
  { match: (p) => p.startsWith("/admin/affiliates"), meta: { section: "Revenue", title: "Affiliate CRM" } },
  { match: (p) => p.startsWith("/admin/finances"), meta: { section: "Revenue", title: "Finances" } },
  { match: (p) => p.startsWith("/admin/messages"), meta: { section: "Audience", title: "Messages" } },
  { match: (p) => p.startsWith("/admin/notifications"), meta: { section: "Audience", title: "Notifications" } },
  { match: (p) => p.startsWith("/admin/subscribers"), meta: { section: "Audience", title: "Mailing list" } },
  { match: (p) => p.startsWith("/admin/team"), meta: { section: "Team & system", title: "Team" } },
  { match: (p) => p.startsWith("/admin/settings"), meta: { section: "Team & system", title: "Settings" } },
  { match: (p) => p.startsWith("/admin/hosting"), meta: { section: "Team & system", title: "Hosting" } },
  { match: (p) => p.startsWith("/admin/audit"), meta: { section: "Team & system", title: "Audit log" } },
  { match: (p) => p.startsWith("/admin/agent"), meta: { section: "Tools", title: "Assistant" } },
];

export function getAdminPageMeta(pathname: string): AdminPageMeta {
  const hit = PAGE_META.find((entry) => entry.match(pathname));
  return hit?.meta ?? { section: "Admin", title: "TOOLQZ" };
}

export function isAdminNavActive(pathname: string, href: string): boolean {
  if (href === "/admin") return pathname === "/admin";
  if (href === "/admin/affiliate-directory") return pathname.startsWith("/admin/affiliate-directory");
  if (href === "/admin/affiliates") return pathname.startsWith("/admin/affiliates");
  if (href === "/admin/tools") return pathname.startsWith("/admin/tools");
  if (href === "/admin/blog") return pathname.startsWith("/admin/blog");
  if (href === "/admin/messages") return pathname.startsWith("/admin/messages");
  if (href === "/admin/finances") return pathname.startsWith("/admin/finances");
  return pathname.startsWith(href);
}
