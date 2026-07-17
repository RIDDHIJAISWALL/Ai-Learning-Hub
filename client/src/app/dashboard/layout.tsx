"use client";

import React, { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import Link from "next/link";
import { 
  BookOpen, 
  LayoutDashboard, 
  FileText, 
  Calendar, 
  LogOut, 
  Moon, 
  Sun, 
  User,
  Menu,
  X,
  Loader2
} from "lucide-react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading, logout, isAuthenticated } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const router = useRouter();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#090d16] text-white">
        <Loader2 className="w-10 h-10 animate-spin text-violet-400 mb-4" />
        <p className="text-slate-400 font-medium">Verifying your learning session...</p>
      </div>
    );
  }

  const navItems = [
    { name: "Dashboard", href: "/dashboard", icon: <LayoutDashboard className="w-5 h-5" /> },
    { name: "My Documents (RAG)", href: "/dashboard/documents", icon: <FileText className="w-5 h-5" /> },
    { name: "Study Plans", href: "/dashboard/plans", icon: <Calendar className="w-5 h-5" /> },
    { name: "Coding Tutor", href: "/dashboard/coding", icon: <BookOpen className="w-5 h-5" /> },
  ];

  return (
    <div className="min-h-screen flex bg-[#f8fafc] dark:bg-[#090d16] text-[#0f172a] dark:text-[#f1f5f9] transition-colors duration-300">
      
      {/* SIDEBAR FOR DESKTOP */}
      <aside className="hidden md:flex flex-col w-64 glass-panel border-r border-slate-200/80 dark:border-slate-800/80 z-20">
        <div className="p-6 flex items-center gap-2 border-b border-slate-200/80 dark:border-slate-800/80">
          <BookOpen className="w-6 h-6 text-violet-500" />
          <span className="font-bold text-lg bg-gradient-to-r from-violet-500 to-indigo-500 bg-clip-text text-transparent">
            AI Learning Hub
          </span>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                  isActive
                    ? "bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-md shadow-violet-600/10"
                    : "text-slate-500 dark:text-slate-400 hover:bg-slate-200/50 dark:hover:bg-slate-800/50 hover:text-[#0f172a] dark:hover:text-white"
                }`}
              >
                {item.icon}
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* User profile section */}
        <div className="p-4 border-t border-slate-200/80 dark:border-slate-800/80 space-y-3">
          <div className="flex items-center gap-3 px-2 py-1">
            <div className="w-10 h-10 rounded-full bg-violet-600/20 text-violet-400 flex items-center justify-center font-bold">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="truncate">
              <p className="text-sm font-bold truncate">{user.name}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{user.email}</p>
            </div>
          </div>
          
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-semibold text-rose-500 hover:bg-rose-500/10 rounded-xl transition-all"
          >
            <LogOut className="w-5 h-5" />
            Log Out
          </button>
        </div>
      </aside>

      {/* MOBILE HEADER */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="flex md:hidden items-center justify-between px-6 py-4 glass-panel border-b border-slate-200/80 dark:border-slate-800/80 z-20">
          <div className="flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-violet-500" />
            <span className="font-bold text-lg bg-gradient-to-r from-violet-500 to-indigo-500 bg-clip-text text-transparent">
              AI Hub
            </span>
          </div>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 hover:bg-slate-200/50 dark:hover:bg-slate-800/50 rounded-lg text-slate-500 dark:text-slate-400"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </header>

        {/* MOBILE SIDEBAR NAV OVERLAY */}
        {mobileMenuOpen && (
          <div className="md:hidden fixed inset-0 bg-black/50 z-30 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)}>
            <aside 
              className="w-64 h-full bg-[#f8fafc] dark:bg-[#090d16] border-r border-slate-200 dark:border-slate-800 flex flex-col p-6 space-y-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-6 h-6 text-violet-500" />
                  <span className="font-bold text-lg bg-gradient-to-r from-violet-500 to-indigo-500 bg-clip-text text-transparent">
                    AI Learning Hub
                  </span>
                </div>
                <button onClick={() => setMobileMenuOpen(false)}>
                  <X className="w-5 h-5 text-slate-500" />
                </button>
              </div>

              <nav className="flex-1 space-y-2">
                {navItems.map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                        isActive
                          ? "bg-gradient-to-r from-violet-600 to-indigo-600 text-white"
                          : "text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800"
                      }`}
                    >
                      {item.icon}
                      {item.name}
                    </Link>
                  );
                })}
              </nav>

              <div className="border-t border-slate-200 dark:border-slate-800 pt-6 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-violet-600/20 text-violet-400 flex items-center justify-center font-bold">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-bold truncate">{user.name}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{user.email}</p>
                  </div>
                </div>
                
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    logout();
                  }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-semibold text-rose-500 hover:bg-rose-500/10 rounded-xl transition-all"
                >
                  <LogOut className="w-5 h-5" />
                  Log Out
                </button>
              </div>
            </aside>
          </div>
        )}

        {/* MAIN DISPLAY PANEL */}
        <main className="flex-1 flex flex-col overflow-y-auto overflow-x-hidden relative">
          
          {/* Header Bar */}
          <div className="hidden md:flex items-center justify-between px-8 py-4 border-b border-slate-200/50 dark:border-slate-800/50 glass-panel">
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold tracking-wider uppercase">Welcome back</p>
              <h2 className="text-lg font-bold">Hey, {user.name} 👋</h2>
            </div>
            
            <div className="flex items-center gap-4">
              {/* Theme Toggle Button */}
              <button
                onClick={toggleTheme}
                className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-200/50 dark:hover:bg-slate-800/50 text-slate-500 dark:text-slate-400 transition-all cursor-pointer"
              >
                {theme === "dark" ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-indigo-500" />}
              </button>
            </div>
          </div>

          {/* Child Page Area */}
          <div className="flex-1 p-6 md:p-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
