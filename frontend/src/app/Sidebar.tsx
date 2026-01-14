"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, LayoutDashboard, Settings, Menu } from "lucide-react";

export default function Sidebar() {
  const pathname = usePathname();

  const links = [
    { name: "Home", href: "/", icon: Home },
    { name: "Family Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Settings", href: "/settings", icon: Settings },
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
          {links.map((link) => {
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
          })}
        </nav>
      </div>
    </div>
  );
}