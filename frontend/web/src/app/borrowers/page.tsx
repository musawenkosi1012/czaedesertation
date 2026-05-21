"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { Search, UserPlus, ChevronRight, MapPin, Briefcase } from "lucide-react";
import Link from "next/link";

function EconomyBadge({ level }: { level: string }) {
  const styles: Record<string, string> = {
    high: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
    middle: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
    low: "bg-orange-500/15 text-orange-400 border-orange-500/30",
  };
  const k = (level || "middle").toLowerCase();
  return (
    <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase border ${styles[k] || styles.middle}`}>
      {k.charAt(0).toUpperCase() + k.slice(1)}
    </span>
  );
}

export default function BorrowersPage() {
  const [borrowers, setBorrowers] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchBorrowers() {
      try {
        const res = await api.get("/borrowers/");
        setBorrowers(res.data);
      } catch (err) {
        console.error("Failed to fetch borrowers", err);
      } finally {
        setLoading(false);
      }
    }
    fetchBorrowers();
  }, []);

  const filtered = borrowers.filter(b => 
    b.name.toLowerCase().includes(search.toLowerCase()) || 
    b.national_id.includes(search)
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-2">Borrower Management</h1>
          <p className="text-gray-400">Total {borrowers.length} records in centralized database.</p>
        </div>
        <button className="px-6 py-3 bg-zim-green hover:bg-zim-green/80 text-white font-bold rounded-xl transition-all flex items-center gap-2">
          <UserPlus className="w-5 h-5" />
          Add Borrower
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-4 top-4 w-5 h-5 text-gray-500" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, ID or phone..."
          className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-2xl focus:outline-none focus:ring-2 focus:ring-zim-green text-white"
        />
      </div>

      {/* Table/List */}
      <div className="glass rounded-2xl border border-white/5 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-white/5 text-gray-400 text-sm uppercase">
              <tr>
                <th className="px-6 py-4 font-semibold">Name</th>
                <th className="px-6 py-4 font-semibold">National ID</th>
                <th className="px-6 py-4 font-semibold">Location</th>
                <th className="px-6 py-4 font-semibold">Employment</th>
                <th className="px-6 py-4 font-semibold">Economy</th>
                <th className="px-6 py-4 font-semibold">Monthly Income</th>
                <th className="px-6 py-4 font-semibold">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr><td colSpan={7} className="p-10 text-center text-gray-500">Loading records...</td></tr>
              ) : filtered.map((b) => (
                <tr key={b.id} className="hover:bg-white/5 transition-all group">
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-zim-green/20 flex items-center justify-center text-zim-green font-bold">
                        {b.name[0]}
                      </div>
                      <span className="font-medium text-gray-200">{b.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-5 text-gray-400 font-mono text-sm">{b.national_id}</td>
                  <td className="px-6 py-5 text-gray-400">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-zim-red" />
                      {b.location}
                    </div>
                  </td>
                  <td className="px-6 py-5 text-gray-400">
                    <div className="flex items-center gap-2">
                      <Briefcase className="w-4 h-4 text-zim-gold" />
                      {b.employment_type}
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <EconomyBadge level={b.economy_level} />
                  </td>
                  <td className="px-6 py-5 text-gray-300 font-semibold">
                    ${b.monthly_income?.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </td>
                  <td className="px-6 py-5">
                    <Link
                      href={`/borrowers/${b.id}`}
                      className="inline-flex items-center gap-1 text-zim-green hover:text-zim-gold transition-all font-semibold"
                    >
                      View Profile
                      <ChevronRight className="w-4 h-4" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
