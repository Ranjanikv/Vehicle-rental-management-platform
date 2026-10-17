"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Search, Car, ShieldCheck, Calendar, Key, ChevronRight } from "lucide-react";

export default function HomePage() {
  const router = useRouter();
  const [vehicleType, setVehicleType] = useState("");
  const [pickupDate, setPickupDate] = useState("");
  const [returnDate, setReturnDate] = useState("");

  const handleSearch = (e) => {
    e.preventDefault();
    const queryParams = new URLSearchParams();
    if (vehicleType) queryParams.set("type", vehicleType);
    if (pickupDate) queryParams.set("pickup", pickupDate);
    if (returnDate) queryParams.set("return", returnDate);

    router.push(`/vehicles?${queryParams.toString()}`);
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#F5F7FC]">
      {/* Hero Section */}
      <section className="bg-[#172440] text-white py-16 md:py-24 px-4 sm:px-6 lg:px-8 border-b border-[#223356]">
        <div className="max-w-5xl mx-auto text-center">
          <span className="inline-flex items-center gap-1.5 bg-white/10 text-white font-bold text-xs px-3.5 py-1.5 rounded-full border border-white/15 mb-4 tracking-wider uppercase shadow-xs">
            <span className="w-2 h-2 rounded-full bg-[#FF851B]"></span>
            Premium Fleet & Vehicle Rental
          </span>
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-4 uppercase text-white">
            Rent Your Ride. <br className="hidden sm:inline" />
            <span className="text-[#C5D0E3]">Start Your Journey.</span>
          </h1>
          <p className="text-base md:text-lg text-[#D0D8E6] max-w-2xl mx-auto mb-10 font-normal">
            Find the right vehicle for your next trip. Simple booking, transparent pricing, and instant approval.
          </p>

          {/* Vehicle Search Box */}
          <div className="bg-white text-[#0B1733] rounded-2xl p-6 shadow-[0_8px_30px_rgba(0,0,0,0.25)] max-w-4xl mx-auto border border-[#E2E8F2]">
            <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
              <div className="text-left">
                <label className="block text-xs font-bold text-[#71819E] uppercase tracking-wider mb-1.5">
                  Vehicle Type
                </label>
                <select
                  value={vehicleType}
                  onChange={(e) => setVehicleType(e.target.value)}
                  className="w-full bg-[#F5F7FC] border border-[#E2E8F2] rounded-xl px-3 py-2.5 text-xs font-semibold text-[#0B1733] focus:outline-none focus:ring-2 focus:ring-[#0B1733]"
                >
                  <option value="">All Types</option>
                  <option value="SUV">SUV</option>
                  <option value="Sedan">Sedan</option>
                  <option value="Hatchback">Hatchback</option>
                  <option value="Bike">Bike / Motorcycle</option>
                </select>
              </div>

              <div className="text-left">
                <label className="block text-xs font-bold text-[#71819E] uppercase tracking-wider mb-1.5">
                  Pick-up Date
                </label>
                <input
                  type="date"
                  value={pickupDate}
                  onChange={(e) => setPickupDate(e.target.value)}
                  className="w-full bg-[#F5F7FC] border border-[#E2E8F2] rounded-xl px-3 py-2 text-xs font-semibold text-[#0B1733] focus:outline-none focus:ring-2 focus:ring-[#0B1733]"
                />
              </div>

              <div className="text-left">
                <label className="block text-xs font-bold text-[#71819E] uppercase tracking-wider mb-1.5">
                  Return Date
                </label>
                <input
                  type="date"
                  value={returnDate}
                  onChange={(e) => setReturnDate(e.target.value)}
                  className="w-full bg-[#F5F7FC] border border-[#E2E8F2] rounded-xl px-3 py-2 text-xs font-semibold text-[#0B1733] focus:outline-none focus:ring-2 focus:ring-[#0B1733]"
                />
              </div>

              <div>
                <button
                  type="submit"
                  className="w-full bg-[#0B1733] hover:bg-[#16264C] text-white font-bold py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 transition-colors shadow-xs text-xs uppercase tracking-wider"
                >
                  <Search className="h-4 w-4 text-[#FF851B]" />
                  SEARCH FLEET
                </button>
              </div>
            </form>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-16 md:py-20 bg-[#F5F7FC]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-extrabold text-[#0B1733] tracking-tight uppercase">
              How It Works
            </h2>
            <p className="mt-2 text-sm text-[#71819E]">
              Get on the road in 4 simple steps
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Step 1 */}
            <div className="bg-white p-6 rounded-2xl border border-[#E2E8F2] shadow-[0_2px_12px_rgba(11,23,51,0.04)] flex flex-col items-center text-center">
              <div className="w-9 h-9 bg-[#0B1733] text-white rounded-xl flex items-center justify-center font-bold text-sm mb-4">
                1
              </div>
              <div className="p-3 bg-[#FFF3E8] text-[#FF851B] rounded-xl mb-3 border border-[#FF851B]/20">
                <Car className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-[#0B1733] mb-1.5">Choose a vehicle</h3>
              <p className="text-xs text-[#71819E] leading-relaxed">
                Browse our wide collection of SUVs, Sedans, Hatchbacks, and Bikes with real-time availability.
              </p>
            </div>

            {/* Step 2 */}
            <div className="bg-white p-6 rounded-2xl border border-[#E2E8F2] shadow-[0_2px_12px_rgba(11,23,51,0.04)] flex flex-col items-center text-center">
              <div className="w-9 h-9 bg-[#0B1733] text-white rounded-xl flex items-center justify-center font-bold text-sm mb-4">
                2
              </div>
              <div className="p-3 bg-[#FFF3E8] text-[#FF851B] rounded-xl mb-3 border border-[#FF851B]/20">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-[#0B1733] mb-1.5">Complete verification</h3>
              <p className="text-xs text-[#71819E] leading-relaxed">
                Upload your driving licence with OCR extraction and review your details.
              </p>
            </div>

            {/* Step 3 */}
            <div className="bg-white p-6 rounded-2xl border border-[#E2E8F2] shadow-[0_2px_12px_rgba(11,23,51,0.04)] flex flex-col items-center text-center">
              <div className="w-9 h-9 bg-[#0B1733] text-white rounded-xl flex items-center justify-center font-bold text-sm mb-4">
                3
              </div>
              <div className="p-3 bg-[#FFF3E8] text-[#FF851B] rounded-xl mb-3 border border-[#FF851B]/20">
                <Calendar className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-[#0B1733] mb-1.5">Book your dates</h3>
              <p className="text-xs text-[#71819E] leading-relaxed">
                Select your pickup & return dates with real-time double-booking prevention.
              </p>
            </div>

            {/* Step 4 */}
            <div className="bg-white p-6 rounded-2xl border border-[#E2E8F2] shadow-[0_2px_12px_rgba(11,23,51,0.04)] flex flex-col items-center text-center">
              <div className="w-9 h-9 bg-[#0B1733] text-white rounded-xl flex items-center justify-center font-bold text-sm mb-4">
                4
              </div>
              <div className="p-3 bg-[#FFF3E8] text-[#FF851B] rounded-xl mb-3 border border-[#FF851B]/20">
                <Key className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-[#0B1733] mb-1.5">Pick up and drive</h3>
              <p className="text-xs text-[#71819E] leading-relaxed">
                Sign your digital agreement, complete simulated payment, and enjoy your trip!
              </p>
            </div>
          </div>

          <div className="mt-12 text-center">
            <Link
              href="/vehicles"
              className="inline-flex items-center gap-2 bg-[#0B1733] hover:bg-[#16264C] text-white font-bold px-6 py-3 rounded-xl transition-colors text-xs uppercase tracking-wider shadow-xs"
            >
              Browse Vehicle Fleet <ChevronRight className="h-4 w-4 text-[#FF851B]" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
