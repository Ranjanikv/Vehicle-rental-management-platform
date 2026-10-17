"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Calendar, FileText, CheckCircle2, Clock, AlertCircle, Car, ArrowRight, ShieldCheck, RefreshCw } from "lucide-react";

export default function MyBookingsPage() {
  const router = useRouter();

  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchBookings = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/bookings");
      if (res.status === 401) {
        router.push("/login?error=Please log in to view your bookings");
        return;
      }
      const data = await res.json();
      if (data.success) {
        setBookings(data.bookings || []);
      } else {
        setError(data.message || "Failed to load bookings.");
      }
    } catch (err) {
      console.error("fetchBookings error:", err);
      setError("An unexpected network error occurred while loading bookings.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 bg-[#F5F7FC] min-h-screen text-[#0B1733]">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 pb-6 border-b border-[#E2E8F2]">
        <div>
          <h1 className="text-3xl font-extrabold text-[#0B1733] tracking-tight uppercase">
            My Bookings
          </h1>
          <p className="text-[#71819E] text-sm mt-1">
            Track your vehicle reservations, rental agreements, and booking statuses
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchBookings}
            className="flex items-center gap-1.5 bg-white hover:bg-[#F5F7FC] text-[#0B1733] font-bold py-2 px-3.5 rounded-xl text-xs transition-colors border border-[#E2E8F2] shadow-xs"
          >
            <RefreshCw className="h-3.5 w-3.5 text-[#FF851B]" /> Refresh
          </button>
          <Link
            href="/vehicles"
            className="flex items-center gap-2 bg-[#0B1733] hover:bg-[#16264C] text-white font-bold py-2 px-4 rounded-xl text-xs transition-colors shadow-xs uppercase tracking-wider"
          >
            <Car className="h-4 w-4 text-[#FF851B]" /> Book a Vehicle
          </Link>
        </div>
      </div>

      {error && (
        <div className="mb-6 bg-rose-50 border border-rose-200 text-rose-800 px-4 py-3 rounded-xl text-xs flex items-center gap-2 font-semibold">
          <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      {/* Bookings Table / List */}
      <div className="bg-white rounded-2xl border border-[#E2E8F2] shadow-[0_2px_12px_rgba(11,23,51,0.04)] overflow-hidden">
        {loading ? (
          <div className="p-16 text-center text-[#71819E] text-sm font-semibold">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#0B1733] border-t-transparent mx-auto mb-3" />
            Loading your bookings...
          </div>
        ) : bookings.length === 0 ? (
          <div className="p-16 text-center">
            <Calendar className="h-12 w-12 text-[#71819E] mx-auto mb-3" />
            <h3 className="text-lg font-bold text-[#0B1733] mb-1">No bookings yet</h3>
            <p className="text-[#71819E] text-sm mb-6 max-w-sm mx-auto">
              You haven't placed any vehicle bookings yet. Browse our available fleet and reserve a vehicle.
            </p>
            <Link
              href="/vehicles"
              className="inline-flex items-center gap-2 bg-[#0B1733] text-white font-bold px-5 py-2.5 rounded-xl text-xs hover:bg-[#16264C] transition-colors uppercase tracking-wider shadow-xs"
            >
              Browse Vehicle Fleet <ArrowRight className="h-4 w-4 text-[#FF851B]" />
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#F5F7FC] border-b border-[#E2E8F2] text-xs font-bold text-[#71819E] uppercase tracking-wider">
                  <th className="py-3.5 px-4">Booking ID</th>
                  <th className="py-3.5 px-4">Vehicle</th>
                  <th className="py-3.5 px-4">Pickup Date</th>
                  <th className="py-3.5 px-4">Return Date</th>
                  <th className="py-3.5 px-4">Total Amount</th>
                  <th className="py-3.5 px-4">Agreement Status</th>
                  <th className="py-3.5 px-4">Booking Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F2] text-sm">
                {bookings.map((b) => (
                  <tr key={b.id} className="hover:bg-[#F5F7FC]/70 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-[#0B1733]">
                      #{b.id}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={b.vehicle_image || "/images/vehicles/hyundai_creta.jpg"}
                          alt={b.vehicle_name}
                          className="w-10 h-10 object-cover rounded-xl bg-[#F5F7FC] border border-[#E2E8F2] shrink-0"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = "/images/vehicles/hyundai_creta.jpg";
                          }}
                        />
                        <div>
                          <span className="font-bold text-[#0B1733] block">{b.vehicle_name}</span>
                          <span className="text-xs text-[#71819E]">{b.vehicle_type} ({b.plate_no})</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-xs font-semibold text-[#71819E]">
                      {new Date(b.start_date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                    </td>
                    <td className="py-3.5 px-4 text-xs font-semibold text-[#71819E]">
                      {new Date(b.end_date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                    </td>
                    <td className="py-3.5 px-4 font-extrabold text-[#0B1733]">
                      ₹{parseFloat(b.total_amount).toLocaleString("en-IN")}
                    </td>
                    <td className="py-3.5 px-4">
                      {b.agreement_signed ? (
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-[#0B1733] bg-[#F5F7FC] px-2.5 py-1 rounded-full border border-[#E2E8F2]">
                          <CheckCircle2 className="h-3.5 w-3.5 text-[#FF851B]" /> Signed ✓
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-[#FF851B] bg-[#FFF3E8] px-2.5 py-1 rounded-full border border-[#FF851B]/30">
                          <Clock className="h-3.5 w-3.5 text-[#FF851B]" /> Pending
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full uppercase border ${
                          b.status === "CONFIRMED" || b.status === "ACTIVE"
                            ? "bg-[#0B1733] text-white border-[#0B1733]"
                            : b.status === "COMPLETED"
                            ? "bg-[#F5F7FC] text-[#71819E] border-[#E2E8F2]"
                            : b.status === "CANCELLED"
                            ? "bg-rose-50 text-rose-700 border-rose-200"
                            : "bg-[#F5F7FC] text-[#71819E] border-[#E2E8F2]"
                        }`}
                      >
                        {(b.status === "CONFIRMED" || b.status === "ACTIVE") && (
                          <span className="w-1.5 h-1.5 rounded-full bg-[#FF851B]"></span>
                        )}
                        {b.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <Link
                        href={`/bookings/${b.id}`}
                        className="inline-flex items-center gap-1 text-xs font-bold text-white bg-[#0B1733] hover:bg-[#16264C] px-3 py-1.5 rounded-lg transition-colors shadow-xs"
                      >
                        <FileText className="h-3.5 w-3.5 text-[#FF851B]" />
                        {b.agreement_signed ? "View Details" : "Sign Agreement"}
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
