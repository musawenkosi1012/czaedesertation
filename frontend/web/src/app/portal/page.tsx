"use client";

import { useEffect, useState } from "react";
import api, { getMyProfile, applyForLoan } from "@/lib/api";
import { CreditCard, AlertCircle, Loader2 } from "lucide-react";

interface BorrowerProfile {
  id: number;
  name: string;
  economy_level: string;
  monthly_income: number;
  pct_bills_on_time: number;
  monthly_tx_count: number;
}

interface CreditScore {
  borrower_id: number;
  score: number;
  probability_of_default: number;
  risk_category: string;
}

interface Loan {
  id: number;
  borrower_id: number;
  amount: number;
  status: string;
  created_at: string;
  rejection_reason?: string;
}

interface LoanSizing {
  recommended_offer: {
    loan_amount: number;
    term_days: number;
    interest_rate_annual: number;
  };
}

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

function RiskBadge({ category }: { category: string }) {
  const styles: Record<string, string> = {
    LOW: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
    MEDIUM: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
    HIGH: "bg-orange-500/15 text-orange-400 border-orange-500/30",
    VERY_HIGH: "bg-red-500/15 text-red-400 border-red-500/30",
  };
  return (
    <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase border ${styles[category] || styles.MEDIUM}`}>
      {category}
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    PENDING: "bg-blue-500/15 text-blue-400 border-blue-500/30",
    APPROVED: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
    DISBURSED: "bg-cyan-500/15 text-cyan-400 border-cyan-500/30",
    REPAID: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
    DEFAULTED: "bg-red-500/15 text-red-400 border-red-500/30",
    REJECTED: "bg-orange-500/15 text-orange-400 border-orange-500/30",
  };
  return (
    <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase border ${styles[status] || styles.PENDING}`}>
      {status}
    </span>
  );
}

export default function PortalPage() {
  const [profile, setProfile] = useState<BorrowerProfile | null>(null);
  const [creditScore, setCreditScore] = useState<CreditScore | null>(null);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(true);
  const [applyLoading, setApplyLoading] = useState(false);
  const [applyError, setApplyError] = useState("");
  const [applySuccess, setApplySuccess] = useState("");
  const [loanAmount, setLoanAmount] = useState("");
  const [duration, setDuration] = useState("30");
  const [interestRate, setInterestRate] = useState("15");
  const [loanSizing, setLoanSizing] = useState<LoanSizing | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch profile
        const profileData = await getMyProfile();
        setProfile(profileData);

        // Fetch credit score
        try {
          const scoreData = await api.get(`/score/${profileData.id}/latest`);
          setCreditScore(scoreData.data);

          // Fetch loan sizing (only possible if credit score exists)
          try {
            const sizingData = await api.get(`/loans/sizing/${profileData.id}`);
            setLoanSizing(sizingData.data);
            setLoanAmount(sizingData.data.recommended_offer.loan_amount.toFixed(2));
            setDuration(sizingData.data.recommended_offer.term_days.toString());
            setInterestRate(sizingData.data.recommended_offer.interest_rate_annual.toString());
          } catch {
            setLoanAmount("100");
          }
        } catch (err: any) {
          setCreditScore(null);
          setLoanAmount("100");
        }

        // Fetch loans
        try {
          const loansData = await api.get("/loans");
          const borrowerLoans = loansData.data.filter((l: Loan) => l.borrower_id === profileData.id);
          setLoans(borrowerLoans);
        } catch (err) {
          setLoans([]);
        }
      } catch (err) {
        console.error("Failed to load profile:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleApplyForLoan = async () => {
    setApplyLoading(true);
    setApplyError("");
    setApplySuccess("");

    try {
      if (!creditScore) {
        setApplyError("Please get a credit assessment first before applying for a loan.");
        setApplyLoading(false);
        return;
      }

      const result = await applyForLoan({
        amount: parseFloat(loanAmount),
        interest_rate: parseFloat(interestRate),
        duration_days: parseInt(duration),
      });

      setApplySuccess(`Loan application submitted! Status: ${result.status}`);
      setLoans([...loans, result]);
      setLoanAmount(loanSizing ? loanSizing.recommended_offer.loan_amount.toFixed(2) : "100");
      setDuration(loanSizing ? loanSizing.recommended_offer.term_days.toString() : "30");
      setInterestRate(loanSizing ? loanSizing.recommended_offer.interest_rate_annual.toString() : "15");
    } catch (err: any) {
      setApplyError(err.response?.data?.detail || "Failed to apply for loan");
    } finally {
      setApplyLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-zim-green" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-4xl font-bold text-white mb-10">Welcome, {profile?.name}!</h1>

      {/* Profile Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white/5 border border-white/10 rounded-xl p-6 space-y-4">
          <h2 className="text-xl font-bold text-white">Your Profile</h2>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-400">Name:</span>
              <span className="text-white font-semibold">{profile?.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Economy Level:</span>
              <EconomyBadge level={profile?.economy_level || "middle"} />
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Monthly Income:</span>
              <span className="text-white font-semibold">${profile?.monthly_income?.toLocaleString(undefined, { maximumFractionDigits: 0 }) || "N/A"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Bills On-Time:</span>
              <span className={`font-semibold ${(profile?.pct_bills_on_time || 0) > 0.75 ? "text-emerald-400" : "text-yellow-400"}`}>
                {((profile?.pct_bills_on_time || 0) * 100).toFixed(0)}%
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Transactions/Month:</span>
              <span className="text-white font-semibold">{profile?.monthly_tx_count?.toFixed(0) || "0"}</span>
            </div>
          </div>
        </div>

        {/* Credit Score */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-6 space-y-4">
          <h2 className="text-xl font-bold text-white">Your Credit Score</h2>
          {creditScore ? (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-24 h-24 rounded-full bg-zim-green/20 border-2 border-zim-green flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-zim-green">{creditScore.score}</div>
                  </div>
                </div>
                <div className="space-y-2">
                  <div>
                    <span className="text-gray-400 text-sm">Risk Category:</span>
                    <div className="mt-1">
                      <RiskBadge category={creditScore.risk_category} />
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-400 text-sm">Probability of Default:</span>
                    <span className="text-white font-semibold ml-2">{(creditScore.probability_of_default * 100).toFixed(2)}%</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-gray-400">
              <AlertCircle className="w-5 h-5" />
              <span>No credit score yet. Contact your lender for a credit assessment.</span>
            </div>
          )}
        </div>
      </div>

      {/* Loan History */}
      <div className="bg-white/5 border border-white/10 rounded-xl p-6 space-y-4">
        <h2 className="text-xl font-bold text-white">Loan History</h2>
        {loans.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-white/10">
                <tr>
                  <th className="px-4 py-3 text-left text-gray-400 font-semibold">Amount</th>
                  <th className="px-4 py-3 text-left text-gray-400 font-semibold">Status</th>
                  <th className="px-4 py-3 text-left text-gray-400 font-semibold">Date</th>
                  <th className="px-4 py-3 text-left text-gray-400 font-semibold">Details</th>
                </tr>
              </thead>
              <tbody className="space-y-2">
                {loans.map((loan) => (
                  <tr key={loan.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <td className="px-4 py-3 text-white font-semibold">${loan.amount.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={loan.status} />
                    </td>
                    <td className="px-4 py-3 text-gray-400">
                      {new Date(loan.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-gray-400">
                      {loan.rejection_reason && (
                        <span className="text-xs text-orange-400" title={loan.rejection_reason}>Rejected</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-400">No loans yet. Apply for your first loan below!</p>
        )}
      </div>

      {/* Apply for Loan */}
      <div id="apply" className="bg-white/5 border border-white/10 rounded-xl p-6 space-y-4">
        <h2 className="text-xl font-bold text-white">Apply for a Loan</h2>
        {creditScore ? (
          <div className="space-y-4">
            {loanSizing && (
              <div className="bg-zim-green/10 border border-zim-green/30 rounded-lg p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Your AI-approved maximum loan</p>
                  <p className="text-2xl font-bold text-zim-green">${loanSizing.recommended_offer.loan_amount.toFixed(2)}</p>
                </div>
                <div className="text-sm text-gray-400 text-right space-y-1">
                  <p>Term: {loanSizing.recommended_offer.term_days} days</p>
                  <p>Rate: {loanSizing.recommended_offer.interest_rate_annual}% p.a.</p>
                </div>
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Amount ($)</label>
                <input
                  type="number"
                  value={loanAmount}
                  onChange={(e) => setLoanAmount(e.target.value)}
                  className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:ring-2 focus:ring-zim-green"
                  placeholder="1000"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Duration (days)</label>
                <input
                  type="number"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:ring-2 focus:ring-zim-green"
                  placeholder="30"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Interest Rate (%)</label>
                <input
                  type="number"
                  value={interestRate}
                  onChange={(e) => setInterestRate(e.target.value)}
                  className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:ring-2 focus:ring-zim-green"
                  placeholder="15"
                />
              </div>
            </div>
            {applyError && <p className="text-zim-red text-sm">{applyError}</p>}
            {applySuccess && <p className="text-zim-green text-sm">{applySuccess}</p>}
            <button
              onClick={handleApplyForLoan}
              disabled={applyLoading}
              className="w-full py-3 bg-zim-green hover:bg-zim-green/80 text-white font-bold rounded-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {applyLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <CreditCard className="w-5 h-5" />}
              {applyLoading ? "Submitting..." : "Submit Loan Application"}
            </button>
          </div>
        ) : (
          <div className="bg-gray-900/50 border border-orange-500/30 rounded-lg p-4 flex items-center gap-3 text-orange-400">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span className="text-sm">Get a credit assessment first before applying for a loan.</span>
          </div>
        )}
      </div>
    </div>
  );
}
