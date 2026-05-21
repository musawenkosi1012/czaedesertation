"use client";

import { useState, SyntheticEvent } from "react";
import { useRouter } from "next/navigation";
import { registerUser } from "@/lib/api";
import { User, Lock, Phone, FileText, MapPin, Briefcase, Loader2, Calendar } from "lucide-react";

export default function SignupPage() {
  const [name, setName] = useState("");
  const [nationalId, setNationalId] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [location, setLocation] = useState("Urban");
  const [employmentType, setEmploymentType] = useState("Formal");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const router = useRouter();

  const handleSignup = async (e: SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }

    try {
      await registerUser({
        username: nationalId,
        password,
        name,
        phone_number: phoneNumber,
        national_id: nationalId,
        date_of_birth: dateOfBirth,
        location,
        employment_type: employmentType,
      });

      setSuccess("Account created successfully! Logging you in...");
      await new Promise(resolve => setTimeout(resolve, 1500));
      router.push("/login");
    } catch (err: any) {
      setError(err.response?.data?.detail || "Signup failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a] relative overflow-hidden p-4">
      {/* Background blobs */}
      <div className="absolute top-0 -left-4 w-72 h-72 bg-zim-green opacity-20 blur-[120px] rounded-full"></div>
      <div className="absolute bottom-0 -right-4 w-72 h-72 bg-zim-red opacity-10 blur-[120px] rounded-full"></div>

      <div className="w-full max-w-md p-8 glass-dark rounded-2xl shadow-2xl z-10 border border-white/10">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">Create Account</h1>
          <p className="text-gray-400">Join Czae Digital Lending</p>
        </div>

        <form onSubmit={handleSignup} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-2">Full Name</label>
            <div className="relative">
              <User className="absolute left-3 top-3 w-5 h-5 text-gray-500" />
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-zim-green text-white text-sm"
                placeholder="Your full name"
                required
              />
            </div>
          </div>

          <div>
            <label htmlFor="nationalId" className="block text-sm font-medium text-gray-300 mb-2">National ID</label>
            <div className="relative">
              <FileText className="absolute left-3 top-3 w-5 h-5 text-gray-500" />
              <input
                id="nationalId"
                type="text"
                value={nationalId}
                onChange={(e) => setNationalId(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-zim-green text-white text-sm"
                placeholder="e.g., 26-100000-A-26"
                required
              />
            </div>
          </div>

          <div>
            <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-300 mb-2">Phone Number</label>
            <div className="relative">
              <Phone className="absolute left-3 top-3 w-5 h-5 text-gray-500" />
              <input
                id="phoneNumber"
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-zim-green text-white text-sm"
                placeholder="+263..."
                required
              />
            </div>
          </div>

          <div>
            <label htmlFor="dateOfBirth" className="block text-sm font-medium text-gray-300 mb-2">Date of Birth</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-3 w-5 h-5 text-gray-500" />
              <input
                id="dateOfBirth"
                type="date"
                value={dateOfBirth}
                onChange={(e) => setDateOfBirth(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-zim-green text-white text-sm"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="location" className="block text-sm font-medium text-gray-300 mb-2">Location</label>
              <select
                id="location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-zim-green text-white text-sm"
              >
                <option value="Urban">Urban</option>
                <option value="Rural">Rural</option>
              </select>
            </div>

            <div>
              <label htmlFor="employmentType" className="block text-sm font-medium text-gray-300 mb-2">Employment</label>
              <select
                id="employmentType"
                value={employmentType}
                onChange={(e) => setEmploymentType(e.target.value)}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-zim-green text-white text-sm"
              >
                <option value="Formal">Formal</option>
                <option value="Informal">Informal</option>
                <option value="Self-employed">Self-employed</option>
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 w-5 h-5 text-gray-500" />
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-zim-green text-white text-sm"
                placeholder="Create a password"
                required
              />
            </div>
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-300 mb-2">Confirm Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 w-5 h-5 text-gray-500" />
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-zim-green text-white text-sm"
                placeholder="Confirm password"
                required
              />
            </div>
          </div>

          {error && <p className="text-zim-red text-sm text-center">{error}</p>}
          {success && <p className="text-zim-green text-sm text-center">{success}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-zim-green hover:bg-zim-green/80 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-zim-green/20 disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Create Account"}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-gray-400 text-sm">
            Already have an account?{" "}
            <button
              onClick={() => router.push("/login")}
              className="text-zim-green hover:text-zim-green/80 font-semibold transition-colors"
            >
              Sign in here
            </button>
          </p>
        </div>

        <p className="mt-8 text-center text-xs text-gray-500 uppercase tracking-widest">
          Zimbabwean Digital Lending Prototype v1.0
        </p>
      </div>
    </div>
  );
}
