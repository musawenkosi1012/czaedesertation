"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, Users, CreditCard, BarChart3, LogOut, ShieldCheck, User, ChevronRight } from "lucide-react";
import { clsx } from "clsx";
import { useEffect, useState } from "react";

const ADMIN_MENU = [
  { name: "Dashboard", icon: LayoutDashboard, href: "/dashboard" },
  { name: "Borrowers", icon: Users, href: "/borrowers" },
  { name: "Loans", icon: CreditCard, href: "/loans" },
  { name: "Analytics", icon: BarChart3, href: "/analytics" },
  { name: "Reports", icon: ShieldCheck, href: "/reports" },
];

const BORROWER_MENU = [
  { name: "My Portal", icon: User, href: "/portal" },
  { name: "Apply for Loan", icon: CreditCard, href: "/portal" },
];

function decodeJwtSub(token: string): string {
  try {
    return JSON.parse(atob(token.split(".")[1])).sub || "User";
  } catch {
    return "User";
  }
}

export default function DashboardLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const pathname = usePathname();
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<string | null>(null);
  const [username, setUsername] = useState<string>("User");

  useEffect(() => {
    if (pathname === "/login" || pathname === "/" || pathname === "/signup") {
      setLoading(false);
      return;
    }

    const token = localStorage.getItem("token");
    const storedRole = localStorage.getItem("role");
    if (token) {
      setIsAuthenticated(true);
      setRole(storedRole);
      setUsername(decodeJwtSub(token));

      if (
        storedRole === "borrower" &&
        ["/dashboard", "/borrowers", "/loans", "/analytics", "/reports"].some(r => pathname.startsWith(r))
      ) {
        router.push("/portal");
        return;
      }
    } else {
      router.push("/login");
    }
    setLoading(false);
  }, [pathname, router]);

  if (pathname === "/login" || pathname === "/" || pathname === "/signup") return <>{children}</>;
  if (loading) return <div className="min-h-screen bg-[#050505] flex items-center justify-center text-gray-500 text-sm">Loading...</div>;
  if (!isAuthenticated) return null;

  const menuItems = role === "admin" ? ADMIN_MENU : BORROWER_MENU;
  const currentPage = menuItems.find(item => pathname.startsWith(item.href))?.name || "Overview";
  const initials = username.slice(0, 2).toUpperCase();

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("borrower_id");
    router.push("/login");
  };

  return (
    <div className="flex min-h-screen bg-[#050505] text-white">
      {/* Sidebar */}
      <aside className="w-64 border-r border-white/[0.06] flex flex-col fixed h-full bg-[#070707]">

        {/* Brand */}
        <div className="px-5 py-5 border-b border-white/[0.06]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-zim-green flex items-center justify-center flex-shrink-0">
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-sm font-bold tracking-tight leading-none">CZAE</p>
              <p className="text-[10px] text-gray-500 mt-0.5 leading-none">Credit Scoring System</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          <p className="text-[9px] font-bold text-gray-600 uppercase tracking-[0.15em] px-3 mb-2">Navigation</p>
          {menuItems.map((item) => {
            const isActive = pathname.startsWith(item.href);
            return (
              <Link
                key={`${item.href}-${item.name}`}
                href={item.href}
                className={clsx(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all group relative",
                  isActive
                    ? "bg-white/[0.06] text-white"
                    : "text-gray-500 hover:bg-white/[0.03] hover:text-gray-300"
                )}
              >
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-zim-green rounded-r-full" />
                )}
                <item.icon
                  className={clsx(
                    "w-4 h-4 flex-shrink-0 transition-colors",
                    isActive ? "text-zim-green" : "text-gray-600 group-hover:text-gray-400"
                  )}
                />
                <span className="text-sm font-medium">{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* User section */}
        <div className="border-t border-white/[0.06] p-3">
          <div className="flex items-center gap-3 px-2 py-2 rounded-lg mb-1">
            <div className="w-7 h-7 rounded-full bg-zim-green/20 border border-zim-green/30 flex items-center justify-center flex-shrink-0">
              <span className="text-[10px] font-bold text-zim-green">{initials}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-white truncate">{username}</p>
              <p className="text-[10px] text-gray-500 capitalize">{role || "user"}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-gray-500 hover:bg-red-500/10 hover:text-red-400 transition-all text-sm"
          >
            <LogOut className="w-4 h-4" />
            <span className="font-medium">Sign out</span>
          </button>
        </div>
      </aside>

      {/* Main area */}
      <div className="flex-1 ml-64 flex flex-col min-h-screen">
        {/* Topbar */}
        <header className="h-12 border-b border-white/[0.06] flex items-center justify-between px-8 bg-[#070707]/80 backdrop-blur-sm sticky top-0 z-10">
          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            <span className="text-gray-600">Czae</span>
            <ChevronRight className="w-3 h-3 text-gray-700" />
            <span className="text-gray-300 font-medium">{currentPage}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-zim-green animate-pulse" />
            <span className="text-[10px] text-gray-500 font-medium">Ensemble v2.0 active</span>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-8 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-zim-green/[0.03] via-transparent to-transparent">
          {children}
        </main>
      </div>
    </div>
  );
}
