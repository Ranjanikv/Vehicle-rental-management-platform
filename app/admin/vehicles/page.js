"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Car, Plus, Edit, Trash2, ShieldCheck, ArrowLeft, AlertCircle, CheckCircle, RefreshCw } from "lucide-react";

export default function AdminVehiclesPage() {
  const router = useRouter();

  const [authorized, setAuthorized] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);

  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Modal / Form state for Add/Edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    type: "SUV",
    plate_no: "",
    price_per_day: "",
    seats: "5",
    fuel: "Petrol",
    transmission: "Manual",
    image: "",
    status: "AVAILABLE",
    odometer_km: "0",
    service_interval_km: "10000",
    last_service_km: "0"
  });

  // Verify Admin Security Credentials
  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await fetch("/api/auth/me");
        if (!res.ok) {
          router.push("/login?error=Admin authorization required");
          return;
        }
        const data = await res.json();
        if (data.success && data.user && data.user.role === "ADMIN") {
          setAuthorized(true);
        } else {
          router.push("/login?error=Admin access required");
        }
      } catch (err) {
        router.push("/login?error=Admin authentication error");
      } finally {
        setAuthLoading(false);
      }
    }
    checkAuth();
  }, [router]);

  const fetchVehicles = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/vehicles");
      const data = await res.json();
      if (data.success) {
        setVehicles(data.vehicles);
      } else {
        setError(data.message || "Failed to load vehicles.");
      }
    } catch (err) {
      setError("An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authorized) {
      fetchVehicles();
    }
  }, [authorized]);

  const handleOpenAddModal = () => {
    setEditingVehicle(null);
    setFormData({
      name: "",
      type: "SUV",
      plate_no: "",
      price_per_day: "",
      seats: "5",
      fuel: "Petrol",
      transmission: "Manual",
      image: "",
      status: "AVAILABLE",
      odometer_km: "0",
      service_interval_km: "10000",
      last_service_km: "0"
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (v) => {
    setEditingVehicle(v);
    setFormData({
      name: v.name || "",
      type: v.type || "SUV",
      plate_no: v.plate_no || "",
      price_per_day: v.price_per_day || "",
      seats: String(v.seats || 5),
      fuel: v.fuel || "Petrol",
      transmission: v.transmission || "Manual",
      image: v.image || "",
      status: v.status || "AVAILABLE",
      odometer_km: String(v.odometer_km || 0),
      service_interval_km: String(v.service_interval_km || 10000),
      last_service_km: String(v.last_service_km || 0)
    });
    setIsModalOpen(true);
  };

  const handleFormChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!formData.name || !formData.type || !formData.plate_no || !formData.price_per_day) {
      setError("Please fill in all required fields (Name, Type, Plate No, Price).");
      return;
    }

    try {
      const method = editingVehicle ? "PUT" : "POST";
      const url = editingVehicle ? `/api/vehicles/${editingVehicle.id}` : "/api/vehicles";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.message || "Failed to save vehicle.");
        return;
      }

      setSuccess(editingVehicle ? "Vehicle updated successfully!" : "Vehicle added successfully!");
      setIsModalOpen(false);
      fetchVehicles();
    } catch (err) {
      setError("Failed to process request.");
    }
  };

  const handleDelete = async (vId) => {
    if (!confirm("Are you sure you want to delete this vehicle?")) return;
    setError("");
    setSuccess("");
    try {
      const res = await fetch(`/api/vehicles/${vId}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.message || "Failed to delete vehicle.");
        return;
      }
      setSuccess("Vehicle deleted successfully!");
      fetchVehicles();
    } catch (err) {
      setError("Error deleting vehicle.");
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#F5F7FC] flex items-center justify-center py-16 text-center text-[#71819E] text-sm font-semibold">
        Verifying admin security authorization...
      </div>
    );
  }

  if (!authorized) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#F5F7FC] text-[#0B1733] py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Navigation / Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 pb-6 border-b border-[#E2E8F2]">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-[#0B1733] bg-white px-3 py-1 rounded-md mb-2 w-fit border border-[#E2E8F2] shadow-2xs">
              <ShieldCheck className="h-3.5 w-3.5 text-[#FF851B]" /> Admin Portal
            </div>
            <h1 className="text-3xl font-extrabold text-[#0B1733] tracking-tight uppercase">
              Fleet & Vehicle Management
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/admin"
              className="flex items-center gap-2 bg-white hover:bg-[#F5F7FC] text-[#0B1733] font-bold py-2.5 px-4 rounded-xl text-xs transition-colors border border-[#E2E8F2] shadow-2xs"
            >
              <ArrowLeft className="h-4 w-4" /> Admin Dashboard
            </Link>

            <button
              onClick={handleOpenAddModal}
              className="flex items-center gap-2 bg-[#0B1733] hover:bg-[#16264C] text-white font-bold py-2.5 px-4 rounded-xl text-xs transition-colors shadow-xs uppercase tracking-wider"
            >
              <Plus className="h-4 w-4 text-[#FF851B]" /> Add New Vehicle
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-6 bg-rose-50 border border-rose-200 text-rose-800 px-4 py-3 rounded-xl text-xs flex items-center justify-between font-semibold">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
            <button
              onClick={fetchVehicles}
              className="text-xs font-bold text-rose-900 bg-rose-100 hover:bg-rose-200 px-2.5 py-1 rounded-lg transition-colors shrink-0"
            >
              Retry
            </button>
          </div>
        )}

        {success && (
          <div className="mb-6 bg-white border border-[#E2E8F2] text-[#0B1733] px-4 py-3 rounded-xl text-xs flex items-center gap-2 font-semibold shadow-2xs">
            <CheckCircle className="h-4 w-4 shrink-0 text-[#FF851B]" />
            <span>{success}</span>
          </div>
        )}

        {/* Vehicles Table */}
        <div className="bg-white rounded-2xl border border-[#E2E8F2] shadow-xs overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-[#71819E] text-sm font-semibold">
              Loading vehicles table...
            </div>
          ) : vehicles.length === 0 ? (
            <div className="p-12 text-center">
              <Car className="h-12 w-12 text-[#71819E] mx-auto mb-3" />
              <h3 className="text-base font-bold text-[#0B1733]">No vehicles in fleet</h3>
              <p className="text-xs text-[#71819E] mt-1 mb-4">Click "Add New Vehicle" to add your first vehicle to the fleet.</p>
              <button
                onClick={handleOpenAddModal}
                className="bg-[#0B1733] text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-[#16264C]"
              >
                Add Vehicle
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#F5F7FC] border-b border-[#E2E8F2] text-xs font-bold text-[#71819E] uppercase tracking-wider">
                    <th className="py-3.5 px-4">Vehicle</th>
                    <th className="py-3.5 px-4">Type</th>
                    <th className="py-3.5 px-4">Plate No</th>
                    <th className="py-3.5 px-4">Price/Day</th>
                    <th className="py-3.5 px-4">Specs</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E8F2] text-xs">
                  {vehicles.map((v) => (
                    <tr key={v.id} className="hover:bg-[#F5F7FC]/70 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={v.image || "/images/vehicles/hyundai_creta.jpg"}
                            alt={v.name}
                            className="w-10 h-10 object-cover rounded-xl bg-[#F5F7FC] border border-[#E2E8F2]"
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = "/images/vehicles/hyundai_creta.jpg";
                            }}
                          />
                          <span className="font-bold text-[#0B1733] text-sm">{v.name}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-[#71819E]">{v.type}</td>
                      <td className="py-3.5 px-4 font-mono font-bold text-[#0B1733]">{v.plate_no}</td>
                      <td className="py-3.5 px-4 font-extrabold text-[#0B1733]">
                        ₹{parseFloat(v.price_per_day).toLocaleString()}
                      </td>
                      <td className="py-3.5 px-4 text-[#71819E] font-medium">
                        {v.seats} seats • {v.fuel} • {v.transmission}
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full uppercase border ${
                            v.status === "AVAILABLE"
                              ? "bg-[#0B1733] text-white border-[#0B1733]"
                              : v.status === "RENTED"
                              ? "bg-[#FFF3E8] text-[#0B1733] border-[#FFE2CC]"
                              : "bg-rose-50 text-rose-700 border-rose-200"
                          }`}
                        >
                          {v.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleOpenEditModal(v)}
                            className="p-1.5 text-[#0B1733] hover:bg-[#F5F7FC] rounded-lg transition-colors border border-transparent hover:border-[#E2E8F2]"
                            title="Edit Vehicle"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(v.id)}
                            className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors border border-transparent hover:border-rose-200"
                            title="Delete Vehicle"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Modal for Add / Edit Vehicle */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 bg-[#0B1733]/50 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl max-h-[90vh] overflow-y-auto border border-[#E2E8F2]">
              <h2 className="text-xl font-bold text-[#0B1733] mb-4 pb-3 border-b border-[#E2E8F2]">
                {editingVehicle ? "Edit Vehicle Specification" : "Add New Vehicle to Fleet"}
              </h2>

              <form onSubmit={handleFormSubmit} className="space-y-4 text-xs">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-[#71819E] mb-1">Vehicle Name *</label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleFormChange}
                      required
                      placeholder="e.g. Hyundai Creta"
                      className="w-full bg-[#F5F7FC] border border-[#E2E8F2] rounded-lg px-3 py-2 text-xs font-semibold text-[#0B1733] focus:outline-none focus:ring-2 focus:ring-[#0B1733] focus:bg-white transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#71819E] mb-1">License Plate No *</label>
                    <input
                      type="text"
                      name="plate_no"
                      value={formData.plate_no}
                      onChange={handleFormChange}
                      required
                      placeholder="e.g. KA-01-AB-1234"
                      className="w-full bg-[#F5F7FC] border border-[#E2E8F2] rounded-lg px-3 py-2 text-xs font-mono font-bold text-[#0B1733] focus:outline-none focus:ring-2 focus:ring-[#0B1733] focus:bg-white transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#71819E] mb-1">Type *</label>
                    <select
                      name="type"
                      value={formData.type}
                      onChange={handleFormChange}
                      className="w-full bg-[#F5F7FC] border border-[#E2E8F2] rounded-lg px-3 py-2 text-xs font-semibold text-[#0B1733] focus:outline-none focus:ring-2 focus:ring-[#0B1733] focus:bg-white transition-colors"
                    >
                      <option value="SUV">SUV</option>
                      <option value="Sedan">Sedan</option>
                      <option value="Hatchback">Hatchback</option>
                      <option value="Bike">Bike / Motorcycle</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#71819E] mb-1">Rental Price / Day (₹) *</label>
                    <input
                      type="number"
                      name="price_per_day"
                      value={formData.price_per_day}
                      onChange={handleFormChange}
                      required
                      min="100"
                      step="50"
                      placeholder="e.g. 2500"
                      className="w-full bg-[#F5F7FC] border border-[#E2E8F2] rounded-lg px-3 py-2 text-xs font-bold text-[#0B1733] focus:outline-none focus:ring-2 focus:ring-[#0B1733] focus:bg-white transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#71819E] mb-1">Seating Capacity</label>
                    <input
                      type="number"
                      name="seats"
                      value={formData.seats}
                      onChange={handleFormChange}
                      min="1"
                      max="10"
                      className="w-full bg-[#F5F7FC] border border-[#E2E8F2] rounded-lg px-3 py-2 text-xs font-semibold text-[#0B1733] focus:outline-none focus:ring-2 focus:ring-[#0B1733] focus:bg-white transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#71819E] mb-1">Fuel Type</label>
                    <select
                      name="fuel"
                      value={formData.fuel}
                      onChange={handleFormChange}
                      className="w-full bg-[#F5F7FC] border border-[#E2E8F2] rounded-lg px-3 py-2 text-xs font-semibold text-[#0B1733] focus:outline-none focus:ring-2 focus:ring-[#0B1733] focus:bg-white transition-colors"
                    >
                      <option value="Petrol">Petrol</option>
                      <option value="Diesel">Diesel</option>
                      <option value="Electric">Electric</option>
                      <option value="Hybrid">Hybrid</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#71819E] mb-1">Transmission</label>
                    <select
                      name="transmission"
                      value={formData.transmission}
                      onChange={handleFormChange}
                      className="w-full bg-[#F5F7FC] border border-[#E2E8F2] rounded-lg px-3 py-2 text-xs font-semibold text-[#0B1733] focus:outline-none focus:ring-2 focus:ring-[#0B1733] focus:bg-white transition-colors"
                    >
                      <option value="Manual">Manual</option>
                      <option value="Automatic">Automatic</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#71819E] mb-1">Availability Status</label>
                    <select
                      name="status"
                      value={formData.status}
                      onChange={handleFormChange}
                      className="w-full bg-[#F5F7FC] border border-[#E2E8F2] rounded-lg px-3 py-2 text-xs font-semibold text-[#0B1733] focus:outline-none focus:ring-2 focus:ring-[#0B1733] focus:bg-white transition-colors"
                    >
                      <option value="AVAILABLE">AVAILABLE</option>
                      <option value="RENTED">RENTED</option>
                      <option value="MAINTENANCE">MAINTENANCE</option>
                    </select>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-[#71819E] mb-1">Image URL / Path</label>
                    <input
                      type="text"
                      name="image"
                      value={formData.image}
                      onChange={handleFormChange}
                      placeholder="/images/vehicles/hyundai_creta.jpg"
                      className="w-full bg-[#F5F7FC] border border-[#E2E8F2] rounded-lg px-3 py-2 text-xs font-semibold text-[#0B1733] focus:outline-none focus:ring-2 focus:ring-[#0B1733] focus:bg-white transition-colors"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-[#E2E8F2]">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-[#71819E] hover:bg-[#F5F7FC] transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-[#0B1733] hover:bg-[#16264C] shadow-xs uppercase tracking-wider transition-colors"
                  >
                    {editingVehicle ? "Save Changes" : "Create Vehicle"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
