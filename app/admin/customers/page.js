"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ShieldCheck, UserCheck, UserX, Eye, FileText, CheckCircle, AlertCircle, Search, RefreshCw, ArrowLeft, ExternalLink } from "lucide-react";

export default function AdminCustomersPage() {
  const router = useRouter();

  const [authorized, setAuthorized] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);

  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [search, setSearch] = useState("");

  // Modal State for Viewing Licence Document & OCR Data
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

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

  const fetchCustomers = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/customers");
      const data = await res.json();
      if (data.success) {
        setCustomers(data.customers);
      } else {
        setError(data.message || "Failed to load customer KYC records.");
      }
    } catch (err) {
      setError("An error occurred while fetching customers.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authorized) {
      fetchCustomers();
    }
  }, [authorized]);

  const handleUpdateKycStatus = async (customerId, newStatus, reason = "") => {
    setError("");
    setSuccess("");
    try {
      const res = await fetch(`/api/admin/customers/${customerId}/kyc`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus, reason })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.message || "Failed to update KYC status.");
        return;
      }

      setSuccess(`Customer KYC status updated to ${newStatus}`);
      setIsModalOpen(false);
      setSelectedCustomer(null);
      fetchCustomers();
    } catch (err) {
      setError("Error updating customer KYC status.");
    }
  };

  const calculateAge = (dobStr) => {
    if (!dobStr) return "N/A";
    const dob = new Date(dobStr);
    if (isNaN(dob.getTime())) return "N/A";
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const m = today.getMonth() - dob.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
      age--;
    }
    return `${age} yrs`;
  };

  const filteredCustomers = customers.filter(
    (c) =>
      c.name?.toLowerCase().includes(search.toLowerCase()) ||
      c.email?.toLowerCase().includes(search.toLowerCase()) ||
      c.license_no?.toLowerCase().includes(search.toLowerCase())
  );

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
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 pb-6 border-b border-[#E2E8F2]">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-[#0B1733] bg-white px-3 py-1 rounded-md mb-2 w-fit border border-[#E2E8F2] shadow-2xs">
              <ShieldCheck className="h-3.5 w-3.5 text-[#FF851B]" /> Admin Portal
            </div>
            <h1 className="text-3xl font-extrabold text-[#0B1733] tracking-tight uppercase">
              Customer KYC & Licence Review
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/admin"
              className="flex items-center gap-2 bg-white hover:bg-[#F5F7FC] text-[#0B1733] font-bold py-2.5 px-4 rounded-xl text-xs transition-colors border border-[#E2E8F2] shadow-2xs"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Admin Dashboard
            </Link>
            <button
              onClick={fetchCustomers}
              className="flex items-center gap-2 bg-white hover:bg-[#F5F7FC] text-[#0B1733] font-bold py-2.5 px-4 rounded-xl text-xs transition-colors border border-[#E2E8F2] shadow-2xs"
            >
              <RefreshCw className="h-3.5 w-3.5 text-[#FF851B]" /> Refresh List
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
              onClick={fetchCustomers}
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

        {/* Search Input */}
        <div className="mb-6 max-w-md">
          <div className="relative">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by customer name, email, or licence no..."
              className="w-full bg-white border border-[#E2E8F2] rounded-xl pl-10 pr-4 py-2 text-xs font-semibold text-[#0B1733] focus:outline-none focus:ring-2 focus:ring-[#0B1733] shadow-2xs placeholder-[#71819E]"
            />
            <Search className="h-4 w-4 absolute left-3 top-2.5 text-[#71819E]" />
          </div>
        </div>

        {/* Customers Table */}
        <div className="bg-white rounded-2xl border border-[#E2E8F2] shadow-xs overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-[#71819E] text-sm font-semibold">
              Loading customers database...
            </div>
          ) : filteredCustomers.length === 0 ? (
            <div className="p-12 text-center text-[#71819E] text-sm font-semibold">
              No customer KYC records found matching your filter.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#F5F7FC] border-b border-[#E2E8F2] text-xs font-bold text-[#71819E] uppercase tracking-wider">
                    <th className="py-3.5 px-4">Customer</th>
                    <th className="py-3.5 px-4">Role</th>
                    <th className="py-3.5 px-4">Licence Number</th>
                    <th className="py-3.5 px-4">DOB / Age</th>
                    <th className="py-3.5 px-4">KYC Status</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E8F2] text-xs">
                  {filteredCustomers.map((c) => (
                    <tr key={c.id} className="hover:bg-[#F5F7FC]/70 transition-colors">
                      <td className="py-3.5 px-4">
                        <span className="font-bold text-[#0B1733] block text-sm">{c.name}</span>
                        <span className="text-[#71819E]">{c.email}</span>
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-[#71819E]">{c.role}</td>
                      <td className="py-3.5 px-4 font-mono font-bold text-[#0B1733]">
                        {c.license_no || "Not submitted"}
                      </td>
                      <td className="py-3.5 px-4 text-[#71819E] font-semibold">
                        {c.license_dob ? (
                          <span>
                            {new Date(c.license_dob).toLocaleDateString()} ({calculateAge(c.license_dob)})
                          </span>
                        ) : (
                          "N/A"
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full uppercase border ${c.kyc_status === "VERIFIED"
                              ? "bg-[#0B1733] text-white border-[#0B1733]"
                              : c.kyc_status === "PENDING"
                                ? "bg-[#FFF3E8] text-[#0B1733] border border-[#FFE2CC]"
                                : c.kyc_status === "REJECTED"
                                  ? "bg-rose-50 text-rose-700 border border-rose-200"
                                  : "bg-[#F5F7FC] text-[#71819E] border border-[#E2E8F2]"
                            }`}
                        >
                          {c.kyc_status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => {
                              setSelectedCustomer(c);
                              setIsModalOpen(true);
                            }}
                            className="flex items-center gap-1 text-xs font-bold text-[#0B1733] hover:text-white bg-[#F5F7FC] hover:bg-[#0B1733] px-2.5 py-1.5 rounded-lg border border-[#E2E8F2] transition-colors"
                          >
                            <Eye className="h-3.5 w-3.5 text-[#FF851B]" /> Review
                          </button>
                          <button
                            onClick={() => handleUpdateKycStatus(c.id, "VERIFIED")}
                            className="p-1.5 text-[#0B1733] hover:bg-[#F5F7FC] rounded-lg transition-colors border border-transparent hover:border-[#E2E8F2]"
                            title="Approve"
                          >
                            <UserCheck className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => {
                              const reason = prompt("Enter rejection reason:", "Licence image blurry or details unreadable");
                              if (reason) handleUpdateKycStatus(c.id, "REJECTED", reason);
                            }}
                            className="p-1.5 text-rose-700 hover:bg-rose-50 rounded-lg transition-colors border border-transparent hover:border-rose-200"
                            title="Reject"
                          >
                            <UserX className="h-4 w-4" />
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

        {/* View Licence & OCR Modal */}
        {isModalOpen && selectedCustomer && (
          <div className="fixed inset-0 z-50 bg-[#0B1733]/50 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl max-h-[90vh] overflow-y-auto border border-[#E2E8F2]">
              <h2 className="text-xl font-bold text-[#0B1733] mb-4 pb-3 border-b border-[#E2E8F2] flex items-center justify-between">
                <span>KYC Review — {selectedCustomer.name}</span>
                <span
                  className={`text-xs font-extrabold px-3 py-1 rounded-full uppercase border ${selectedCustomer.kyc_status === "VERIFIED"
                      ? "bg-[#0B1733] text-white border-[#0B1733]"
                      : selectedCustomer.kyc_status === "PENDING"
                        ? "bg-[#FFF3E8] text-[#0B1733] border border-[#FFE2CC]"
                        : selectedCustomer.kyc_status === "REJECTED"
                          ? "bg-rose-50 text-rose-700 border border-rose-200"
                          : "bg-[#F5F7FC] text-[#71819E] border border-[#E2E8F2]"
                    }`}
                >
                  {selectedCustomer.kyc_status}
                </span>
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Document Image or PDF Viewer */}
                <div>
                  <h3 className="text-xs font-bold text-[#71819E] uppercase tracking-wider mb-2 flex items-center justify-between">
                    <span>Uploaded Document</span>
                    {selectedCustomer.license_image && (
                      <a
                        href={`/api/kyc/document?userId=${selectedCustomer.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#0B1733] hover:text-[#FF851B] flex items-center gap-1 font-bold text-[11px] transition-colors"
                      >
                        Open Full Document <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </h3>
                  <div className="bg-[#F5F7FC] rounded-xl overflow-hidden border border-[#E2E8F2] h-64 flex items-center justify-center">

                    {selectedCustomer.license_image ? (
                      <iframe
                        src={`/api/kyc/document?userId=${selectedCustomer.id}`}
                        title="Driving Licence Document"
                        className="w-full h-full border-0"
                      />
                    ) : (
                      <span className="text-[#71819E] text-xs font-medium">
                        No document uploaded
                      </span>
                    )}

                  </div>
                </div>

                {/* Extracted Details */}
                <div className="space-y-3 text-xs text-[#0B1733]">
                  <h3 className="text-xs font-bold text-[#71819E] uppercase tracking-wider mb-2">
                    Document & OCR Specs
                  </h3>
                  <div className="bg-[#F5F7FC] p-3.5 rounded-xl border border-[#E2E8F2] space-y-2 text-xs">
                    <div>
                      <span className="font-semibold text-[#71819E]">Name: </span>
                      <span className={selectedCustomer.license_name ? "font-bold text-[#0B1733]" : "text-[#71819E] font-medium"}>
                        {selectedCustomer.license_name ? `Extracted (${selectedCustomer.license_name})` : "Not detected"}
                      </span>
                    </div>
                    <div>
                      <span className="font-semibold text-[#71819E]">DL Number: </span>
                      <span className={selectedCustomer.license_no ? "font-mono font-bold text-[#0B1733]" : "text-[#71819E] font-medium"}>
                        {selectedCustomer.license_no ? `Extracted (${selectedCustomer.license_no})` : "Not detected"}
                      </span>
                    </div>
                    <div>
                      <span className="font-semibold text-[#71819E]">DOB: </span>
                      <span className={selectedCustomer.license_dob ? "font-bold text-[#0B1733]" : "text-[#71819E] font-medium"}>
                        {selectedCustomer.license_dob ? `Extracted (${new Date(selectedCustomer.license_dob).toLocaleDateString()})` : "Not detected"}
                      </span>
                    </div>
                    <div>
                      <span className="font-semibold text-[#71819E]">Valid From (Issue): </span>
                      <span className={selectedCustomer.license_valid_from ? "font-bold text-[#0B1733]" : "text-[#71819E]"}>
                        {selectedCustomer.license_valid_from ? `Extracted (${new Date(selectedCustomer.license_valid_from).toLocaleDateString()})` : "Not detected"}
                      </span>
                    </div>
                    <div>
                      <span className="font-semibold text-[#71819E]">Valid To (Expiry): </span>
                      <span className={selectedCustomer.license_valid_to ? "font-bold text-[#0B1733]" : "text-[#71819E]"}>
                        {selectedCustomer.license_valid_to ? `Extracted (${new Date(selectedCustomer.license_valid_to).toLocaleDateString()})` : "Not detected"}
                      </span>
                    </div>
                    {selectedCustomer.kyc_reason && (
                      <div className="text-rose-700 font-bold pt-2 border-t border-[#E2E8F2]">
                        Rejection Reason: {selectedCustomer.kyc_reason}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 pt-6 mt-6 border-t border-[#E2E8F2]">
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-[#71819E] hover:bg-[#F5F7FC] transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={() => handleUpdateKycStatus(selectedCustomer.id, "REJECTED", "Document blurry or invalid")}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-rose-700 hover:bg-rose-800 shadow-xs uppercase tracking-wider transition-colors"
                >
                  Reject KYC
                </button>
                <button
                  onClick={() => handleUpdateKycStatus(selectedCustomer.id, "VERIFIED")}
                  className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-[#0B1733] hover:bg-[#16264C] shadow-xs uppercase tracking-wider transition-colors"
                >
                  Approve & Verify KYC
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
