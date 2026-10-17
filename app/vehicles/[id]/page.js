"use client";

import { useState, useEffect, use, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Car,
  Users,
  Fuel,
  Gauge,
  Calendar,
  ShieldCheck,
  ArrowLeft,
  AlertCircle,
  ShieldAlert,
  ArrowRight
} from "lucide-react";

function VehicleDetailContent({ params }) {
  const resolvedParams = use(params);
  const id = resolvedParams.id;
  const router = useRouter();
  const searchParams = useSearchParams();

  const [vehicle, setVehicle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Customer Auth / KYC status
  const [currentUser, setCurrentUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Rental date selection state (prefill from searchParams if navigated from fleet list)
  const initialPickup = searchParams.get("pickup") || searchParams.get("startDate") || "";
  const initialReturn = searchParams.get("return") || searchParams.get("endDate") || "";

  const [startDate, setStartDate] = useState(initialPickup);
  const [endDate, setEndDate] = useState(initialReturn);
  const [dateError, setDateError] = useState("");
  const [totalDays, setTotalDays] = useState(0);
  const [totalAmount, setTotalAmount] = useState(0);

  // Booking submission state
  const [bookingInProgress, setBookingInProgress] = useState(false);
  const [bookingError, setBookingError] = useState("");

  const todayStr = new Date().toISOString().split("T")[0];

  // Calculate minimum return date (strictly the day after pickup date)
  const getMinReturnDate = () => {
    if (!startDate) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      return tomorrow.toISOString().split("T")[0];
    }
    const nextDay = new Date(startDate);
    nextDay.setDate(nextDay.getDate() + 1);
    return nextDay.toISOString().split("T")[0];
  };

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        // Fetch vehicle details
        const vRes = await fetch(`/api/vehicles/${id}`);
        const vData = await vRes.json();
        if (vData.success) {
          setVehicle(vData.vehicle);
        } else {
          setError(vData.message || "Vehicle not found.");
        }

        // Fetch current user details & KYC status
        const uRes = await fetch("/api/auth/me");
        if (uRes.ok) {
          const uData = await uRes.json();
          if (uData.success) {
            setCurrentUser(uData.user);
          }
        }
      } catch (err) {
        setError("Failed to load vehicle details.");
      } finally {
        setLoading(false);
        setAuthLoading(false);
      }
    }

    if (id) {
      loadData();
    }
  }, [id]);

  // Handle pickup date change
  const handleStartDateChange = (val) => {
    setStartDate(val);
    setDateError("");
    setBookingError("");

    if (endDate && val && new Date(endDate) <= new Date(val)) {
      setEndDate("");
    }
  };

  // Handle return date change
  const handleEndDateChange = (val) => {
    setEndDate(val);
    setDateError("");
    setBookingError("");
  };

  // Calculate rental cost dynamically when dates change
  useEffect(() => {
    setDateError("");
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);

      if (end <= start) {
        setDateError("Return date must be strictly after pickup date.");
        setTotalDays(0);
        setTotalAmount(0);
        return;
      }

      const diffTime = Math.abs(end - start);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      setTotalDays(diffDays);

      if (vehicle) {
        setTotalAmount(diffDays * parseFloat(vehicle.price_per_day));
      }
    } else {
      setTotalDays(0);
      setTotalAmount(0);
    }
  }, [startDate, endDate, vehicle]);

  // Handle Booking Submission
  const handleBookNow = async () => {
    setBookingError("");
    setDateError("");

    if (!currentUser) {
      router.push(`/login?error=Please log in to book a vehicle`);
      return;
    }

    if (currentUser.kyc_status !== "VERIFIED") {
      setBookingError("KYC Verification Required. Your driving licence must be verified by an administrator before booking.");
      return;
    }

    if (!startDate || !endDate) {
      setDateError("Please select both pickup and return dates.");
      return;
    }

    if (new Date(endDate) <= new Date(startDate)) {
      setDateError("Return date must be strictly after pickup date.");
      return;
    }

    setBookingInProgress(true);
    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vehicleId: vehicle.id,
          startDate,
          endDate
        })
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setBookingError(data.message || "Failed to create booking.");
        return;
      }

      // Success: Immediately route to booking details & agreement page
      router.push(`/bookings/${data.booking.id}`);
    } catch (err) {
      setBookingError("An unexpected network error occurred while booking. Please try again.");
    } finally {
      setBookingInProgress(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center text-[#71819E] text-sm font-semibold">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#0B1733] border-t-transparent mx-auto mb-3" />
        Loading vehicle specification...
      </div>
    );
  }

  if (error || !vehicle) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <div className="bg-white text-[#0B1733] p-6 rounded-2xl border border-[#E2E8F2] mb-6 shadow-xs">
          <AlertCircle className="h-8 w-8 mx-auto mb-2 text-[#FF851B]" />
          <h2 className="text-lg font-bold">{error || "Vehicle Not Found"}</h2>
        </div>
        <Link
          href="/vehicles"
          className="inline-flex items-center gap-2 bg-[#0B1733] text-white px-5 py-2.5 rounded-xl text-xs font-bold hover:bg-[#16264C]"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Vehicles
        </Link>
      </div>
    );
  }

  const isKycVerified = currentUser?.kyc_status === "VERIFIED";

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 bg-[#F5F7FC] min-h-screen">
      {/* Back button */}
      <div className="mb-6">
        <Link
          href="/vehicles"
          className="inline-flex items-center gap-2 text-xs font-bold text-[#71819E] hover:text-[#0B1733] transition-colors uppercase tracking-wider"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Vehicles List
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Image & Vehicle Specifications */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl border border-[#E2E8F2] overflow-hidden shadow-[0_2px_12px_rgba(11,23,51,0.04)]">
            <div className="relative h-80 sm:h-96 bg-[#F5F7FC]">
              <img
                src={vehicle.image || "/images/vehicles/hyundai_creta.jpg"}
                alt={vehicle.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = "/images/vehicles/hyundai_creta.jpg";
                }}
              />
              <div className="absolute top-4 right-4">
                <span
                  className={`inline-flex items-center gap-1.5 text-xs font-extrabold px-3 py-1.5 rounded-full uppercase tracking-wider border shadow-xs ${
                    vehicle.status === "AVAILABLE"
                      ? "bg-[#0B1733] text-white border-[#0B1733]"
                      : vehicle.status === "RENTED"
                      ? "bg-[#F5F7FC] text-[#71819E] border-[#E2E8F2]"
                      : "bg-rose-50 text-rose-700 border-rose-200"
                  }`}
                >
                  {vehicle.status === "AVAILABLE" && (
                    <span className="w-1.5 h-1.5 rounded-full bg-[#FF851B]"></span>
                  )}
                  {vehicle.status}
                </span>
              </div>
            </div>

            <div className="p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#E2E8F2]">
                <div>
                  <span className="text-xs font-bold text-[#0B1733] bg-[#F5F7FC] border border-[#E2E8F2] px-3 py-1 rounded-md uppercase tracking-wider">
                    {vehicle.type}
                  </span>
                  <h1 className="text-3xl font-extrabold text-[#0B1733] mt-2">{vehicle.name}</h1>
                  <p className="text-xs font-mono font-semibold text-[#71819E] mt-1">
                    Registration: {vehicle.plate_no}
                  </p>
                </div>
                <div className="text-left sm:text-right">
                  <span className="text-3xl font-black text-[#0B1733]">
                    ₹{parseFloat(vehicle.price_per_day).toLocaleString()}
                  </span>
                  <span className="text-[#71819E] text-xs block font-bold">Per Day</span>
                </div>
              </div>

              {/* Specifications Breakdown */}
              <div className="pt-6">
                <h3 className="text-xs font-bold text-[#71819E] uppercase tracking-wider mb-4">
                  Vehicle Specifications
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="bg-[#F5F7FC] p-4 rounded-xl border border-[#E2E8F2]">
                    <Users className="h-5 w-5 text-[#FF851B] mb-1" />
                    <span className="text-xs text-[#71819E] block font-semibold">Capacity</span>
                    <span className="text-sm font-bold text-[#0B1733]">{vehicle.seats || 5} Seats</span>
                  </div>
                  <div className="bg-[#F5F7FC] p-4 rounded-xl border border-[#E2E8F2]">
                    <Fuel className="h-5 w-5 text-[#FF851B] mb-1" />
                    <span className="text-xs text-[#71819E] block font-semibold">Fuel Type</span>
                    <span className="text-sm font-bold text-[#0B1733]">{vehicle.fuel || "Petrol"}</span>
                  </div>
                  <div className="bg-[#F5F7FC] p-4 rounded-xl border border-[#E2E8F2]">
                    <Gauge className="h-5 w-5 text-[#FF851B] mb-1" />
                    <span className="text-xs text-[#71819E] block font-semibold">Transmission</span>
                    <span className="text-sm font-bold text-[#0B1733]">{vehicle.transmission || "Manual"}</span>
                  </div>
                  <div className="bg-[#F5F7FC] p-4 rounded-xl border border-[#E2E8F2]">
                    <Car className="h-5 w-5 text-[#FF851B] mb-1" />
                    <span className="text-xs text-[#71819E] block font-semibold">Odometer</span>
                    <span className="text-sm font-bold text-[#0B1733]">{vehicle.odometer_km || 0} km</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Rental Date Selection & Pricing Summary */}
        <div>
          <div className="bg-white p-6 rounded-2xl border border-[#E2E8F2] shadow-[0_2px_12px_rgba(11,23,51,0.04)] sticky top-24 space-y-4">
            <h3 className="text-base font-bold text-[#0B1733] pb-3 border-b border-[#E2E8F2] flex items-center gap-2">
              <Calendar className="h-5 w-5 text-[#FF851B]" />
              Select Rental Dates
            </h3>

            {/* KYC Status Notice */}
            {!authLoading && currentUser && !isKycVerified && (
              <div className="bg-[#F5F7FC] border border-[#E2E8F2] rounded-xl p-4 text-xs text-[#0B1733] space-y-2">
                <div className="flex items-center gap-1.5 font-bold">
                  <ShieldAlert className="h-4 w-4 text-[#FF851B] shrink-0" />
                  <span>KYC Verification Required</span>
                </div>
                <p className="text-[#71819E] leading-relaxed">
                  Your account status is currently <strong>{currentUser.kyc_status}</strong>. Please upload and confirm your driving licence details on your dashboard and wait for admin approval before you can reserve a vehicle.
                </p>
                <Link
                  href="/dashboard"
                  className="inline-flex items-center gap-1 text-xs font-bold text-[#0B1733] hover:text-[#FF851B] transition-colors pt-1"
                >
                  Go to Customer Dashboard <ArrowRight className="h-3 w-3 text-[#FF851B]" />
                </Link>
              </div>
            )}

            {!authLoading && !currentUser && (
              <div className="bg-[#F5F7FC] border border-[#E2E8F2] rounded-xl p-3 text-xs text-[#0B1733] flex items-center justify-between">
                <span>Please log in to make a booking.</span>
                <Link href="/login" className="font-bold underline text-[#0B1733] hover:text-[#FF851B]">
                  Login
                </Link>
              </div>
            )}

            {bookingError && (
              <div className="bg-rose-50 border border-rose-200 text-rose-800 p-3 rounded-xl text-xs flex items-center gap-2 font-semibold">
                <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
                <span>{bookingError}</span>
              </div>
            )}

            {dateError && (
              <div className="bg-rose-50 border border-rose-200 text-rose-800 p-3 rounded-xl text-xs flex items-center gap-2 font-semibold">
                <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
                <span>{dateError}</span>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#71819E] uppercase tracking-wider mb-1">
                  Pick-up Date
                </label>
                <input
                  type="date"
                  value={startDate}
                  min={todayStr}
                  onChange={(e) => handleStartDateChange(e.target.value)}
                  className="w-full bg-[#F5F7FC] border border-[#E2E8F2] rounded-lg px-3 py-2 text-xs font-semibold text-[#0B1733] focus:outline-none focus:ring-2 focus:ring-[#0B1733]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#71819E] uppercase tracking-wider mb-1">
                  Return Date
                </label>
                <input
                  type="date"
                  value={endDate}
                  min={getMinReturnDate()}
                  onChange={(e) => handleEndDateChange(e.target.value)}
                  disabled={!startDate}
                  className="w-full bg-[#F5F7FC] border border-[#E2E8F2] rounded-lg px-3 py-2 text-xs font-semibold text-[#0B1733] focus:outline-none focus:ring-2 focus:ring-[#0B1733] disabled:opacity-50 disabled:cursor-not-allowed"
                />
                {!startDate && (
                  <span className="text-[11px] text-[#71819E] mt-1 block font-medium">
                    Please select a pick-up date first.
                  </span>
                )}
              </div>

              {/* Dynamic Price Calculation Box */}
              {totalDays > 0 && (
                <div className="bg-[#F5F7FC] border border-[#E2E8F2] rounded-xl p-4 mt-4 space-y-2">
                  <div className="flex justify-between text-xs text-[#71819E] font-semibold">
                    <span>Rate / Day:</span>
                    <span className="font-bold text-[#0B1733]">₹{parseFloat(vehicle.price_per_day).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-xs text-[#71819E] font-semibold">
                    <span>Rental Duration:</span>
                    <span className="font-bold text-[#0B1733]">{totalDays} Day{totalDays > 1 ? "s" : ""}</span>
                  </div>
                  <div className="pt-2 border-t border-[#E2E8F2] flex justify-between items-center text-xs font-extrabold text-[#0B1733]">
                    <span>Total Amount:</span>
                    <span className="text-lg text-[#0B1733] font-black">₹{totalAmount.toLocaleString()}</span>
                  </div>
                </div>
              )}

              <button
                type="button"
                onClick={handleBookNow}
                disabled={
                  vehicle.status !== "AVAILABLE" ||
                  bookingInProgress ||
                  !startDate ||
                  !endDate ||
                  (currentUser && !isKycVerified)
                }
                className={`w-full py-3 px-4 rounded-xl font-bold text-xs uppercase tracking-wider shadow-xs transition-colors flex items-center justify-center gap-2 ${
                  vehicle.status === "AVAILABLE" && (!currentUser || isKycVerified)
                    ? "bg-[#0B1733] hover:bg-[#16264C] text-white disabled:opacity-50"
                    : "bg-[#E2E8F2] text-[#71819E] cursor-not-allowed"
                }`}
              >
                {bookingInProgress ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                    Creating Booking...
                  </>
                ) : vehicle.status !== "AVAILABLE" ? (
                  "Vehicle Unavailable"
                ) : currentUser && !isKycVerified ? (
                  "KYC Verification Required"
                ) : (
                  <>
                    Proceed to Book <ArrowRight className="h-4 w-4 text-[#FF851B]" />
                  </>
                )}
              </button>

              <div className="text-center pt-2">
                <span className="text-[11px] text-[#71819E] font-semibold flex items-center justify-center gap-1">
                  <ShieldCheck className="h-3.5 w-3.5 text-[#0B1733]" /> Automated Concurrency Double-Booking Protection
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function VehicleDetailPage({ params }) {
  return (
    <Suspense
      fallback={
        <div className="max-w-7xl mx-auto px-4 py-16 text-center text-[#71819E] font-semibold">
          Loading vehicle specification...
        </div>
      }
    >
      <VehicleDetailContent params={params} />
    </Suspense>
  );
}
