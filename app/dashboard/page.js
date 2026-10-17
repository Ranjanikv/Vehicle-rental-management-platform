"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  User,
  ShieldCheck,
  ShieldAlert,
  Upload,
  CheckCircle2,
  AlertCircle,
  FileText,
  Calendar,
  Car,
  FileCode,
  Edit3,
  Save,
  ArrowRight
} from "lucide-react";

export default function CustomerDashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Licence Upload state
  const [selectedFile, setSelectedFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [isPdf, setIsPdf] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadMessage, setUploadMessage] = useState("");
  const [uploadError, setUploadError] = useState("");

  // Extracted Details & Manual Review Form state
  const [reviewData, setReviewData] = useState({
    license_no: "",
    license_name: "",
    license_dob: "",
    license_valid_from: "",
    license_valid_to: ""
  });
  const [reviewSuccess, setReviewSuccess] = useState("");
  const [reviewError, setReviewError] = useState("");
  const [savingDetails, setSavingDetails] = useState(false);
  const [isOcrExtracted, setIsOcrExtracted] = useState(false);

  // Bookings list state
  const [bookings, setBookings] = useState([]);
  const [bookingsLoading, setBookingsLoading] = useState(true);

  const fetchUserData = async () => {
    try {
      const res = await fetch("/api/auth/me");
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setUser(data.user);
          // Initialize review form with existing user records
          setReviewData({
            license_no: data.user.license_no || "",
            license_name: data.user.license_name || data.user.name || "",
            license_dob: data.user.license_dob ? data.user.license_dob.split("T")[0] : "",
            license_valid_from: data.user.license_valid_from ? data.user.license_valid_from.split("T")[0] : "",
            license_valid_to: data.user.license_valid_to ? data.user.license_valid_to.split("T")[0] : ""
          });
        } else {
          router.push("/login");
        }
      } else {
        router.push("/login");
      }
    } catch (err) {
      router.push("/login");
    } finally {
      setLoading(false);
    }
  };

  const fetchUserBookings = async () => {
    try {
      const res = await fetch("/api/bookings");
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setBookings(data.bookings || []);
        }
      }
    } catch (err) {
      console.error("Failed to load user bookings:", err);
    } finally {
      setBookingsLoading(false);
    }
  };

  useEffect(() => {
    fetchUserData();
    fetchUserBookings();
  }, [router]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const ext = file.name.split(".").pop().toLowerCase();
      const allowed = ["jpg", "jpeg", "png", "webp", "pdf"];

      if (!allowed.includes(ext)) {
        setUploadError("Invalid file type. Supported formats: JPG, JPEG, PNG, PDF.");
        setSelectedFile(null);
        setFilePreview(null);
        return;
      }

      setSelectedFile(file);
      setIsPdf(file.type === "application/pdf" || ext === "pdf");
      setFilePreview(URL.createObjectURL(file));
      setUploadError("");
      setUploadMessage("");
      setReviewSuccess("");
      setReviewError("");
    }
  };

  const handleUploadLicence = async (e) => {
    e.preventDefault();
    if (!selectedFile) {
      setUploadError("Please select a driving licence image or PDF to upload.");
      return;
    }

    setUploading(true);
    setUploadError("");
    setUploadMessage("");
    setReviewSuccess("");
    setReviewError("");

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);

      const res = await fetch("/api/kyc/upload", {
        method: "POST",
        body: formData
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setUploadError(data.message || "Failed to process licence document.");
        return;
      }

      setUploadMessage(data.message);
      setIsOcrExtracted(true);
      setSelectedFile(null);

      // Auto-populate the editable review form with OCR results
      if (data.ocr) {
        setReviewData({
          license_no: data.ocr.licenseNo || "",
          license_name: data.ocr.extractedName || user?.name || "",
          license_dob: data.ocr.dob || "",
          license_valid_from: data.ocr.validFrom || "",
          license_valid_to: data.ocr.validTo || ""
        });
      }

      await fetchUserData();
    } catch (err) {
      console.error("Upload handler exception:", err);
      setUploadError("Network error occurred during upload. Please check your connection and try again.");
    } finally {
      setUploading(false);
    }
  };

  const handleReviewChange = (e) => {
    const { name, value } = e.target;
    setReviewData((prev) => ({
      ...prev,
      [name]: value
    }));
    setReviewError("");
    setReviewSuccess("");
  };

  const handleSaveConfirmedDetails = async (e) => {
    e.preventDefault();
    setReviewError("");
    setReviewSuccess("");

    if (!reviewData.license_no.trim()) {
      setReviewError("Please enter your driving licence number.");
      return;
    }

    // Check date combinations
    if (reviewData.license_valid_from && reviewData.license_valid_to) {
      if (reviewData.license_valid_from === reviewData.license_valid_to) {
        setReviewError("Issue date and Expiry date cannot be identical. Please verify with your document.");
        return;
      }
      if (new Date(reviewData.license_valid_to) <= new Date(reviewData.license_valid_from)) {
        setReviewError("Expiry date must be strictly after the issue date.");
        return;
      }
    }

    if (reviewData.license_dob) {
      const dobDate = new Date(reviewData.license_dob);
      const today = new Date();
      let age = today.getFullYear() - dobDate.getFullYear();
      const m = today.getMonth() - dobDate.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < dobDate.getDate())) {
        age--;
      }
      if (age < 18) {
        setReviewError("Driving licence holder must be at least 18 years of age.");
        return;
      }
    }

    setSavingDetails(true);

    try {
      const res = await fetch("/api/kyc/details", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(reviewData)
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setReviewError(data.message || "Failed to update licence details.");
        return;
      }

      setReviewSuccess("Licence details successfully confirmed and updated. Awaiting administrator verification.");
      await fetchUserData();
    } catch (err) {
      setReviewError("Network error while saving details. Please try again.");
    } finally {
      setSavingDetails(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center text-[#71819E] text-sm font-semibold">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#0B1733] border-t-transparent mx-auto mb-3" />
        Loading customer dashboard...
      </div>
    );
  }

  // Determine date conflict warning in review form
  const hasIdenticalDates =
    reviewData.license_valid_from &&
    reviewData.license_valid_to &&
    reviewData.license_valid_from === reviewData.license_valid_to;

  const hasInvertedDates =
    reviewData.license_valid_from &&
    reviewData.license_valid_to &&
    new Date(reviewData.license_valid_to) <= new Date(reviewData.license_valid_from);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 bg-[#F5F7FC] min-h-screen">
      {/* Dashboard Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 pb-6 border-b border-[#E2E8F2]">
        <div>
          <h1 className="text-3xl font-extrabold text-[#0B1733] tracking-tight uppercase">
            Customer Dashboard
          </h1>
          <p className="text-[#71819E] text-sm mt-1">
            Welcome back, <span className="font-bold text-[#0B1733]">{user?.name}</span> ({user?.email})
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-white px-3.5 py-1.5 rounded-xl border border-[#E2E8F2] text-xs font-semibold text-[#0B1733] shadow-xs">
            <User className="h-4 w-4 text-[#FF851B]" />
            <span>Role: {user?.role}</span>
          </div>

          <div
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border text-xs font-bold uppercase tracking-wider shadow-xs ${
              user?.kyc_status === "VERIFIED"
                ? "bg-[#0B1733] text-white border-[#0B1733]"
                : user?.kyc_status === "PENDING"
                ? "bg-white text-[#71819E] border-[#E2E8F2]"
                : user?.kyc_status === "REJECTED"
                ? "bg-rose-50 text-rose-800 border-rose-200"
                : "bg-white text-[#0B1733] border-[#E2E8F2]"
            }`}
          >
            {user?.kyc_status === "VERIFIED" ? (
              <ShieldCheck className="h-4 w-4 text-[#FF851B]" />
            ) : (
              <ShieldAlert className="h-4 w-4 text-[#71819E]" />
            )}
            <span>KYC {user?.kyc_status}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
        {/* Driving Licence Verification & Review Column */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl border border-[#E2E8F2] p-6 shadow-[0_2px_12px_rgba(11,23,51,0.04)]">
            <div className="flex items-center justify-between pb-4 border-b border-[#E2E8F2] mb-6">
              <div className="flex items-center gap-2.5">
                <div className="bg-[#F5F7FC] p-2 rounded-xl text-[#0B1733] border border-[#E2E8F2]">
                  <FileText className="h-5 w-5 text-[#FF851B]" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-[#0B1733]">Driving Licence Verification</h3>
                  <p className="text-xs text-[#71819E]">Document OCR scanning with manual review & correction</p>
                </div>
              </div>

              <span
                className={`text-xs font-extrabold px-3 py-1 rounded-full uppercase border ${
                  user?.kyc_status === "VERIFIED"
                    ? "bg-[#0B1733] text-white border-[#0B1733]"
                    : user?.kyc_status === "PENDING"
                    ? "bg-[#F5F7FC] text-[#71819E] border-[#E2E8F2]"
                    : user?.kyc_status === "REJECTED"
                    ? "bg-rose-50 text-rose-800 border-rose-200"
                    : "bg-[#F5F7FC] text-[#0B1733] border-[#E2E8F2]"
                }`}
              >
                Status: {user?.kyc_status}
              </span>
            </div>

            {user?.kyc_status === "REJECTED" && (
              <div className="mb-6 bg-rose-50 border border-rose-200 text-rose-800 p-4 rounded-xl text-xs flex items-start gap-2">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-rose-600" />
                <div>
                  <span className="font-bold">Licence Verification Rejected:</span>{" "}
                  {user?.kyc_reason || "Document blurred or details unreadable. Please upload a clearer image or PDF."}
                </div>
              </div>
            )}

            {user?.kyc_status === "VERIFIED" ? (
              <div className="bg-[#F5F7FC] border border-[#E2E8F2] rounded-2xl p-6 text-center space-y-3">
                <ShieldCheck className="h-12 w-12 text-[#FF851B] mx-auto" />
                <h4 className="text-lg font-extrabold text-[#0B1733]">Driving Licence Verified & Approved</h4>
                <p className="text-xs text-[#71819E] max-w-md mx-auto">
                  Your licence (<span className="font-mono font-bold text-[#0B1733]">{user?.license_no}</span>) is fully verified. You are eligible to rent any available vehicle.
                </p>
                <div className="pt-2">
                  <Link
                    href="/vehicles"
                    className="inline-flex items-center gap-2 bg-[#0B1733] hover:bg-[#16264C] text-white font-bold py-2.5 px-5 rounded-xl text-xs uppercase tracking-wider transition-colors shadow-xs"
                  >
                    Browse Vehicles Fleet & Book <ArrowRight className="h-4 w-4 text-[#FF851B]" />
                  </Link>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {uploadError && (
                  <div className="bg-rose-50 border border-rose-200 text-rose-800 p-3.5 rounded-xl text-xs flex items-center gap-2 font-semibold">
                    <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
                    <span>{uploadError}</span>
                  </div>
                )}

                {uploadMessage && (
                  <div className="bg-[#F5F7FC] border border-[#E2E8F2] text-[#0B1733] p-3.5 rounded-xl text-xs flex items-center gap-2 font-semibold">
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-[#FF851B]" />
                    <span>{uploadMessage}</span>
                  </div>
                )}

                {/* Upload Box */}
                <form onSubmit={handleUploadLicence} className="space-y-4">
                  <div className="border-2 border-dashed border-[#E2E8F2] rounded-2xl p-6 text-center hover:border-[#0B1733] transition-colors bg-[#F5F7FC]">
                    <Upload className="h-8 w-8 text-[#71819E] mx-auto mb-2" />
                    <label className="block text-xs font-bold text-[#0B1733] mb-1 cursor-pointer">
                      <span className="underline">Click to select driving licence file</span> or drag and drop
                    </label>

                    {/* Explicit format requirement */}
                    <span className="text-xs font-bold text-[#71819E] bg-white px-3 py-1 rounded-full border border-[#E2E8F2] inline-block my-2">
                      Supported formats: JPG, JPEG, PNG, PDF
                    </span>

                    <input
                      type="file"
                      accept=".jpg,.jpeg,.png,.webp,.pdf,image/jpeg,image/png,image/webp,application/pdf"
                      onChange={handleFileChange}
                      className="hidden"
                      id="licence-file-input"
                    />

                    <div className="mt-2">
                      <label
                        htmlFor="licence-file-input"
                        className="inline-flex items-center gap-2 bg-[#0B1733] hover:bg-[#16264C] text-white text-xs font-bold py-2 px-4 rounded-xl cursor-pointer transition-colors shadow-xs uppercase tracking-wider"
                      >
                        Browse File (JPG, PNG, PDF)
                      </label>
                    </div>

                    {selectedFile && (
                      <div className="mt-4 p-3 bg-white rounded-xl border border-[#E2E8F2] text-left text-xs flex items-center justify-between shadow-xs">
                        <div className="flex items-center gap-2 truncate">
                          {isPdf ? (
                            <FileCode className="h-4 w-4 text-[#FF851B] shrink-0" />
                          ) : (
                            <FileText className="h-4 w-4 text-[#0B1733] shrink-0" />
                          )}
                          <span className="font-semibold text-[#0B1733] truncate">{selectedFile.name}</span>
                        </div>
                        <span className="text-[#71819E] text-[10px] shrink-0 ml-2 font-mono">
                          {(selectedFile.size / 1024).toFixed(1)} KB
                        </span>
                      </div>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={uploading || !selectedFile}
                    className="w-full bg-[#0B1733] hover:bg-[#16264C] text-white font-bold py-3 px-4 rounded-xl text-xs transition-colors shadow-xs disabled:opacity-50 flex items-center justify-center gap-2 uppercase tracking-wider"
                  >
                    {uploading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                        Scanning Document & Running OCR...
                      </>
                    ) : (
                      "UPLOAD & SCAN LICENCE DOCUMENT"
                    )}
                  </button>
                </form>

                {/* Manual Review & Correction Section */}
                {(user?.license_image || isOcrExtracted || user?.license_no) && (
                  <div className="pt-6 border-t border-[#E2E8F2] space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-bold text-[#0B1733] flex items-center gap-2">
                        <Edit3 className="h-4 w-4 text-[#FF851B]" />
                        Review & Confirm Licence Information
                      </h4>
                      <span className="text-[11px] font-semibold text-[#71819E] bg-[#F5F7FC] px-2.5 py-0.5 rounded-full border border-[#E2E8F2]">
                        Editable Correction
                      </span>
                    </div>

                    <p className="text-xs text-[#71819E]">
                      Please check the extracted dates and details below. If any date or number was misread, edit it directly and click <strong>Save & Confirm</strong>.
                    </p>

                    {reviewSuccess && (
                      <div className="bg-[#F5F7FC] border border-[#E2E8F2] text-[#0B1733] p-3 rounded-xl text-xs flex items-center gap-2 font-semibold">
                        <CheckCircle2 className="h-4 w-4 shrink-0 text-[#FF851B]" />
                        <span>{reviewSuccess}</span>
                      </div>
                    )}

                    {reviewError && (
                      <div className="bg-rose-50 border border-rose-200 text-rose-800 p-3 rounded-xl text-xs flex items-center gap-2 font-semibold">
                        <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
                        <span>{reviewError}</span>
                      </div>
                    )}

                    {hasIdenticalDates && (
                      <div className="bg-rose-50 border border-rose-200 text-rose-800 p-3 rounded-xl text-xs flex items-center gap-2 font-semibold">
                        <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
                        <span>Issue Date and Expiry Date cannot be identical. Please verify with your document.</span>
                      </div>
                    )}

                    {hasInvertedDates && (
                      <div className="bg-rose-50 border border-rose-200 text-rose-800 p-3 rounded-xl text-xs flex items-center gap-2 font-semibold">
                        <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
                        <span>Expiry Date must be after the Issue Date.</span>
                      </div>
                    )}

                    <form onSubmit={handleSaveConfirmedDetails} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Licence Number */}
                      <div>
                        <label className="block text-xs font-bold text-[#71819E] mb-1">
                          Driving Licence Number
                        </label>
                        <input
                          type="text"
                          name="license_no"
                          value={reviewData.license_no}
                          onChange={handleReviewChange}
                          placeholder="e.g. KA-01-20210004567"
                          className="w-full bg-[#F5F7FC] border border-[#E2E8F2] rounded-lg px-3 py-2 text-xs font-mono font-bold text-[#0B1733] focus:outline-none focus:ring-2 focus:ring-[#0B1733]"
                        />
                      </div>

                      {/* Full Name on Licence */}
                      <div>
                        <label className="block text-xs font-bold text-[#71819E] mb-1">
                          Full Name as on Licence
                        </label>
                        <input
                          type="text"
                          name="license_name"
                          value={reviewData.license_name}
                          onChange={handleReviewChange}
                          placeholder="Full Name"
                          className="w-full bg-[#F5F7FC] border border-[#E2E8F2] rounded-lg px-3 py-2 text-xs font-semibold text-[#0B1733] focus:outline-none focus:ring-2 focus:ring-[#0B1733]"
                        />
                      </div>

                      {/* Date of Birth */}
                      <div>
                        <label className="block text-xs font-bold text-[#71819E] mb-1">
                          Date of Birth (DOB)
                        </label>
                        <input
                          type="date"
                          name="license_dob"
                          value={reviewData.license_dob}
                          onChange={handleReviewChange}
                          className="w-full bg-[#F5F7FC] border border-[#E2E8F2] rounded-lg px-3 py-2 text-xs font-semibold text-[#0B1733] focus:outline-none focus:ring-2 focus:ring-[#0B1733]"
                        />
                      </div>

                      {/* Issue Date / Valid From */}
                      <div>
                        <label className="block text-xs font-bold text-[#71819E] mb-1">
                          Licence Issue Date (Valid From)
                        </label>
                        <input
                          type="date"
                          name="license_valid_from"
                          value={reviewData.license_valid_from}
                          onChange={handleReviewChange}
                          className="w-full bg-[#F5F7FC] border border-[#E2E8F2] rounded-lg px-3 py-2 text-xs font-semibold text-[#0B1733] focus:outline-none focus:ring-2 focus:ring-[#0B1733]"
                        />
                      </div>

                      {/* Expiry Date / Valid To */}
                      <div className="md:col-span-2">
                        <label className="block text-xs font-bold text-[#71819E] mb-1">
                          Licence Expiry Date (Valid To)
                        </label>
                        <input
                          type="date"
                          name="license_valid_to"
                          value={reviewData.license_valid_to}
                          onChange={handleReviewChange}
                          className="w-full bg-[#F5F7FC] border border-[#E2E8F2] rounded-lg px-3 py-2 text-xs font-semibold text-[#0B1733] focus:outline-none focus:ring-2 focus:ring-[#0B1733]"
                        />
                      </div>

                      <div className="md:col-span-2 pt-2">
                        <button
                          type="submit"
                          disabled={savingDetails || hasIdenticalDates || hasInvertedDates}
                          className="w-full bg-[#0B1733] hover:bg-[#16264C] text-white font-bold py-2.5 px-4 rounded-xl text-xs transition-colors shadow-xs disabled:opacity-50 flex items-center justify-center gap-2 uppercase tracking-wider"
                        >
                          {savingDetails ? (
                            <>
                              <div className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-white border-t-transparent" />
                              Saving Confirmed Details...
                            </>
                          ) : (
                            <>
                              <Save className="h-4 w-4 text-[#FF851B]" />
                              Save & Confirm Licence Details
                            </>
                          )}
                        </button>
                      </div>
                    </form>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Customer's Recent Bookings Card */}
          <div className="bg-white rounded-2xl border border-[#E2E8F2] p-6 shadow-[0_2px_12px_rgba(11,23,51,0.04)]">
            <div className="flex items-center justify-between pb-4 border-b border-[#E2E8F2] mb-4">
              <h3 className="text-base font-bold text-[#0B1733] flex items-center gap-2">
                <Calendar className="h-4 w-4 text-[#FF851B]" />
                My Vehicle Reservations
              </h3>
              <Link
                href="/bookings"
                className="text-xs font-bold text-[#0B1733] hover:text-[#FF851B] transition-colors"
              >
                View All
              </Link>
            </div>

            {bookingsLoading ? (
              <div className="text-center py-6 text-xs text-[#71819E]">Loading reservations...</div>
            ) : bookings.length === 0 ? (
              <div className="text-center py-8 text-[#71819E] space-y-2">
                <Car className="h-8 w-8 text-[#71819E] mx-auto" />
                <p className="text-xs">You have no active vehicle reservations yet.</p>
                <Link
                  href="/vehicles"
                  className="inline-block text-xs font-bold text-[#0B1733] hover:text-[#FF851B]"
                >
                  Explore Available Fleet &rarr;
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {bookings.slice(0, 3).map((b) => (
                  <div
                    key={b.id}
                    className="p-3.5 bg-[#F5F7FC] rounded-xl border border-[#E2E8F2] flex flex-col sm:flex-row justify-between sm:items-center gap-3 text-xs"
                  >
                    <div>
                      <div className="font-extrabold text-[#0B1733]">{b.vehicle_name} ({b.plate_no})</div>
                      <div className="text-[#71819E] text-[11px] mt-0.5">
                        {b.start_date?.split("T")[0]} &rarr; {b.end_date?.split("T")[0]}
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase border bg-white text-[#0B1733] border-[#E2E8F2]">
                        {b.status}
                      </span>
                      <Link
                        href={`/bookings/${b.id}`}
                        className="bg-[#0B1733] hover:bg-[#16264C] text-white font-bold px-3 py-1.5 rounded-lg text-[11px] transition-colors shadow-xs"
                      >
                        Details
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Profile Card & Action Sidebar */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-[#E2E8F2] p-6 shadow-[0_2px_12px_rgba(11,23,51,0.04)]">
            <h3 className="font-bold text-[#0B1733] text-base mb-4 pb-3 border-b border-[#E2E8F2] flex items-center gap-2">
              <User className="h-4 w-4 text-[#FF851B]" />
              Customer Profile
            </h3>
            <div className="space-y-3 text-xs text-[#0B1733]">
              <div>
                <span className="text-[#71819E] block font-semibold">Name:</span>
                <span className="font-bold text-[#0B1733] text-sm">{user?.name}</span>
              </div>
              <div>
                <span className="text-[#71819E] block font-semibold">Email:</span>
                <span className="font-semibold text-[#0B1733]">{user?.email}</span>
              </div>
              <div>
                <span className="text-[#71819E] block font-semibold">Licence Number:</span>
                <span className="font-mono text-[#0B1733] font-bold">{user?.license_no || "Not submitted"}</span>
              </div>
              <div>
                <span className="text-[#71819E] block font-semibold">KYC Verification:</span>
                <span className="font-bold">{user?.kyc_status}</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-[#E2E8F2] p-6 shadow-[0_2px_12px_rgba(11,23,51,0.04)] flex flex-col justify-between">
            <div>
              <h3 className="font-bold text-[#0B1733] text-base mb-2">Browse & Book Vehicles</h3>
              <p className="text-[#71819E] text-xs mb-4">
                Explore available fleet vehicles and pick your rental dates.
              </p>
            </div>
            <Link
              href="/vehicles"
              className="w-full bg-[#0B1733] hover:bg-[#16264C] text-white font-bold py-2.5 px-4 rounded-xl text-center text-xs uppercase tracking-wider transition-colors block shadow-xs"
            >
              Browse Vehicle Fleet
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
