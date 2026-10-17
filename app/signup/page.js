"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Car, User, Mail, Lock, AlertCircle, CheckCircle } from "lucide-react";

export default function SignupPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: ""
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!formData.name || !formData.email || !formData.password || !formData.confirmPassword) {
      setError("Please fill in all fields.");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.message || "Signup failed. Please try again.");
        setLoading(false);
        return;
      }

      // Success -> Redirect to customer dashboard
      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F7FC] flex flex-col justify-center py-12 sm:px-6 lg:px-8 text-[#0B1733]">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center items-center gap-2.5">
          <div className="bg-[#0B1733] p-2.5 rounded-2xl text-white shadow-xs">
            <Car className="h-7 w-7 text-[#FF851B]" />
          </div>
          <span className="text-2xl font-extrabold tracking-tight text-[#0B1733]">RENT-EASE</span>
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-[#0B1733] uppercase tracking-tight">
          Create a new account
        </h2>
        <p className="mt-2 text-center text-xs font-semibold text-[#71819E]">
          Already registered?{" "}
          <Link href="/login" className="font-bold text-[#0B1733] hover:text-[#FF851B] transition-colors">
            Sign in here
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-sm rounded-2xl sm:px-10 border border-[#E2E8F2]">
          {error && (
            <div className="mb-4 bg-rose-50 border border-rose-200 text-rose-800 px-4 py-3 rounded-xl flex items-center gap-2 text-xs font-semibold">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="block text-xs font-bold text-[#71819E] mb-1">Full Name</label>
              <div className="relative rounded-lg shadow-2xs">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#71819E]">
                  <User className="h-4 w-4" />
                </div>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="block w-full pl-9 pr-3 py-2 bg-[#F5F7FC] border border-[#E2E8F2] rounded-lg text-[#0B1733] focus:outline-none focus:ring-2 focus:ring-[#0B1733] focus:bg-white text-xs font-semibold transition-colors"
                  placeholder="John Doe"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#71819E] mb-1">Email address</label>
              <div className="relative rounded-lg shadow-2xs">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#71819E]">
                  <Mail className="h-4 w-4" />
                </div>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="block w-full pl-9 pr-3 py-2 bg-[#F5F7FC] border border-[#E2E8F2] rounded-lg text-[#0B1733] focus:outline-none focus:ring-2 focus:ring-[#0B1733] focus:bg-white text-xs font-semibold transition-colors"
                  placeholder="you@example.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#71819E] mb-1">Password</label>
              <div className="relative rounded-lg shadow-2xs">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#71819E]">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  className="block w-full pl-9 pr-3 py-2 bg-[#F5F7FC] border border-[#E2E8F2] rounded-lg text-[#0B1733] focus:outline-none focus:ring-2 focus:ring-[#0B1733] focus:bg-white text-xs font-semibold transition-colors"
                  placeholder="At least 6 characters"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#71819E] mb-1">Confirm Password</label>
              <div className="relative rounded-lg shadow-2xs">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#71819E]">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                  className="block w-full pl-9 pr-3 py-2 bg-[#F5F7FC] border border-[#E2E8F2] rounded-lg text-[#0B1733] focus:outline-none focus:ring-2 focus:ring-[#0B1733] focus:bg-white text-xs font-semibold transition-colors"
                  placeholder="Re-enter your password"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-2.5 px-4 rounded-xl shadow-xs text-xs font-bold uppercase tracking-wider text-white bg-[#0B1733] hover:bg-[#16264C] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#0B1733] disabled:opacity-50 transition-colors"
            >
              {loading ? "Creating Account..." : "Sign Up"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
