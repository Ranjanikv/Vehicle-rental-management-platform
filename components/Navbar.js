"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { Car, User, LogOut, LayoutDashboard, Calendar, ShieldCheck, Menu, X } from "lucide-react";

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const fetchUser = async () => {
    try {
      const res = await fetch("/api/auth/me");
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setUser(data.user);
        } else {
          setUser(null);
        }
      } else {
        setUser(null);
      }
    } catch (err) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
  }, [pathname]);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      setUser(null);
      router.push("/login");
      router.refresh();
    } catch (err) {
      console.error("Logout failed", err);
    }
  };

  return (
    <nav className="bg-white border-b border-[#E2E8F2] sticky top-0 z-50 shadow-[0_2px_10px_rgba(11,23,51,0.04)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Brand Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="bg-[#0B1733] p-2 rounded-xl text-white shadow-xs">
                <Car className="h-5 w-5 text-[#FF851B]" />
              </div>
              <span className="text-xl font-extrabold tracking-tight text-[#0B1733]">
                RENT<span className="text-[#FF851B]">-</span>EASE
              </span>
            </Link>
          </div>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex md:items-center md:gap-5">
            <Link
              href="/"
              className={`text-sm font-semibold transition-colors px-3.5 py-1.5 rounded-lg ${
                pathname === "/"
                  ? "text-[#0B1733] bg-[#F5F7FC] font-bold border-b-2 border-[#FF851B]"
                  : "text-[#71819E] hover:text-[#0B1733] hover:bg-[#F5F7FC]"
              }`}
            >
              Home
            </Link>
            <Link
              href="/vehicles"
              className={`text-sm font-semibold transition-colors px-3.5 py-1.5 rounded-lg ${
                pathname === "/vehicles"
                  ? "text-[#0B1733] bg-[#F5F7FC] font-bold border-b-2 border-[#FF851B]"
                  : "text-[#71819E] hover:text-[#0B1733] hover:bg-[#F5F7FC]"
              }`}
            >
              Vehicles Fleet
            </Link>

            {user ? (
              <>
                {user.role === "ADMIN" ? (
                  <Link
                    href="/admin"
                    className="flex items-center gap-1.5 text-sm font-semibold text-[#0B1733] bg-[#F5F7FC] px-3.5 py-1.5 rounded-lg border border-[#E2E8F2] hover:bg-[#E2E8F2]/60 transition-colors"
                  >
                    <ShieldCheck className="h-4 w-4 text-[#FF851B]" />
                    Admin Dashboard
                  </Link>
                ) : (
                  <>
                    <Link
                      href="/dashboard"
                      className={`flex items-center gap-1.5 text-sm font-semibold transition-colors px-3.5 py-1.5 rounded-lg ${
                        pathname === "/dashboard"
                          ? "text-[#0B1733] bg-[#F5F7FC] font-bold border-b-2 border-[#FF851B]"
                          : "text-[#71819E] hover:text-[#0B1733] hover:bg-[#F5F7FC]"
                      }`}
                    >
                      <LayoutDashboard className="h-4 w-4 text-[#71819E]" />
                      Dashboard
                    </Link>
                    <Link
                      href="/bookings"
                      className={`flex items-center gap-1.5 text-sm font-semibold transition-colors px-3.5 py-1.5 rounded-lg ${
                        pathname.includes("bookings")
                          ? "text-[#0B1733] bg-[#F5F7FC] font-bold border-b-2 border-[#FF851B]"
                          : "text-[#71819E] hover:text-[#0B1733] hover:bg-[#F5F7FC]"
                      }`}
                    >
                      <Calendar className="h-4 w-4 text-[#71819E]" />
                      My Bookings
                    </Link>
                  </>
                )}

                <div className="flex items-center gap-3 pl-4 border-l border-[#E2E8F2]">
                  <span className="text-xs font-semibold text-[#0B1733] bg-[#F5F7FC] px-3 py-1 rounded-full border border-[#E2E8F2]">
                    {user.name} ({user.role})
                  </span>
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-1 text-xs font-bold text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-2.5 py-1.5 rounded-lg transition-colors border border-transparent hover:border-rose-200"
                  >
                    <LogOut className="h-3.5 w-3.5" />
                    Logout
                  </button>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-3 pl-4 border-l border-[#E2E8F2]">
                <Link
                  href="/login"
                  className="text-sm font-bold text-[#0B1733] hover:text-[#FF851B] transition-colors px-3.5 py-1.5 rounded-lg hover:bg-[#F5F7FC]"
                >
                  Login
                </Link>
                <Link
                  href="/signup"
                  className="text-sm font-bold text-white bg-[#0B1733] hover:bg-[#16264C] px-4 py-2 rounded-lg transition-colors shadow-xs"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu toggle */}
          <div className="flex items-center md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-[#71819E] hover:text-[#0B1733] hover:bg-[#F5F7FC] focus:outline-none"
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-[#E2E8F2] px-4 pt-2 pb-4 space-y-2 bg-white">
          <Link
            href="/"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-md text-base font-semibold text-[#0B1733] hover:bg-[#F5F7FC]"
          >
            Home
          </Link>
          <Link
            href="/vehicles"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-md text-base font-semibold text-[#0B1733] hover:bg-[#F5F7FC]"
          >
            Vehicles Fleet
          </Link>

          {user ? (
            <>
              {user.role === "ADMIN" ? (
                <Link
                  href="/admin"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-2 rounded-md text-base font-semibold text-[#0B1733] bg-[#F5F7FC]"
                >
                  Admin Dashboard
                </Link>
              ) : (
                <>
                  <Link
                    href="/dashboard"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block px-3 py-2 rounded-md text-base font-semibold text-[#0B1733] hover:bg-[#F5F7FC]"
                  >
                    Dashboard
                  </Link>
                  <Link
                    href="/bookings"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block px-3 py-2 rounded-md text-base font-semibold text-[#0B1733] hover:bg-[#F5F7FC]"
                  >
                    My Bookings
                  </Link>
                </>
              )}
              <div className="pt-2 border-t border-[#E2E8F2]">
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    handleLogout();
                  }}
                  className="w-full text-left px-3 py-2 rounded-md text-base font-semibold text-rose-600 hover:bg-rose-50"
                >
                  Logout ({user.name})
                </button>
              </div>
            </>
          ) : (
            <div className="pt-2 border-t border-[#E2E8F2] flex flex-col gap-2">
              <Link
                href="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="block text-center px-3 py-2 rounded-md text-base font-bold text-[#0B1733] hover:bg-[#F5F7FC]"
              >
                Login
              </Link>
              <Link
                href="/signup"
                onClick={() => setMobileMenuOpen(false)}
                className="block text-center px-3 py-2 rounded-md text-base font-bold text-white bg-[#0B1733] hover:bg-[#16264C]"
              >
                Sign Up
              </Link>
            </div>
          )}
        </div>
      )}
    </nav>
  );
}
