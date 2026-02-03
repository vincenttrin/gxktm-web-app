"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, LayoutDashboard, Settings, Menu, LogOut } from "lucide-react";
import { signout } from "@/app/(auth)/login/actions";
import { useAuth } from "@/lib/auth-context";

export default function Sidebar() {
  const pathname = usePathname();
  const { isAdmin, isLoading } = useAuth();

  // Base links available to all authenticated users
  const baseLinks = [
    { name: "Home", href: "/", icon: Home },
  ];

  // Admin-only links
  const adminLinks = [
    { name: "Admin Dashboard", href: "/dashboard", icon: LayoutDashboard },
  ];

  // Settings available to all
  const settingsLinks = [
    { name: "Settings", href: "/settings", icon: Settings },
  ];

  // Combine links based on user role
  const links = [
    ...baseLinks,
    ...(isAdmin ? adminLinks : []),
    ...settingsLinks,
  ];

  return (
    <div className="fixed left-0 top-0 h-screen w-16 hover:w-64 bg-sky-300 text-black transition-all duration-300 z-50 overflow-hidden border-r border-sky-300 shadow-lg group">
      <div className="w-64 flex flex-col h-full">
        <div className="h-16 flex items-center px-4">
          <Menu className="w-8 h-8 min-w-[32px]" />
          <h1 className="text-xl font-bold ml-4 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            GXKTM
          </h1>
        </div>
        
        <nav className="flex flex-col gap-2 p-2">
          {isLoading ? (
            // Show skeleton while loading
            <div className="flex items-center p-3 rounded animate-pulse">
              <div className="w-6 h-6 bg-sky-400 rounded" />
              <div className="ml-4 h-4 w-24 bg-sky-400 rounded opacity-0 group-hover:opacity-100" />
            </div>
          ) : (
            links.map((link) => {
              const Icon = link.icon;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center p-3 rounded hover:bg-sky-400 transition-colors whitespace-nowrap ${
                    pathname === link.href ? "bg-sky-600 font-semibold text-white" : ""
                  }`}
                >
                  <Icon className="w-6 h-6 min-w-[24px]" />
                  <span className="ml-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    {link.name}
                  </span>
                </Link>
              );
            })
          )}
        </nav>

        <div className="mt-auto p-2">
          <button
            onClick={() => signout()}
            className="flex w-full items-center p-3 rounded hover:bg-sky-400 transition-colors whitespace-nowrap text-left"
          >
            <LogOut className="w-6 h-6 min-w-[24px]" />
            <span className="ml-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              Sign Out
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
