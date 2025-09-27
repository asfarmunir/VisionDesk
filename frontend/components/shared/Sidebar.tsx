"use client";
import { useAuth } from "@/hooks/useAuth";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo } from "react";
import { IoLogOutOutline } from "react-icons/io5";
const navBaseClasses =
  "flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors";
const inactiveClasses = "text-slate-300 hover:bg-blue-800/40 hover:text-white";
const activeClasses = "bg-primary text-white shadow";

const Sidebar = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const pathname = usePathname();

  const links = useMemo(() => {
    if (!user) return [] as { href: string; label: string }[];
    if (user.role === "admin") {
      return [
        { href: "/dashboard", label: "Dashboard" },
        { href: "/projects", label: "Projects" },
      ];
    }
    if (user.role === "moderator") {
      return [{ href: "/projects", label: "Projects" }];
    }
    // normal user
    return [{ href: "/user/projects", label: "Projects" }];
  }, [user]);

  const renderLinks = () => (
    <nav className="mt-4 space-y-1">
      {links.map((link) => {
        const active = pathname === link.href;
        return (
          <Link
            key={link.href}
            href={link.href}
            className={`${navBaseClasses} ${
              active ? activeClasses : inactiveClasses
            }`}
          >
            <span>{link.label}</span>
          </Link>
        );
      })}
    </nav>
  );

  return (
    <div className="bg-slate-200 flex h-screen antialiased selection:bg-blue-600 selection:text-white">
      {/* Desktop Sidebar */}
      <div className="hidden md:flex flex-col bg-gradient-to-l from-blue-900 to-blue-950 h-full text-slate-300 w-72 2xl:w-80 shrink-0 overflow-y-auto pb-6">
        <div id="logo" className="mt-6 px-6">
          <h1 className="text-2xl font-bold border-b border-slate-600 pb-3 text-white mb-2">
            VisionDesk
          </h1>
          <p className="text-slate-400 text-xs">Manage your work efficiently</p>
        </div>
        <div
          id="profile"
          className="px-5 py-5 bg-indigo-950/60 mt-4 mb-4 mx-4 rounded-lg border border-indigo-800/40"
        >
          {isAuthenticated && user ? (
            <>
              <p className="text-white text-xs uppercase tracking-wide">
                Welcome
              </p>
              <div className="flex items-center gap-3 mt-3">
                <div className="min-w-0">
                  <p className="font-semibold text-white truncate">
                    {user.name}
                  </p>
                  <p className="text-[11px] text-indigo-200/80 capitalize">
                    {user.role}
                  </p>
                </div>
              </div>
            </>
          ) : (
            <div className="text-sm text-slate-400">Not authenticated</div>
          )}
        </div>
        {/* Nav + Logout container fills remaining space */}
        <div className="px-6 flex-1 flex flex-col">
          {renderLinks()}
          <div className="mt-auto pt-6">
            <button
              onClick={logout}
              className="w-full bg-primary hover:bg-indigo-600 text-white text-sm font-medium py-2 rounded-md transition-colors flex items-center justify-center"
            >
              Logout <IoLogOutOutline className="ml-2" size={20} />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Sidebar */}
      <div className="flex md:hidden w-full">
        <input
          type="checkbox"
          id="drawer-toggle"
          className="relative sr-only peer"
        />
        <label
          htmlFor="drawer-toggle"
          className="fixed top-4 left-3 z-40 inline-flex flex-col items-center justify-center p-3 rounded-md bg-blue-800 text-white peer-checked:left-64 peer-checked:rotate-180 transition-all"
        >
          <span className="w-2.5 h-0.5 mb-1 rotate-45 bg-white rounded" />
          <span className="w-2.5 h-0.5 -rotate-45 bg-white rounded" />
        </label>
        <div className="fixed z-30 top-0 left-0 h-full w-64 -translate-x-full peer-checked:translate-x-0 transition-transform duration-300 bg-gradient-to-l from-blue-900 to-blue-950 text-slate-300 overflow-hidden pb-4 flex flex-col">
          <div className="mt-6 px-6">
            <h1 className="text-xl font-bold border-b border-slate-600 pb-2 text-white mb-2">
              VisionDesk
            </h1>
            <p className="text-slate-400 text-xs">
              Manage your work efficiently
            </p>
          </div>
          <div className="px-5 py-5 bg-indigo-950/60 mt-4 mx-4 rounded-lg border border-indigo-800/40">
            {isAuthenticated && user ? (
              <>
                <p className="text-white text-xs uppercase tracking-wide">
                  Welcome
                </p>
                <div className="flex items-center gap-3 mt-3">
                  <div className="min-w-0">
                    <p className="font-semibold text-white truncate">
                      {user.name}
                    </p>
                    <p className="text-[11px] text-indigo-200/80 capitalize">
                      {user.role}
                    </p>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-sm text-slate-400">Not authenticated</div>
            )}
          </div>
          {/* Scrollable nav area */}
          <div className="flex-1 overflow-y-auto px-6 mt-2">
            {renderLinks()}
          </div>
          <div className="px-6 pt-4">
            <button
              onClick={logout}
              className="w-full bg-primary hover:bg-indigo-600 text-white text-sm font-medium py-2 rounded-md transition-colors flex items-center justify-center"
            >
              Logout <IoLogOutOutline className="ml-2" size={20} />
            </button>
          </div>
        </div>
      </div>

      {/* Placeholder for main content when embedding sidebar */}
      <div className="flex-1 hidden md:block" />
    </div>
  );
};

export default Sidebar;
