"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Car,
  Users,
  Fuel,
  Gauge,
  SlidersHorizontal,
  Search,
  RotateCcw,
  Calendar,
  AlertCircle,
  ChevronRight
} from "lucide-react";

function VehiclesCatalogContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Filters state initialized from searchParams
  const [type, setType] = useState(searchParams.get("type") || "");
  const [fuel, setFuel] = useState(searchParams.get("fuel") || "");
  const [transmission, setTransmission] = useState(searchParams.get("transmission") || "");
  const [status, setStatus] = useState(searchParams.get("status") || "");
  const [maxPrice, setMaxPrice] = useState(searchParams.get("maxPrice") || "");
  const [search, setSearch] = useState(searchParams.get("search") || "");

  // Pickup and Return dates state
  const [startDate, setStartDate] = useState(searchParams.get("pickup") || searchParams.get("startDate") || "");
  const [endDate, setEndDate] = useState(searchParams.get("return") || searchParams.get("endDate") || "");

  const todayStr = new Date().toISOString().split("T")[0];

  const fetchVehicles = async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      if (type) params.set("type", type);
      if (fuel) params.set("fuel", fuel);
      if (transmission) params.set("transmission", transmission);
      if (status) params.set("status", status);
      if (maxPrice) params.set("maxPrice", maxPrice);
      if (search) params.set("search", search);
      if (startDate) params.set("startDate", startDate);
      if (endDate) params.set("endDate", endDate);

      const res = await fetch(`/api/vehicles?${params.toString()}`);
      const data = await res.json();

      if (data.success) {
        setVehicles(data.vehicles);
        if (
          data.vehicles.length === 0 &&
          !type &&
          !fuel &&
          !transmission &&
          !status &&
          !maxPrice &&
          !search &&
          !startDate &&
          !endDate
        ) {
          // Attempt auto-seed if table empty
          await fetch("/api/vehicles/seed", { method: "POST" });
          const retryRes = await fetch("/api/vehicles");
          const retryData = await retryRes.json();
          if (retryData.success) {
            setVehicles(retryData.vehicles);
          }
        }
      } else {
        setError(data.message || "Failed to load vehicles.");
      }
    } catch (err) {
      setError("An unexpected error occurred while fetching vehicles.");
    } finally {
      setLoading(false);
    }
  };

  // Re-fetch whenever filters or dates change
  useEffect(() => {
    fetchVehicles();
  }, [type, fuel, transmission, status, maxPrice, startDate, endDate]);

  const handleStartDateChange = (val) => {
    setStartDate(val);
    if (endDate && val && new Date(endDate) <= new Date(val)) {
      setEndDate("");
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchVehicles();
  };

  const handleResetFilters = () => {
    setType("");
    setFuel("");
    setTransmission("");
    setStatus("");
    setMaxPrice("");
    setSearch("");
    setStartDate("");
    setEndDate("");
    router.push("/vehicles");
  };

  const hasDateFilter = Boolean(startDate && endDate);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 bg-[#F5F7FC] min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 pb-6 border-b border-[#E2E8F2]">
        <div>
          <h1 className="text-3xl font-extrabold text-[#0B1733] tracking-tight uppercase">
            Available Fleet
          </h1>
        </div>
        <div className="flex items-center gap-2">
          {hasDateFilter && (
            <div className="text-xs font-bold text-[#0B1733] bg-white px-3.5 py-1.5 rounded-xl border border-[#E2E8F2] flex items-center gap-1.5 shadow-xs">
              <Calendar className="h-3.5 w-3.5 text-[#FF851B]" />
              <span>{startDate} to {endDate}</span>
            </div>
          )}
          <div className="text-xs font-bold text-[#0B1733] bg-white px-3.5 py-1.5 rounded-xl border border-[#E2E8F2] shadow-xs">
            Showing {vehicles.length} Vehicle{vehicles.length !== 1 ? "s" : ""}
          </div>
        </div>
      </div>

      {/* Main Grid: Left Filter Sidebar + Right Vehicles List */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Left Filter Sidebar */}
        <div className="bg-white p-6 rounded-2xl border border-[#E2E8F2] shadow-[0_2px_12px_rgba(11,23,51,0.04)] h-fit space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-[#E2E8F2]">
            <h2 className="text-base font-bold text-[#0B1733] flex items-center gap-2">
              <SlidersHorizontal className="h-4 w-4 text-[#FF851B]" />
              Filter Fleet
            </h2>
            {(type || fuel || transmission || status || maxPrice || search || startDate || endDate) && (
              <button
                onClick={handleResetFilters}
                className="text-xs font-bold text-[#71819E] hover:text-[#0B1733] flex items-center gap-1 transition-colors"
              >
                <RotateCcw className="h-3 w-3" /> Reset
              </button>
            )}
          </div>

          {/* Date Range Selection Box */}
          <div className="p-4 bg-[#F5F7FC] rounded-xl border border-[#E2E8F2] space-y-3">
            <div className="flex items-center gap-1.5 text-xs font-bold text-[#0B1733] uppercase tracking-wider">
              <Calendar className="h-4 w-4 text-[#FF851B]" />
              <span>Rental Dates Availability</span>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-[#71819E] mb-1">Pick-up Date</label>
              <input
                type="date"
                min={todayStr}
                value={startDate}
                onChange={(e) => handleStartDateChange(e.target.value)}
                className="w-full bg-white border border-[#E2E8F2] rounded-lg px-2.5 py-1.5 text-xs font-semibold text-[#0B1733] focus:outline-none focus:ring-2 focus:ring-[#0B1733]"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-[#71819E] mb-1">Return Date</label>
              <input
                type="date"
                min={startDate || todayStr}
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                disabled={!startDate}
                className="w-full bg-white border border-[#E2E8F2] rounded-lg px-2.5 py-1.5 text-xs font-semibold text-[#0B1733] focus:outline-none focus:ring-2 focus:ring-[#0B1733] disabled:opacity-50"
              />
            </div>

            {hasDateFilter && (
              <div className="text-[11px] text-[#0B1733] font-semibold bg-white p-2.5 rounded-lg border border-[#E2E8F2]">
                Checking overlap for {startDate} &rarr; {endDate}
              </div>
            )}
          </div>

          <form onSubmit={handleSearchSubmit} className="space-y-4">
            {/* Search Input */}
            <div>
              <label className="block text-xs font-bold text-[#71819E] mb-1">Search Name / Plate</label>
              <div className="relative">
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="e.g. Creta or KA-01"
                  className="w-full bg-[#F5F7FC] border border-[#E2E8F2] rounded-lg pl-8 pr-3 py-2 text-xs font-semibold text-[#0B1733] focus:outline-none focus:ring-2 focus:ring-[#0B1733]"
                />
                <Search className="h-3.5 w-3.5 absolute left-2.5 top-2.5 text-[#71819E]" />
              </div>
            </div>

            {/* Vehicle Type */}
            <div>
              <label className="block text-xs font-bold text-[#71819E] mb-1">Vehicle Type</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full bg-[#F5F7FC] border border-[#E2E8F2] rounded-lg px-3 py-2 text-xs font-semibold text-[#0B1733] focus:outline-none focus:ring-2 focus:ring-[#0B1733]"
              >
                <option value="">All Types</option>
                <option value="SUV">SUV</option>
                <option value="Sedan">Sedan</option>
                <option value="Hatchback">Hatchback</option>
                <option value="Bike">Bike / Motorcycle</option>
              </select>
            </div>

            {/* Fuel Type */}
            <div>
              <label className="block text-xs font-bold text-[#71819E] mb-1">Fuel Type</label>
              <select
                value={fuel}
                onChange={(e) => setFuel(e.target.value)}
                className="w-full bg-[#F5F7FC] border border-[#E2E8F2] rounded-lg px-3 py-2 text-xs font-semibold text-[#0B1733] focus:outline-none focus:ring-2 focus:ring-[#0B1733]"
              >
                <option value="">All Fuels</option>
                <option value="Petrol">Petrol</option>
                <option value="Diesel">Diesel</option>
                <option value="Electric">Electric</option>
                <option value="Hybrid">Hybrid</option>
              </select>
            </div>

            {/* Transmission */}
            <div>
              <label className="block text-xs font-bold text-[#71819E] mb-1">Transmission</label>
              <select
                value={transmission}
                onChange={(e) => setTransmission(e.target.value)}
                className="w-full bg-[#F5F7FC] border border-[#E2E8F2] rounded-lg px-3 py-2 text-xs font-semibold text-[#0B1733] focus:outline-none focus:ring-2 focus:ring-[#0B1733]"
              >
                <option value="">All Transmissions</option>
                <option value="Manual">Manual</option>
                <option value="Automatic">Automatic</option>
              </select>
            </div>

            {/* Availability */}
            <div>
              <label className="block text-xs font-bold text-[#71819E] mb-1">Availability Filter</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full bg-[#F5F7FC] border border-[#E2E8F2] rounded-lg px-3 py-2 text-xs font-semibold text-[#0B1733] focus:outline-none focus:ring-2 focus:ring-[#0B1733]"
              >
                <option value="">All Statuses</option>
                <option value="AVAILABLE">Available Only</option>
                <option value="RENTED">Rented</option>
                <option value="MAINTENANCE">Maintenance</option>
              </select>
            </div>

            {/* Price Filter */}
            <div>
              <label className="block text-xs font-bold text-[#71819E] mb-1">
                Max Price / Day: {maxPrice ? `₹${maxPrice}` : "Any"}
              </label>
              <input
                type="range"
                min="500"
                max="5000"
                step="250"
                value={maxPrice || 5000}
                onChange={(e) => setMaxPrice(e.target.value)}
                className="w-full accent-[#FF851B]"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-[#0B1733] hover:bg-[#16264C] text-white font-bold py-2.5 px-4 rounded-xl text-xs transition-colors shadow-xs uppercase tracking-wider"
            >
              Apply Filter Query
            </button>
          </form>
        </div>

        {/* Right Vehicles Cards List */}
        <div className="lg:col-span-3">
          {loading ? (
            <div className="bg-white p-12 rounded-2xl border border-[#E2E8F2] text-center text-[#71819E] text-sm font-semibold shadow-xs">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#0B1733] border-t-transparent mx-auto mb-3" />
              Loading vehicles from database...
            </div>
          ) : error ? (
            <div className="bg-white border border-[#E2E8F2] text-[#0B1733] p-8 rounded-2xl text-sm font-semibold shadow-xs flex flex-col items-center justify-center text-center gap-3">
              <AlertCircle className="h-8 w-8 text-amber-600" />
              <p className="text-[#0B1733]">{error}</p>
              <button
                onClick={fetchVehicles}
                className="bg-[#0B1733] hover:bg-[#16264C] text-white px-4 py-2 rounded-xl text-xs font-bold transition-colors"
              >
                Retry Fetching Vehicles
              </button>
            </div>
          ) : vehicles.length === 0 ? (
            <div className="bg-white p-12 rounded-2xl border border-[#E2E8F2] text-center shadow-xs">
              <Car className="h-12 w-12 text-[#71819E] mx-auto mb-3" />
              <h3 className="text-lg font-bold text-[#0B1733] mb-1">No vehicles matched your search</h3>
              <p className="text-[#71819E] text-sm mb-4">
                Try adjusting your dates or resetting your filters to view all vehicles.
              </p>
              <button
                onClick={handleResetFilters}
                className="bg-[#0B1733] text-white px-5 py-2.5 rounded-xl text-xs font-bold hover:bg-[#16264C]"
              >
                Clear All Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {vehicles.map((v) => {
                const isMaintenance = v.status === "MAINTENANCE";
                const isAvailable = hasDateFilter ? v.is_available_for_dates : v.status === "AVAILABLE";
                const isBookedForDates = hasDateFilter && !v.is_available_for_dates && !isMaintenance;

                return (
                  <div
                    key={v.id}
                    className="bg-white rounded-2xl border border-[#E2E8F2] overflow-hidden shadow-[0_2px_12px_rgba(11,23,51,0.04)] hover:shadow-[0_8px_24px_rgba(11,23,51,0.08)] transition-all flex flex-col justify-between"
                  >
                    <div>
                      {/* Image Header with Availability Badge */}
                      <div className="relative h-48 bg-[#F5F7FC] overflow-hidden">
                        <img
                          src={v.image || "/images/vehicles/hyundai_creta.jpg"}
                          alt={v.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = "/images/vehicles/hyundai_creta.jpg";
                          }}
                        />

                        {/* Top-Right Availability Badge */}
                        <div className="absolute top-3 right-3">
                          {isMaintenance ? (
                            <span className="text-[11px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider border shadow-xs bg-rose-50 text-rose-700 border-rose-200">
                              MAINTENANCE
                            </span>
                          ) : isBookedForDates ? (
                            <span className="text-[11px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider border shadow-xs bg-[#F5F7FC] text-[#71819E] border-[#E2E8F2]">
                              BOOKED / UNAVAILABLE
                            </span>
                          ) : isAvailable ? (
                            <span className="inline-flex items-center gap-1.5 text-[11px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider border shadow-xs bg-[#0B1733] text-white border-[#0B1733]">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#FF851B]"></span>
                              {hasDateFilter ? "AVAILABLE FOR DATES" : "AVAILABLE"}
                            </span>
                          ) : (
                            <span className="text-[11px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider border shadow-xs bg-[#F5F7FC] text-[#71819E] border-[#E2E8F2]">
                              {v.status}
                            </span>
                          )}
                        </div>

                        {/* Top-Left Category Badge */}
                        <div className="absolute bottom-3 left-3 bg-[#0B1733]/90 text-white px-2.5 py-1 rounded-lg text-xs font-bold">
                          {v.type}
                        </div>
                      </div>

                      {/* Card Body */}
                      <div className="p-5">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h3 className="text-xl font-extrabold text-[#0B1733]">{v.name}</h3>
                            <span className="text-xs font-mono font-semibold text-[#71819E]">
                              {v.plate_no}
                            </span>
                          </div>
                          <div className="text-right">
                            <span className="text-xl font-black text-[#0B1733]">
                              ₹{parseFloat(v.price_per_day).toLocaleString()}
                            </span>
                            <span className="text-xs text-[#71819E] block font-semibold">/ day</span>
                          </div>
                        </div>

                        {/* Overlap Warning Note if Booked */}
                        {isBookedForDates && (
                          <div className="mt-2 p-2.5 bg-rose-50 rounded-xl border border-rose-200 text-rose-800 text-xs font-bold flex items-center gap-1.5">
                            <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
                            <span>Reserved for conflicting booking dates</span>
                          </div>
                        )}

                        {/* Specs Badges */}
                        <div className="grid grid-cols-3 gap-2 my-4 pt-3 border-t border-[#E2E8F2] text-[#71819E] text-xs font-semibold">
                          <div className="flex items-center gap-1.5 bg-[#F5F7FC] p-2 rounded-xl border border-[#E2E8F2]">
                            <Users className="h-4 w-4 text-[#0B1733] shrink-0" />
                            <span>{v.seats || 5} Seats</span>
                          </div>
                          <div className="flex items-center gap-1.5 bg-[#F5F7FC] p-2 rounded-xl border border-[#E2E8F2]">
                            <Fuel className="h-4 w-4 text-[#0B1733] shrink-0" />
                            <span>{v.fuel || "Petrol"}</span>
                          </div>
                          <div className="flex items-center gap-1.5 bg-[#F5F7FC] p-2 rounded-xl border border-[#E2E8F2]">
                            <Gauge className="h-4 w-4 text-[#0B1733] shrink-0" />
                            <span>{v.transmission || "Manual"}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Card Footer Action */}
                    <div className="p-5 pt-0">
                      {isAvailable ? (
                        <Link
                          href={`/vehicles/${v.id}${
                            hasDateFilter ? `?pickup=${startDate}&return=${endDate}` : ""
                          }`}
                          className="w-full flex items-center justify-center gap-2 bg-[#0B1733] hover:bg-[#16264C] text-white font-bold py-3 px-4 rounded-xl text-xs uppercase tracking-wider transition-colors shadow-xs"
                        >
                          View Details & Book <ChevronRight className="h-4 w-4 text-[#FF851B]" />
                        </Link>
                      ) : (
                        <button
                          disabled
                          className="w-full flex items-center justify-center gap-2 bg-[#E2E8F2] text-[#71819E] font-bold py-3 px-4 rounded-xl text-xs uppercase tracking-wider cursor-not-allowed"
                        >
                          {isMaintenance ? "Under Maintenance" : "Unavailable For Selected Dates"}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function VehiclesPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-7xl mx-auto px-4 py-16 text-center text-[#71819E] font-semibold">
          Loading catalog...
        </div>
      }
    >
      <VehiclesCatalogContent />
    </Suspense>
  );
}
