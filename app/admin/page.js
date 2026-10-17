"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Car, Users, Calendar, ShieldCheck, FileCheck, Wrench, ChevronRight, AlertCircle, Clock, CheckCircle2 } from "lucide-react";

export default function AdminDashboardPage() {
  const router = useRouter();

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);

  // Metrics state
  const [vehicles, setVehicles] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [metricsLoading, setMetricsLoading] = useState(true);
  const [metricsError, setMetricsError] = useState("");

  // 1. Verify Admin Authorization
  useEffect(() => {
    async function checkAdminAuth() {
      try {
        const res = await fetch("/api/auth/me");
        if (!res.ok) {
          router.push("/login?error=Admin authorization required");
          return;
        }

        const data = await res.json();
        if (data.success && data.user && data.user.role === "ADMIN") {
          setUser(data.user);
          setAuthorized(true);
        } else {
          router.push("/login?error=Admin access required");
        }
      } catch (err) {
        router.push("/login?error=Admin authentication error");
      } finally {
        setLoading(false);
      }
    }

    checkAdminAuth();
  }, [router]);

  const fetchDashboardMetrics = async () => {
    setMetricsLoading(true);
    setMetricsError("");
    try {
      const [vehRes, custRes, bookRes] = await Promise.all([
        fetch("/api/vehicles"),
        fetch("/api/admin/customers"),
        fetch("/api/bookings")
      ]);

      const [vehData, custData, bookData] = await Promise.all([
        vehRes.json(),
        custRes.json(),
        bookRes.json()
      ]);

      const failures = [];
      if (vehData.success) {
        setVehicles(vehData.vehicles || []);
      } else {
        failures.push("fleet");
      }

      if (custData.success) {
        setCustomers(custData.customers || []);
      } else {
        failures.push("customers");
      }

      if (bookData.success) {
        setBookings(bookData.bookings || []);
      } else {
        failures.push("bookings");
      }

      if (failures.length > 0) {
        setMetricsError(`Failed to load ${failures.join(", ")} records. Please verify database connectivity.`);
      }
    } catch (err) {
      console.error("Dashboard metrics fetch error:", err);
      setMetricsError("Unable to load database metrics. Network or database connection error.");
    } finally {
      setMetricsLoading(false);
    }
  };

  // 2. Fetch Dashboard Overview Data
  useEffect(() => {
    if (!authorized) return;
    fetchDashboardMetrics();
  }, [authorized]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center text-[#71819E] text-sm font-semibold">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#0B1733] border-t-transparent mx-auto mb-3" />
        Verifying admin security credentials...
      </div>
    );
  }

  if (!authorized) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <div className="bg-rose-50 text-rose-800 p-6 rounded-2xl border border-rose-200 mb-6 text-sm font-semibold">
          <AlertCircle className="h-8 w-8 mx-auto mb-2 text-rose-600" />
          <h2 className="text-lg font-bold">Access Denied</h2>
          <p className="text-xs mt-1">You must be logged in as an ADMIN to access this portal.</p>
        </div>
        <Link
          href="/login"
          className="inline-flex items-center gap-2 bg-[#0B1733] text-white px-5 py-2.5 rounded-xl text-xs font-bold hover:bg-[#16264C]"
        >
          Go to Login
        </Link>
      </div>
    );
  }

  // Calculate metrics
  const availableVehicles = vehicles.filter((v) => v.status === "AVAILABLE").length;
  const rentedVehicles = vehicles.filter((v) => v.status === "RENTED").length;
  const maintenanceVehicles = vehicles.filter((v) => v.status === "MAINTENANCE").length;

  const pendingKyc = customers.filter((c) => c.kyc_status === "PENDING").length;
  const verifiedKyc = customers.filter((c) => c.kyc_status === "VERIFIED").length;

  const pendingBookings = bookings.filter((b) => b.status === "PENDING").length;
  const activeBookings = bookings.filter((b) => b.status === "ACTIVE" || b.status === "CONFIRMED").length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 bg-[#F5F7FC] min-h-screen text-[#0B1733]">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 pb-6 border-b border-[#E2E8F2]">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-[#0B1733] bg-white px-3 py-1 rounded-md mb-2 w-fit border border-[#E2E8F2] shadow-xs">
            <ShieldCheck className="h-3.5 w-3.5 text-[#FF851B]" /> System Administrator
          </div>
          <h1 className="text-3xl font-extrabold text-[#0B1733] tracking-tight uppercase">
            Admin Management Portal
          </h1>
          <p className="text-[#71819E] text-sm mt-1">
            Welcome, <span className="font-bold text-[#0B1733]">{user?.name}</span> ({user?.email})
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/admin/vehicles"
            className="flex items-center gap-2 bg-[#0B1733] hover:bg-[#16264C] text-white font-bold py-2.5 px-4 rounded-xl text-xs transition-colors shadow-xs uppercase tracking-wider"
          >
            <Car className="h-4 w-4 text-[#FF851B]" /> Manage Fleet
          </Link>
          <Link
            href="/admin/customers"
            className="flex items-center gap-2 bg-white hover:bg-[#F5F7FC] text-[#0B1733] font-bold py-2.5 px-4 rounded-xl text-xs transition-colors shadow-xs border border-[#E2E8F2] uppercase tracking-wider"
          >
            <Users className="h-4 w-4 text-[#FF851B]" /> Review KYC ({pendingKyc})
          </Link>
        </div>
      </div>

      {/* Metrics Error Banner */}
      {metricsError && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-amber-600 shrink-0" />
            <p className="text-xs font-semibold text-amber-800">{metricsError}</p>
          </div>
          <button
            onClick={fetchDashboardMetrics}
            disabled={metricsLoading}
            className="text-xs font-bold text-amber-900 bg-amber-100 hover:bg-amber-200 px-3 py-1.5 rounded-lg transition-colors shrink-0"
          >
            {metricsLoading ? "Retrying..." : "Retry"}
          </button>
        </div>
      )}

      {/* Overview KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        {/* Total Fleet */}
        <div className="bg-white p-6 rounded-2xl border border-[#E2E8F2] shadow-[0_2px_12px_rgba(11,23,51,0.04)] flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-[#71819E] uppercase tracking-wider block">Total Fleet</span>
            <span className="text-3xl font-black text-[#0B1733] mt-1 block">{vehicles.length}</span>
            <span className="text-xs text-[#71819E] mt-1 block font-semibold">{availableVehicles} Available</span>
          </div>
          <div className="p-3.5 bg-[#FFF3E8] text-[#FF851B] rounded-xl border border-[#FF851B]/20">
            <Car className="h-6 w-6" />
          </div>
        </div>

        {/* KYC Pending */}
        <div className="bg-white p-6 rounded-2xl border border-[#E2E8F2] shadow-[0_2px_12px_rgba(11,23,51,0.04)] flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-[#71819E] uppercase tracking-wider block">KYC Reviews</span>
            <span className="text-3xl font-black text-[#0B1733] mt-1 block">{pendingKyc}</span>
            <span className="text-xs text-[#71819E] mt-1 block font-semibold">{verifiedKyc} Verified</span>
          </div>
          <div className="p-3.5 bg-[#FFF3E8] text-[#FF851B] rounded-xl border border-[#FF851B]/20">
            <FileCheck className="h-6 w-6" />
          </div>
        </div>

        {/* Active Rentals */}
        <div className="bg-white p-6 rounded-2xl border border-[#E2E8F2] shadow-[0_2px_12px_rgba(11,23,51,0.04)] flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-[#71819E] uppercase tracking-wider block">Active Bookings</span>
            <span className="text-3xl font-black text-[#0B1733] mt-1 block">{activeBookings}</span>
            <span className="text-xs text-[#71819E] mt-1 block font-semibold">{rentedVehicles} Vehicles Rented</span>
          </div>
          <div className="p-3.5 bg-[#FFF3E8] text-[#FF851B] rounded-xl border border-[#FF851B]/20">
            <Calendar className="h-6 w-6" />
          </div>
        </div>

        {/* Fleet Maintenance */}
        <div className="bg-white p-6 rounded-2xl border border-[#E2E8F2] shadow-[0_2px_12px_rgba(11,23,51,0.04)] flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-[#71819E] uppercase tracking-wider block">Maintenance</span>
            <span className="text-3xl font-black text-[#0B1733] mt-1 block">{maintenanceVehicles}</span>
            <span className="text-xs text-[#71819E] mt-1 block font-semibold">Vehicles Flagged</span>
          </div>
          <div className="p-3.5 bg-[#F5F7FC] text-[#71819E] rounded-xl border border-[#E2E8F2]">
            <Wrench className="h-6 w-6 text-[#71819E]" />
          </div>
        </div>
      </div>

      {/* Quick Access Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Manage Fleet Box */}
        <div className="bg-white p-6 rounded-2xl border border-[#E2E8F2] shadow-[0_2px_12px_rgba(11,23,51,0.04)]">
          <div className="flex items-center justify-between pb-4 mb-4 border-b border-[#E2E8F2]">
            <h3 className="font-bold text-[#0B1733] text-base flex items-center gap-2">
              <Car className="h-5 w-5 text-[#FF851B]" />
              Fleet & Vehicle Management
            </h3>
            <Link
              href="/admin/vehicles"
              className="text-xs font-bold text-[#0B1733] hover:text-[#FF851B] flex items-center gap-1 transition-colors"
            >
              Manage Fleet <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <p className="text-xs text-[#71819E] mb-4">
            Add new vehicles, update rental daily rates, edit specifications, or adjust status flags.
          </p>
          <div className="bg-[#F5F7FC] p-4 rounded-xl border border-[#E2E8F2] flex justify-between items-center text-xs">
            <span className="text-[#71819E] font-bold">Active Fleet Records:</span>
            <span className="font-bold text-[#0B1733]">{vehicles.length} Vehicles</span>
          </div>
        </div>

        {/* Customer KYC Review Box */}
        <div className="bg-white p-6 rounded-2xl border border-[#E2E8F2] shadow-[0_2px_12px_rgba(11,23,51,0.04)]">
          <div className="flex items-center justify-between pb-4 mb-4 border-b border-[#E2E8F2]">
            <h3 className="font-bold text-[#0B1733] text-base flex items-center gap-2">
              <Users className="h-5 w-5 text-[#FF851B]" />
              Customer KYC & Licence Approval
            </h3>
            <Link
              href="/admin/customers"
              className="text-xs font-bold text-[#0B1733] hover:text-[#FF851B] flex items-center gap-1 transition-colors"
            >
              Review Customers <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <p className="text-xs text-[#71819E] mb-4">
            Inspect uploaded customer driving licences side-by-side with OCR extracted data and Approve or Reject.
          </p>
          <div className="bg-[#F5F7FC] p-4 rounded-xl border border-[#E2E8F2] flex justify-between items-center text-xs">
            <span className="text-[#71819E] font-bold">Pending Verification:</span>
            <span className="font-bold text-[#FF851B] bg-[#FFF3E8] border border-[#FF851B]/30 px-2.5 py-0.5 rounded-full">
              {pendingKyc} Pending Customer{pendingKyc !== 1 ? "s" : ""}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
