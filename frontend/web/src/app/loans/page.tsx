"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import api from "@/lib/api";
import {
  CreditCard, Search, ArrowUpRight, CheckCircle2, Clock,
  XCircle, AlertCircle, Calculator, Plus, X, Brain,
  ShieldAlert, TrendingDown, Loader2, AlertTriangle,
} from "lucide-react";
import { clsx } from "clsx";

/* ── Loan Application Modal ── */
function ApplyLoanModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [borrowerId, setBorrowerId] = useState("");
  const [amount, setAmount] = useState("");
  const [duration, setDuration] = useState("90");
  const [rate, setRate] = useState("18");

  const [sizing, setSizing] = useState<any>(null);
  const [sizingLoading, setSizingLoading] = useState(false);
  const [sizingError, setSizingError] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [submitError, setSubmitError] = useState("");

  // Fetch AI limit whenever borrower ID changes
  const fetchSizing = useCallback(async (id: string) => {
    if (!id || isNaN(Number(id))) { setSizing(null); return; }
    setSizingLoading(true);
    setSizingError("");
    try {
      const res = await api.get(`/loans/sizing/${id}`);
      setSizing(res.data);
      // Pre-fill rate from AI recommendation
      setRate(String(res.data.recommended_offer.interest_rate_annual));
    } catch (err: any) {
      const msg = err.response?.data?.detail || "Could not load AI limit for this borrower.";
      setSizingError(msg);
      setSizing(null);
    } finally {
      setSizingLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => fetchSizing(borrowerId), 600);
    return () => clearTimeout(timer);
  }, [borrowerId, fetchSizing]);

  const maxAllowed = sizing?.recommended_offer?.loan_amount ?? null;
  const amountNum = parseFloat(amount) || 0;
  const isOverLimit = maxAllowed !== null && amountNum > maxAllowed;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setSubmitError("");
    setResult(null);
    try {
      const res = await api.post("/loans/", {
        borrower_id: parseInt(borrowerId),
        amount: parseFloat(amount),
        interest_rate: parseFloat(rate),
        duration_days: parseInt(duration),
      });
      setResult(res.data);
      if (res.data.status !== "REJECTED") {
        onSuccess();
      }
    } catch (err: any) {
      setSubmitError(err.response?.data?.detail || "Failed to submit loan application.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.8)", backdropFilter: "blur(8px)" }}>
      <div className="w-full max-w-2xl bg-[#0f0f0f] border border-white/10 rounded-3xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-8 py-6 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-zim-green/10 border border-zim-green/20 flex items-center justify-center">
              <Brain className="w-5 h-5 text-zim-green" />
            </div>
            <div>
              <h2 className="font-bold text-lg">AI-Assisted Loan Application</h2>
              <p className="text-xs text-white/40">Limits set by machine learning credit model</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/5 text-white/40 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-8 space-y-6">
          {/* Result Panel */}
          {result && (
            <div className={clsx(
              "rounded-2xl p-6 border",
              result.status === "REJECTED"
                ? "bg-red-500/5 border-red-500/20"
                : "bg-zim-green/5 border-zim-green/20"
            )}>
              {result.status === "REJECTED" ? (
                <>
                  <div className="flex items-center gap-3 mb-3">
                    <ShieldAlert className="w-6 h-6 text-red-400" />
                    <span className="font-bold text-red-400 text-lg">Loan Rejected by AI</span>
                  </div>
                  <p className="text-white/60 text-sm leading-relaxed mb-4">{result.rejection_reason}</p>
                  <div className="flex items-center gap-3 p-4 rounded-xl bg-white/5 border border-white/10">
                    <TrendingDown className="w-5 h-5 text-zim-gold flex-shrink-0" />
                    <div>
                      <p className="text-xs text-white/40 uppercase tracking-widest">Maximum AI-Approved Amount</p>
                      <p className="text-2xl font-bold text-zim-gold">${result.max_allowed_amount?.toLocaleString()}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => { setAmount(String(result.max_allowed_amount)); setResult(null); }}
                    className="mt-4 w-full py-2.5 rounded-xl text-sm font-semibold border border-zim-gold/30 text-zim-gold hover:bg-zim-gold/10 transition-colors"
                  >
                    Re-apply with Maximum Approved Amount
                  </button>
                </>
              ) : (
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-6 h-6 text-zim-green" />
                  <div>
                    <p className="font-bold text-zim-green">Loan #{result.id} Submitted Successfully</p>
                    <p className="text-sm text-white/50">Status: {result.status} — ${result.amount.toLocaleString()} for {result.duration_days} days</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {!result && (
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Borrower ID + AI Limit */}
              <div>
                <label className="text-xs font-semibold text-white/40 uppercase tracking-widest block mb-2">Borrower ID</label>
                <input
                  type="number"
                  value={borrowerId}
                  onChange={(e) => setBorrowerId(e.target.value)}
                  placeholder="e.g. 42"
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-zim-green/50 text-sm"
                  required
                />
              </div>

              {/* AI Limit Card */}
              {sizingLoading && (
                <div className="flex items-center gap-3 p-4 rounded-xl bg-white/3 border border-white/5 text-white/40 text-sm">
                  <Loader2 className="w-4 h-4 animate-spin" /> Fetching AI credit limit…
                </div>
              )}
              {sizingError && (
                <div className="flex items-center gap-2 p-4 rounded-xl bg-red-500/5 border border-red-500/20 text-red-400 text-sm">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" /> {sizingError}
                </div>
              )}
              {sizing && !sizingLoading && (
                <div className="rounded-2xl border border-zim-green/20 bg-zim-green/5 p-5">
                  <p className="text-xs font-semibold text-zim-green uppercase tracking-widest mb-3 flex items-center gap-2">
                    <Brain className="w-3.5 h-3.5" /> AI Credit Assessment
                  </p>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <p className="text-[10px] text-white/40 uppercase">Max Approved</p>
                      <p className="text-xl font-bold text-zim-gold">${sizing.recommended_offer.loan_amount.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-white/40 uppercase">Risk Level</p>
                      <p className="text-sm font-bold" style={{ color: sizing.risk_category === "LOW" ? "#4ade80" : sizing.risk_category === "MEDIUM" ? "#FFD200" : "#f87171" }}>
                        {sizing.risk_category}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] text-white/40 uppercase">Default Prob.</p>
                      <p className="text-sm font-bold text-white">{(sizing.probability_of_default * 100).toFixed(1)}%</p>
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-white/5 text-xs text-white/30">
                    Limiting factor: <span className="text-white/50">{sizing.calculation_methods[sizing.recommended_offer.limiting_factor?.replace("_based","")]?.explanation || sizing.recommended_offer.limiting_factor}</span>
                  </div>
                </div>
              )}

              {/* Amount */}
              <div>
                <label className="text-xs font-semibold text-white/40 uppercase tracking-widest block mb-2">
                  Loan Amount (USD)
                  {maxAllowed && <span className="ml-2 text-white/30 normal-case">— max ${maxAllowed.toLocaleString()}</span>}
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    step="0.01"
                    min="1"
                    className={clsx(
                      "w-full px-4 py-3 bg-white/5 border rounded-xl focus:outline-none text-sm transition-colors",
                      isOverLimit
                        ? "border-red-500/50 focus:border-red-500 text-red-400"
                        : "border-white/10 focus:border-zim-green/50"
                    )}
                    required
                  />
                  {isOverLimit && (
                    <div className="mt-1.5 flex items-center gap-1.5 text-xs text-red-400">
                      <AlertTriangle className="w-3 h-3" />
                      Exceeds AI limit by ${(amountNum - maxAllowed).toLocaleString(undefined, { maximumFractionDigits: 2 })} — will be auto-rejected
                    </div>
                  )}
                </div>
              </div>

              {/* Rate + Duration */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-white/40 uppercase tracking-widest block mb-2">Annual Rate (%)</label>
                  <input
                    type="number"
                    value={rate}
                    onChange={(e) => setRate(e.target.value)}
                    step="0.1"
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-zim-green/50 text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-white/40 uppercase tracking-widest block mb-2">Duration (Days)</label>
                  <select
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-zim-green/50 text-sm text-white"
                  >
                    <option value="14">14 days</option>
                    <option value="30">30 days</option>
                    <option value="60">60 days</option>
                    <option value="90">90 days</option>
                    <option value="180">180 days</option>
                  </select>
                </div>
              </div>

              {submitError && (
                <p className="text-red-400 text-sm flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" /> {submitError}
                </p>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-3 rounded-xl border border-white/10 text-white/50 hover:text-white hover:border-white/20 text-sm font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className={clsx(
                    "flex-1 py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all",
                    isOverLimit
                      ? "bg-red-500/20 border border-red-500/30 text-red-400 hover:bg-red-500/30"
                      : "bg-zim-green text-white hover:bg-zim-green/90"
                  )}
                >
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : isOverLimit ? "Submit (Will Be Rejected)" : "Submit Application"}
                </button>
              </div>
            </form>
          )}

          {result?.status === "REJECTED" && (
            <button onClick={() => setResult(null)} className="w-full py-2 text-xs text-white/30 hover:text-white/60 transition-colors">
              Start new application
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Main Loans Page ── */
export default function LoansPage() {
  const [loans, setLoans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [showModal, setShowModal] = useState(false);

  const fetchLoans = async (status?: string) => {
    try {
      const params = status && status !== "ALL" ? `?status=${status}&limit=50` : "?limit=50";
      const res = await api.get(`/loans/${params}`);
      setLoans(res.data);
    } catch (err) {
      console.error("Failed to fetch loans", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchLoans(); }, []);

  const filteredLoans = loans.filter((loan) => {
    const matchesStatus = statusFilter === "ALL" || loan.status === statusFilter;
    const matchesSearch =
      loan.id.toString().includes(searchTerm) ||
      loan.borrower_id.toString().includes(searchTerm) ||
      loan.borrower_name?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "REPAID": return <CheckCircle2 className="w-4 h-4 text-zim-green" />;
      case "PENDING": return <Clock className="w-4 h-4 text-zim-gold" />;
      case "DEFAULTED": return <AlertCircle className="w-4 h-4 text-zim-red" />;
      case "REJECTED": return <XCircle className="w-4 h-4 text-gray-500" />;
      default: return <CreditCard className="w-4 h-4 text-blue-400" />;
    }
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case "REPAID": return "bg-zim-green/10 text-zim-green border-zim-green/20";
      case "PENDING": return "bg-zim-gold/10 text-zim-gold border-zim-gold/20";
      case "DEFAULTED": return "bg-zim-red/10 text-zim-red border-zim-red/20";
      case "REJECTED": return "bg-white/5 text-gray-400 border-white/10";
      default: return "bg-blue-400/10 text-blue-400 border-blue-400/20";
    }
  };

  const [calcAmount, setCalcAmount] = useState(1000);
  const [calcDuration, setCalcDuration] = useState(90);
  const [calcRate, setCalcRate] = useState(15);
  const [calcResult, setCalcResult] = useState<any>(null);

  const calculateRepayment = async () => {
    try {
      const res = await api.get(`/loans/tools/repayment-calculator?amount=${calcAmount}&annual_rate=${calcRate}&duration_days=${calcDuration}`);
      setCalcResult(res.data);
    } catch (err) { console.error(err); }
  };

  useEffect(() => {
    const timer = setTimeout(calculateRepayment, 500);
    return () => clearTimeout(timer);
  }, [calcAmount, calcDuration, calcRate]);

  if (loading) return <div className="p-10 text-center text-gray-500">Loading loan pipeline...</div>;

  return (
    <div className="space-y-10">
      {showModal && (
        <ApplyLoanModal
          onClose={() => setShowModal(false)}
          onSuccess={() => { setShowModal(false); fetchLoans(); }}
        />
      )}

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Loan Pipeline</h1>
          <p className="text-gray-400">Monitoring credit disbursement and repayment lifecycle.</p>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/loans/calculator" className="px-6 py-3 bg-zim-gold text-black font-bold rounded-xl hover:bg-zim-gold/90 transition-all flex items-center gap-2">
            <Calculator className="w-4 h-4" />
            Size Calculator
          </Link>
          <button
            onClick={() => setShowModal(true)}
            className="px-6 py-3 bg-zim-green text-white font-bold rounded-xl hover:bg-zim-green/90 transition-all flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Apply for Loan
          </button>
        </div>
      </div>

      {/* Quick Tools */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        <div className="xl:col-span-2 glass p-8 rounded-3xl border border-white/10 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-10">
            <Calculator className="w-32 h-32 text-zim-gold" />
          </div>
          <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-zim-gold" />
            Repayment Intelligence Tool
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10">
            <div className="space-y-2">
              <label htmlFor="calcAmount" className="text-[10px] font-black uppercase text-gray-500">Loan Amount (USD)</label>
              <input id="calcAmount" type="number" value={calcAmount} onChange={(e) => setCalcAmount(Number(e.target.value))}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-zim-gold" />
            </div>
            <div className="space-y-2">
              <label htmlFor="calcRate" className="text-[10px] font-black uppercase text-gray-500">Annual Rate (%)</label>
              <input id="calcRate" type="number" value={calcRate} onChange={(e) => setCalcRate(Number(e.target.value))}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-zim-gold" />
            </div>
            <div className="space-y-2">
              <label htmlFor="calcDuration" className="text-[10px] font-black uppercase text-gray-500">Duration (Days)</label>
              <input id="calcDuration" type="number" value={calcDuration} onChange={(e) => setCalcDuration(Number(e.target.value))}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-zim-gold" />
            </div>
          </div>
          {calcResult && (
            <div className="mt-8 pt-8 border-t border-white/5 grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                <span className="text-[10px] font-bold text-gray-500 block uppercase mb-1">Monthly</span>
                <span className="text-xl font-black text-zim-green">${calcResult.monthly_installment}</span>
              </div>
              <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                <span className="text-[10px] font-bold text-gray-500 block uppercase mb-1">Total Interest</span>
                <span className="text-xl font-black text-zim-red">${calcResult.total_interest}</span>
              </div>
              <div className="p-4 bg-zim-gold/10 rounded-2xl border border-zim-gold/20">
                <span className="text-[10px] font-bold text-zim-gold block uppercase mb-1">Total Repayment</span>
                <span className="text-xl font-black text-zim-gold">${calcResult.total_repayment}</span>
              </div>
              <div className="p-4 flex items-center justify-center">
                <button onClick={calculateRepayment} className="text-xs font-bold text-gray-500 hover:text-white underline">Refresh Quote</button>
              </div>
            </div>
          )}
        </div>

        <div className="glass p-8 rounded-3xl border border-white/10 flex flex-col justify-center gap-4">
          <div className="space-y-1">
            <label htmlFor="searchTerm" className="font-bold text-gray-400 text-xs uppercase tracking-tighter">Search Pipeline</label>
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 group-focus-within:text-zim-gold transition-colors" />
              <input id="searchTerm" type="text" placeholder="Borrower or Loan ID..."
                className="pl-11 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-zim-gold/50 w-full transition-all text-sm"
                value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            </div>
          </div>
          <div className="space-y-1">
            <label htmlFor="statusFilter" className="font-bold text-gray-400 text-xs uppercase tracking-tighter">Filter by Status</label>
            <select id="statusFilter" className="px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-zim-gold/50 text-gray-400 w-full text-sm"
              value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); fetchLoans(e.target.value); }}>
              <option value="ALL">All Portfolio</option>
              <option value="PENDING">Pending</option>
              <option value="APPROVED">Approved</option>
              <option value="REPAID">Fully Repaid</option>
              <option value="DEFAULTED">Defaulted</option>
              <option value="REJECTED">Rejected by AI</option>
            </select>
          </div>
        </div>
      </div>

      {/* Loans Table */}
      <div className="glass rounded-3xl border border-white/10 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-white/5 text-gray-400 text-xs font-black uppercase tracking-widest">
            <tr>
              <th className="px-6 py-5">Loan ID</th>
              <th className="px-6 py-5">Borrower</th>
              <th className="px-6 py-5">Amount (USD)</th>
              <th className="px-6 py-5">Duration</th>
              <th className="px-6 py-5">Status</th>
              <th className="px-6 py-5">Date</th>
              <th className="px-6 py-5 text-right">Details</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {filteredLoans.map((loan) => (
              <tr key={loan.id} className="hover:bg-white/5 transition-all group">
                <td className="px-6 py-5 font-mono text-zim-gold">#{loan.id.toString().padStart(5, "0")}</td>
                <td className="px-6 py-5">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-zim-green/10 flex items-center justify-center text-zim-green font-bold text-xs">
                      {loan.borrower_name?.charAt(0) || "B"}
                    </div>
                    <div className="flex flex-col">
                      <span className="font-medium text-sm">{loan.borrower_name || "Unknown"}</span>
                      <span className="text-[10px] text-gray-500">ID: #{loan.borrower_id}</span>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-5">
                  <span className="text-lg font-bold">${loan.amount.toLocaleString()}</span>
                  {loan.max_allowed_amount && loan.status === "REJECTED" && (
                    <span className="text-[10px] text-red-400 block">AI limit: ${loan.max_allowed_amount.toLocaleString()}</span>
                  )}
                  <span className="text-xs text-gray-500 block">@ {loan.interest_rate.toFixed(1)}%</span>
                </td>
                <td className="px-6 py-5 text-gray-400">{loan.duration_days} Days</td>
                <td className="px-6 py-5">
                  <div className={clsx("inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-black uppercase border", getStatusStyle(loan.status))}>
                    {getStatusIcon(loan.status)}
                    {loan.status}
                  </div>
                  {loan.status === "REJECTED" && loan.rejection_reason && (
                    <p className="text-[10px] text-red-400/60 mt-1 max-w-[200px] leading-tight truncate" title={loan.rejection_reason}>
                      {loan.rejection_reason}
                    </p>
                  )}
                </td>
                <td className="px-6 py-5 text-sm text-gray-500">{new Date(loan.created_at).toLocaleDateString()}</td>
                <td className="px-6 py-5 text-right">
                  <button className="p-2 hover:bg-white/10 rounded-lg transition-colors group-hover:text-zim-gold">
                    <ArrowUpRight className="w-5 h-5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredLoans.length === 0 && (
          <div className="p-20 text-center text-gray-500">No loans found matching your criteria.</div>
        )}
      </div>
    </div>
  );
}
