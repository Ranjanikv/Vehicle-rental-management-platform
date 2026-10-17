"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Car, Mail, Lock, AlertCircle, Shield } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: "",
    password: ""
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [seedMessage, setSeedMessage] = useState("");
const [seedLoading, setSeedLoading] = useState(false);

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSeedMessage("");

    if (!formData.email || !formData.password) {
      setError("Please enter both email and password.");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.message || "Login failed. Please check your credentials.");
        setLoading(false);
        return;
      }

      // Redirect based on user role
      if (data.user?.role === "ADMIN") {
        router.push("/admin");
      } else {
        router.push("/dashboard");
      }
      router.refresh();
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
      setLoading(false);
    }
  };

  const handleSeedAdmin = async () => {
    setError("");
    setSeedMessage("");
    setSeedLoading(true);
    try {
      const res = await fetch("/api/auth/seed-admin", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        setFormData({ email: "admin@vehiclerental.com", password: "adminpassword123" });
        setSeedMessage("Default Admin credentials populated into form! Click Sign In below.");
      } else {
        setError(data.message || "Failed to seed admin user.");
      }
    } catch (err) {
      setError("Could not seed admin user.");
    } finally {
      setSeedLoading(false);
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
          Sign in to your account
        </h2>
        <p className="mt-2 text-center text-xs font-semibold text-[#71819E]">
          Don't have an account?{" "}
          <Link href="/signup" className="font-bold text-[#0B1733] hover:text-[#FF851B] transition-colors">
            Create an account
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

          {seedMessage && (
            <div className="mb-4 bg-[#F5F7FC] border border-[#E2E8F2] text-[#0B1733] px-4 py-3 rounded-xl text-xs font-bold">
              {seedMessage}
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
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
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-2.5 px-4 rounded-xl shadow-xs text-xs font-bold uppercase tracking-wider text-white bg-[#0B1733] hover:bg-[#16264C] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#0B1733] disabled:opacity-50 transition-colors"
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>

          {process.env.NODE_ENV !== "production" && (
            <div className="mt-6 pt-6 border-t border-[#E2E8F2]">
              <button
                type="button"
                onClick={handleSeedAdmin}
                disabled={seedLoading}
                className="w-full flex items-center justify-center gap-2 py-2 px-4 border border-[#E2E8F2] rounded-xl text-xs font-bold text-[#0B1733] bg-[#F5F7FC] hover:bg-[#E2E8F2] transition-colors disabled:opacity-50"
              >
                {seedLoading ? (
                  "Seeding..."
                ) : (
                  <>
                    <Shield className="h-4 w-4 text-[#FF851B]" />
                    Quick Fill Demo Admin Account
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
