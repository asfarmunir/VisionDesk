"use client";

import { ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "../../hooks/useAuth";
import { cn } from "../../lib/utils";
import { Icons } from "../../components/ui/icons";
import { Button } from "../../components/ui/button";

interface DashboardLayoutProps {
  children: ReactNode;
}

const navItems = [
  {
    label: "Overview",
    href: "/dashboard",
    icon: Icons.home,
    roles: ["admin", "moderator", "user"],
  },
  {
    label: "Projects",
    href: "/dashboard/projects",
    icon: Icons.projects,
    roles: ["admin", "moderator", "user"],
  },
  {
    label: "Tasks",
    href: "/dashboard/tasks",
    icon: Icons.tasks,
    roles: ["admin", "moderator", "user"],
  },
  {
    label: "Tickets",
    href: "/dashboard/tickets",
    icon: Icons.tickets,
    roles: ["admin", "moderator", "user"],
  },
  {
    label: "Users",
    href: "/dashboard/users",
    icon: Icons.users,
    roles: ["admin"],
  },
  {
    label: "Analytics",
    href: "/dashboard/analytics",
    icon: Icons.analytics,
    roles: ["admin", "moderator"],
  },
];

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const { user, isAuthenticated, logout, isLoading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  if (!isLoading && !isAuthenticated) {
    if (typeof window !== "undefined") {
      router.replace("/");
    }
    return null;
  }

  const filtered = navItems.filter(
    (item) => !user || item.roles.includes(user.role)
  );

  return (
    <div className="flex h-screen w-full overflow-hidden">
      {/* Sidebar */}
      <aside className="hidden md:flex flex-col w-60 shrink-0 border-r bg-muted/30 backdrop-blur supports-[backdrop-filter]:bg-muted/20">
        <div className="h-16 flex items-center gap-2 px-4 border-b">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
            <Icons.logo className="w-5 h-5 text-white" />
          </div>
          <span className="font-semibold text-lg tracking-tight">
            VisionDesk
          </span>
        </div>
        <nav className="flex-1 overflow-y-auto py-4 space-y-1">
          {filtered.map((item) => {
            const active = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "group flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-colors",
                  active
                    ? "bg-primary text-primary-foreground shadow"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
              >
                <Icon className="w-4 h-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t space-y-2">
          {user && (
            <div className="px-1 text-xs text-muted-foreground">
              Signed in as
              <div className="text-foreground font-medium truncate">
                {user.name}
              </div>
              <div className="text-[10px] uppercase tracking-wide">
                {user.role}
              </div>
            </div>
          )}
          <Button
            size="sm"
            variant="outline"
            className="w-full"
            onClick={logout}
          >
            Sign out
          </Button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex flex-col flex-1 min-w-0">
        {/* Top bar */}
        <header className="h-16 border-b flex items-center gap-4 px-4 bg-background/60 backdrop-blur supports-[backdrop-filter]:bg-background/40">
          <div className="md:hidden flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push("/dashboard")}
            >
              <Icons.home className="w-4 h-4 mr-2" />
              Dashboard
            </Button>
          </div>
          <div className="ml-auto flex items-center gap-2">
            {user && (
              <span className="hidden sm:inline text-sm text-muted-foreground">
                {user.name}
              </span>
            )}
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-4 lg:p-6 bg-gradient-to-b from-background to-muted/40">
          <div className="max-w-7xl mx-auto h-full flex flex-col">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
