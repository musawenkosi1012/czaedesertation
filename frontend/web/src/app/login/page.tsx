"use client";

import { useState, SyntheticEvent } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { Lock, User, Loader2 } from "lucide-react";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleLogin = async (e: SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("username", username);
      formData.append("password", password);

      const response = await api.post("/auth/login", formData);

      const token = response.data.access_token;
      const role = response.data.role;
      const borrower_id = response.data.borrower_id;

      if (token) {
        localStorage.setItem("token", token);
        localStorage.setItem("role", role);
        if (borrower_id) {
          localStorage.setItem("borrower_id", borrower_id.toString());
        }
        await new Promise(resolve => setTimeout(resolve, 500));
        router.push(role === "admin" ? "/dashboard" : "/portal");
      } else {
        setError("No token received from server");
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || "Login failed. Check credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a] relative overflow-hidden">
      {/* Background blobs */}
      <div className="absolute top-0 -left-4 w-72 h-72 bg-zim-green opacity-20 blur-[120px] rounded-full"></div>
      <div className="absolute bottom-0 -right-4 w-72 h-72 bg-zim-red opacity-10 blur-[120px] rounded-full"></div>

      <div className="w-full max-w-md p-8 glass-dark rounded-2xl shadow-2xl z-10 border border-white/10">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">Czae Credit</h1>
          <p className="text-gray-400">ML-Powered Digital Lending Portal</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-300 mb-2">Username</label>
            <div className="relative">
              <User className="absolute left-3 top-3 w-5 h-5 text-gray-500" />
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-zim-green text-white"
                placeholder="Enter username"
                required
              />
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
                className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-zim-green text-white"
                placeholder="Enter password"
                required
              />
            </div>
          </div>

          {error && <p className="text-zim-red text-sm text-center">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-zim-green hover:bg-zim-green/80 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-zim-green/20"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Sign In"}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-gray-400 text-sm">
            New borrower?{" "}
            <button
              onClick={() => router.push("/signup")}
              className="text-zim-green hover:text-zim-green/80 font-semibold transition-colors"
            >
              Sign up here
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
