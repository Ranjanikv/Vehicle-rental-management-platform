"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  FileText,
  CheckCircle2,
  ShieldCheck,
  AlertCircle,
  ArrowLeft,
  Calendar,
  Car,
  Clock,
  Download,
  CreditCard,
  Eye,
  Info,
  X
} from "lucide-react";

export default function BookingDetailPage({ params }) {
  const resolvedParams = use(params);
  const id = resolvedParams.id;
  const router = useRouter();

  const [booking, setBooking] = useState(null);
  const [agreementText, setAgreementText] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Agreement Signing state
  const [agreedCheck, setAgreedCheck] = useState(false);
  const [signing, setSigning] = useState(false);
  const [showAgreementPreview, setShowAgreementPreview] = useState(true);

  // Payment Placeholder Modal state
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  const fetchBooking = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/bookings/${id}`);
      const data = await res.json();
      if (data.success) {
        setBooking(data.booking);
        setAgreementText(data.booking.agreement_text || data.generatedAgreement);
        if (data.booking.agreement_signed) {
          setAgreedCheck(true);
        }
      } else {
        setError(data.message || "Failed to load booking details.");
      }
    } catch (err) {
      setError("An unexpected error occurred while fetching booking details.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchBooking();
    }
  }, [id]);

  const handleSignAgreement = async (e) => {
    e.preventDefault();
    if (!agreedCheck) {
      setError("You must check the agreement box before signing.");
      return;
    }

    setSigning(true);
    setError("");

    try {
      const res = await fetch(`/api/bookings/${id}/agreement`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agreed: true }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.message || "Failed to sign agreement.");
        return;
      }

      await fetchBooking();
    } catch (err) {
      setError("An unexpected network error occurred while signing the agreement.");
    } finally {
      setSigning(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center text-[#71819E] text-sm font-semibold">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#0B1733] border-t-transparent mx-auto mb-3" />
        Loading booking details & agreement...
      </div>
    );
  }

  if (error && !booking) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <div className="bg-rose-50 text-rose-800 p-6 rounded-2xl border border-rose-200 mb-6 text-sm font-semibold">
          <AlertCircle className="h-8 w-8 mx-auto mb-2 text-rose-600" />
          <h2 className="text-lg font-bold">{error}</h2>
        </div>
        <Link
          href="/bookings"
          className="inline-flex items-center gap-2 bg-[#0B1733] text-white px-5 py-2.5 rounded-xl text-xs font-bold hover:bg-[#16264C]"
        >
          <ArrowLeft className="h-4 w-4" /> Back to My Bookings
        </Link>
      </div>
    );
  }

  const start = new Date(booking.start_date);
  const end = new Date(booking.end_date);
  const diffDays = Math.ceil(Math.abs(end - start) / (1000 * 60 * 60 * 24)) || 1;
  const isSigned = Boolean(booking.agreement_signed);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 bg-[#F5F7FC] min-h-screen text-[#0B1733]">
      {/* Navigation */}
      <div className="mb-6">
        <Link
          href="/bookings"
          className="inline-flex items-center gap-2 text-xs font-bold text-[#71819E] hover:text-[#0B1733] transition-colors mb-4 uppercase tracking-wider"
        >
          <ArrowLeft className="h-4 w-4" /> Back to My Bookings
        </Link>

        {/* Header Summary */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#E2E8F2]">
          <div>
            <span className="text-xs font-bold text-[#0B1733] bg-white px-3 py-1 rounded-md uppercase tracking-wider border border-[#E2E8F2] shadow-xs">
              BOOKING #{booking.id}
            </span>
            <h1 className="text-3xl font-extrabold text-[#0B1733] mt-2 tracking-tight uppercase">
              Booking Details & Rental Flow
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center gap-1.5 text-xs font-extrabold px-3 py-1.5 rounded-full uppercase border shadow-xs ${
                booking.status === "CONFIRMED" || booking.status === "ACTIVE"
                  ? "bg-[#0B1733] text-white border-[#0B1733]"
                  : booking.status === "COMPLETED"
                  ? "bg-white text-[#0B1733] border-[#E2E8F2]"
                  : booking.status === "CANCELLED"
                  ? "bg-rose-50 text-rose-700 border-rose-200"
                  : "bg-white text-[#71819E] border-[#E2E8F2]"
              }`}
            >
              {(booking.status === "CONFIRMED" || booking.status === "ACTIVE") && (
                <span className="w-1.5 h-1.5 rounded-full bg-[#FF851B]"></span>
              )}
              Status: {booking.status}
            </span>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-6 bg-rose-50 border border-rose-200 text-rose-800 p-4 rounded-xl text-xs flex items-center gap-2 font-semibold">
          <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      {/* 1. Booking Summary Card */}
      <div className="bg-white rounded-2xl border border-[#E2E8F2] shadow-[0_2px_12px_rgba(11,23,51,0.04)] p-6 mb-6">
        <h3 className="text-xs font-bold text-[#71819E] uppercase tracking-wider mb-4 flex items-center gap-1.5">
          <Car className="h-4 w-4 text-[#FF851B]" /> Vehicle & Reservation Overview
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          <div className="bg-[#F5F7FC] p-3.5 rounded-xl border border-[#E2E8F2]">
            <span className="text-[#71819E] block font-semibold">Vehicle</span>
            <span className="font-bold text-[#0B1733] text-sm block mt-0.5">{booking.vehicle_name}</span>
            <span className="text-[11px] text-[#71819E]">{booking.vehicle_type} ({booking.plate_no})</span>
          </div>

          <div className="bg-[#F5F7FC] p-3.5 rounded-xl border border-[#E2E8F2]">
            <span className="text-[#71819E] block font-semibold">Pickup Date</span>
            <span className="font-bold text-[#0B1733] text-sm block mt-0.5">
              {start.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
            </span>
            <span className="text-[11px] text-[#71819E]">Scheduled</span>
          </div>

          <div className="bg-[#F5F7FC] p-3.5 rounded-xl border border-[#E2E8F2]">
            <span className="text-[#71819E] block font-semibold">Return Date</span>
            <span className="font-bold text-[#0B1733] text-sm block mt-0.5">
              {end.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
            </span>
            <span className="text-[11px] text-[#71819E]">{diffDays} day{diffDays > 1 ? "s" : ""}</span>
          </div>

          <div className="bg-[#F5F7FC] p-3.5 rounded-xl border border-[#E2E8F2]">
            <span className="text-[#71819E] block font-semibold">Total Amount</span>
            <span className="font-black text-[#0B1733] text-base block mt-0.5">
              ₹{parseFloat(booking.total_amount).toLocaleString("en-IN")}
            </span>
            <span className="text-[11px] text-[#71819E] font-semibold">₹{parseFloat(booking.price_per_day).toLocaleString("en-IN")}/day</span>
          </div>
        </div>
      </div>

      {/* 2. Rental Agreement Section */}
      <div className="bg-white rounded-2xl border border-[#E2E8F2] shadow-[0_2px_12px_rgba(11,23,51,0.04)] p-6 sm:p-8 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#E2E8F2] gap-3 mb-6">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-[#FF851B]" />
            <div>
              <h3 className="text-base font-bold text-[#0B1733]">Rental Agreement</h3>
              <p className="text-xs text-[#71819E]">Legal contract & terms of vehicle usage</p>
            </div>
          </div>

          <div>
            {isSigned ? (
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0B1733] bg-[#F5F7FC] px-3.5 py-1.5 rounded-full border border-[#E2E8F2]">
                <CheckCircle2 className="h-4 w-4 text-[#FF851B]" /> AGREEMENT SIGNED ✓
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#FF851B] bg-[#FFF3E8] px-3.5 py-1.5 rounded-full border border-[#FF851B]/30">
                <Clock className="h-4 w-4 text-[#FF851B]" /> SIGNATURE PENDING
              </span>
            )}
          </div>
        </div>

        {/* If signed: Show Actions (View / Download PDF) */}
        {isSigned ? (
          <div className="space-y-4">
            <div className="bg-[#F5F7FC] border border-[#E2E8F2] text-[#0B1733] rounded-xl p-4 text-xs flex items-center justify-between">
              <div>
                <p className="font-bold text-sm text-[#0B1733]">Agreement Signed & Validated</p>
                <p className="text-[#71819E] mt-0.5">
                  You have accepted all terms for Booking #{booking.id}. The signed agreement PDF is available for download.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => setShowAgreementPreview(!showAgreementPreview)}
                className="inline-flex items-center gap-1.5 bg-[#F5F7FC] hover:bg-[#E2E8F2] text-[#0B1733] font-bold px-4 py-2.5 rounded-xl text-xs transition-colors border border-[#E2E8F2]"
              >
                <Eye className="h-4 w-4 text-[#FF851B]" />
                {showAgreementPreview ? "HIDE AGREEMENT" : "VIEW AGREEMENT"}
              </button>

              <a
                href={`/api/bookings/${booking.id}/agreement/pdf`}
                download={`vehicle-rental-agreement-${booking.id}.pdf`}
                className="inline-flex items-center gap-1.5 bg-[#0B1733] hover:bg-[#16264C] text-white font-bold px-4 py-2.5 rounded-xl text-xs transition-colors shadow-xs uppercase tracking-wider"
              >
                <Download className="h-4 w-4 text-[#FF851B]" />
                DOWNLOAD AGREEMENT PDF
              </a>
            </div>

            {/* Toggleable Text Preview */}
            {showAgreementPreview && (
              <pre className="bg-[#F5F7FC] border border-[#E2E8F2] p-5 rounded-xl text-xs font-mono text-[#0B1733] whitespace-pre-wrap leading-relaxed overflow-x-auto max-h-[350px] mt-4">
                {agreementText}
              </pre>
            )}
          </div>
        ) : (
          /* If unsigned: Show Agreement Document & Signing Form */
          <div className="space-y-6">
            <pre className="bg-[#F5F7FC] border border-[#E2E8F2] p-5 rounded-xl text-xs font-mono text-[#0B1733] whitespace-pre-wrap leading-relaxed overflow-x-auto max-h-[350px]">
              {agreementText}
            </pre>

            <form onSubmit={handleSignAgreement} className="space-y-4 pt-4 border-t border-[#E2E8F2]">
              <div className="flex items-start gap-3 bg-[#F5F7FC] p-4 rounded-xl border border-[#E2E8F2]">
                <input
                  type="checkbox"
                  id="agreed-checkbox"
                  checked={agreedCheck}
                  onChange={(e) => setAgreedCheck(e.target.checked)}
                  className="mt-0.5 h-4 w-4 text-[#0B1733] rounded border-[#E2E8F2] focus:ring-[#0B1733] cursor-pointer shrink-0 accent-[#FF851B]"
                />
                <label htmlFor="agreed-checkbox" className="text-xs font-bold text-[#0B1733] cursor-pointer leading-relaxed">
                  I have read and agree to the rental agreement terms and conditions above.
                </label>
              </div>

              <button
                type="submit"
                disabled={signing || !agreedCheck}
                className="w-full bg-[#0B1733] hover:bg-[#16264C] text-white font-bold py-3 px-6 rounded-xl text-xs transition-colors shadow-xs disabled:opacity-50 flex items-center justify-center gap-2 uppercase tracking-wider"
              >
                {signing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                    Signing Agreement...
                  </>
                ) : (
                  "SIGN AGREEMENT"
                )}
              </button>
            </form>
          </div>
        )}
      </div>

      {/* 3. Payment Section (Placeholder) */}
      <div className="bg-white rounded-2xl border border-[#E2E8F2] shadow-[0_2px_12px_rgba(11,23,51,0.04)] p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#E2E8F2] gap-3 mb-6">
          <div className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-[#FF851B]" />
            <div>
              <h3 className="text-base font-bold text-[#0B1733]">Rental Payment</h3>
              <p className="text-xs text-[#71819E]">Simulated checkout & payment confirmation</p>
            </div>
          </div>

          <span className="text-xs font-bold px-3 py-1.5 rounded-full uppercase bg-[#F5F7FC] text-[#71819E] border border-[#E2E8F2]">
            Payment Status: NOT PAID
          </span>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 bg-[#F5F7FC] p-6 rounded-xl border border-[#E2E8F2]">
          <div>
            <span className="text-xs text-[#71819E] block uppercase font-bold tracking-wider">Total Amount Due</span>
            <span className="text-3xl font-black text-[#0B1733] mt-1 block">
              ₹{parseFloat(booking.total_amount).toLocaleString("en-IN")}
            </span>
            <span className="text-xs text-[#71819E] mt-0.5 block font-semibold">
              Booking Status: <span className="font-bold text-[#0B1733]">{booking.status}</span>
            </span>
          </div>

          <button
            type="button"
            onClick={() => setShowPaymentModal(true)}
            className="bg-[#0B1733] hover:bg-[#16264C] text-white font-bold py-3 px-8 rounded-xl text-xs transition-colors shadow-xs flex items-center justify-center gap-2 uppercase tracking-wider shrink-0"
          >
            <CreditCard className="h-4 w-4 text-[#FF851B]" /> PAY NOW
          </button>
        </div>
      </div>

      {/* Payment Placeholder Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-50 bg-[#0B1733]/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-[#E2E8F2] text-center">
            <div className="flex justify-end mb-2">
              <button
                type="button"
                onClick={() => setShowPaymentModal(false)}
                className="text-[#71819E] hover:text-[#0B1733] p-1 rounded-lg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="bg-[#FFF3E8] p-3 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4 text-[#FF851B] border border-[#FF851B]/20">
              <Info className="h-6 w-6" />
            </div>

            <h3 className="text-lg font-bold text-[#0B1733] mb-2">Payment Notice</h3>
            <p className="text-xs text-[#71819E] mb-6 leading-relaxed">
              Payment functionality will be available here. This simulated confirmation completes the academic rental flow.
            </p>

            <div className="bg-[#F5F7FC] rounded-xl p-3 text-xs text-[#71819E] border border-[#E2E8F2] mb-6 text-left space-y-1">
              <div><span className="font-bold text-[#0B1733]">Booking ID:</span> #{booking.id}</div>
              <div><span className="font-bold text-[#0B1733]">Total Due:</span> ₹{parseFloat(booking.total_amount).toLocaleString("en-IN")}</div>
              <div><span className="font-bold text-[#0B1733]">Current Status:</span> {booking.status}</div>
            </div>

            <button
              type="button"
              onClick={() => setShowPaymentModal(false)}
              className="w-full bg-[#0B1733] hover:bg-[#16264C] text-white font-bold py-2.5 px-4 rounded-xl text-xs transition-colors uppercase tracking-wider shadow-xs"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
