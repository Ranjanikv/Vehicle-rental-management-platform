import Link from "next/link";
import { Car } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-white text-[#0B1733] py-10 border-t border-[#E2E8F2] mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2.5">
            <div className="bg-[#0B1733] p-2 rounded-xl text-white shadow-xs">
              <Car className="h-5 w-5 text-[#FF851B]" />
            </div>
            <span className="text-lg font-extrabold text-[#0B1733] tracking-tight">
              RENT<span className="text-[#FF851B]">-</span>EASE
            </span>
          </div>

          <div className="flex flex-wrap justify-center gap-6 text-sm font-medium text-[#71819E]">
            <Link href="/" className="hover:text-[#0B1733] hover:text-[#FF851B] transition-colors">Home</Link>
            <Link href="/vehicles" className="hover:text-[#0B1733] hover:text-[#FF851B] transition-colors">Vehicles</Link>
            <Link href="/login" className="hover:text-[#0B1733] hover:text-[#FF851B] transition-colors">Login</Link>
            <Link href="/signup" className="hover:text-[#0B1733] hover:text-[#FF851B] transition-colors">Sign Up</Link>
          </div>

          <div className="text-xs text-[#71819E] font-medium">
            © {new Date().getFullYear()} Rent-Ease Academic Project. All rights reserved.
          </div>
        </div>
      </div>
    </footer>
  );
}
