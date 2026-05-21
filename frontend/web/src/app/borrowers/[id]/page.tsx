"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import api from "@/lib/api";
import {
  ShieldCheck, Calendar, Phone, MapPin, Briefcase, Loader2,
  TrendingUp, Info, Brain, DollarSign, AlertTriangle,
  Smartphone, Receipt, Activity, BarChart2, Clock, Wifi,
  CreditCard, CheckCircle2, XCircle, ArrowUpRight,
} from "lucide-react";
import { clsx } from "clsx";

/* ── Small stat tile ── */
function StatTile({
  label, value, sub, accent = "white", bar, barMax,
}: {
  label: string; value: string | number; sub?: string;
  accent?: string; bar?: number; barMax?: number;
}) {
  const pct = bar !== undefined && barMax ? Math.min((bar / barMax) * 100, 100) : null;
  const color =
    accent === "green" ? "#006747" :
    accent === "gold"  ? "#FFD200" :
    accent === "red"   ? "#CE1126" :
    accent === "blue"  ? "#60a5fa" : "#ffffff";

  return (
    <div className="p-4 bg-white/5 rounded-2xl border border-white/5 space-y-2">
      <p className="text-[10px] font-bold uppercase tracking-widest text-white/40">{label}</p>
      <p className="text-xl font-bold" style={{ color }}>{value}</p>
      {sub && <p className="text-[11px] text-white/30 leading-tight">{sub}</p>}
      {pct !== null && (
        <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
          <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, backgroundColor: color }} />
        </div>
      )}
    </div>
  );
}

/* ── Section header ── */
function SectionHeader({ icon: Icon, title, color }: { icon: any; title: string; color: string }) {
  return (
    <div className="flex items-center gap-2 mb-5">
      <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `${color}22`, border: `1px solid ${color}44` }}>
        <Icon className="w-4 h-4" style={{ color }} />
      </div>
      <h3 className="text-base font-bold">{title}</h3>
    </div>
  );
}

export default function BorrowerDetailPage() {
  const { id } = useParams();
  const [borrower, setBorrower] = useState<any>(null);
  const [scoreResult, setScoreResult] = useState<any>(null);
  const [sizing, setSizing] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [bills, setBills] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [scoring, setScoring] = useState(false);

  useEffect(() => {
    async function fetchData() {
      try {
        const [borrowerRes, scoreRes, sizingRes, txRes, billRes] = await Promise.allSettled([
          api.get(`/borrowers/${id}`),
          api.get(`/score/${id}/latest`),
          api.get(`/loans/sizing/${id}`),
          api.get(`/borrowers/${id}/transactions`),
          api.get(`/borrowers/${id}/bills`),
        ]);
        if (borrowerRes.status === "fulfilled") setBorrower(borrowerRes.value.data);
        if (scoreRes.status   === "fulfilled") setScoreResult(scoreRes.value.data);
        if (sizingRes.status  === "fulfilled") setSizing(sizingRes.value.data);
        if (txRes.status      === "fulfilled") setTransactions(txRes.value.data.slice(0, 5));
        if (billRes.status    === "fulfilled") setBills(billRes.value.data.slice(0, 5));
      } catch (err) {
        console.error("Failed to fetch borrower data", err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [id]);

  const refreshSizing = async () => {
    try {
      const res = await api.get(`/loans/sizing/${id}`);
      setSizing(res.data);
    } catch { /* no score yet */ }
  };

  const handleScore = async () => {
    setScoring(true);
    try {
      const res = await api.post(`/score/${id}`);
      setScoreResult(res.data);
      await refreshSizing();
    } catch (err) {
      console.error("Scoring operation failed", err);
      alert("Scoring failed. Ensure the ML backend is running.");
    } finally {
      setScoring(false);
    }
  };

  if (loading) return <div className="p-10 text-center text-gray-500">Loading profile...</div>;

  const riskHexColor = { LOW: "#006747", MEDIUM: "#FFD200" }[scoreResult?.risk_category as string] || "#CE1126";
  const riskTextColor = { LOW: "text-zim-green", MEDIUM: "text-zim-gold" }[scoreResult?.risk_category as string] || "text-zim-red";

  const b = borrower;

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Borrower Profile</h1>
        <button
          onClick={handleScore}
          disabled={scoring}
          className="px-8 py-4 bg-zim-gold hover:bg-zim-gold/80 text-black font-bold rounded-2xl transition-all flex items-center gap-2 shadow-lg shadow-zim-gold/20 disabled:opacity-50"
        >
          {scoring ? <Loader2 className="w-5 h-5 animate-spin" /> : <ShieldCheck className="w-5 h-5" />}
          Assess Creditworthiness
        </button>
      </div>

      {/* Top grid: identity + score */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Identity card */}
        <div className="glass p-8 rounded-3xl border border-white/5 space-y-8">
          <div className="text-center">
            <div className="w-24 h-24 rounded-full bg-zim-green/10 flex items-center justify-center text-zim-green text-4xl font-bold mx-auto mb-4 border-4 border-zim-green/30">
              {b.name[0]}
            </div>
            <h2 className="text-2xl font-bold">{b.name}</h2>
            <p className="text-gray-400 text-sm mt-1">{b.national_id}</p>
          </div>
          <div className="space-y-4 pt-6 border-t border-white/5">
            <div className="flex items-center gap-3 text-gray-300"><Phone className="w-5 h-5 text-zim-green" /><span>{b.phone_number}</span></div>
            <div className="flex items-center gap-3 text-gray-300"><MapPin className="w-5 h-5 text-zim-red" /><span>{b.location}</span></div>
            <div className="flex items-center gap-3 text-gray-300"><Briefcase className="w-5 h-5 text-zim-gold" /><span>{b.employment_type}</span></div>
            <div className="flex items-center gap-3 text-gray-300"><Calendar className="w-5 h-5 text-gray-500" /><span>DOB: {new Date(b.date_of_birth).toLocaleDateString()}</span></div>
            <div className="flex items-center gap-3 text-gray-300"><DollarSign className="w-5 h-5 text-zim-green" /><span className="font-semibold">${b.monthly_income?.toLocaleString()} / month</span></div>
          </div>
        </div>

        {/* Score + AI limit */}
        <div className="lg:col-span-2 space-y-8">
          {scoreResult ? (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              {/* Score card */}
              <div className="glass p-10 rounded-3xl border border-white/10 flex flex-col md:flex-row items-center gap-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-zim-green/20 via-transparent to-transparent">
                <div className="relative w-48 h-48 flex items-center justify-center">
                  <svg className="w-full h-full -rotate-90">
                    <circle cx="96" cy="96" r="80" fill="none" stroke="#222" strokeWidth="12" />
                    <circle cx="96" cy="96" r="80" fill="none" stroke={riskHexColor} strokeWidth="12"
                      strokeDasharray={502} strokeDashoffset={502 - (502 * (scoreResult.score - 300)) / 550}
                      className="transition-all duration-1000 ease-out" />
                  </svg>
                  <div className="absolute text-center">
                    <span className="text-5xl font-bold block">{scoreResult.score}</span>
                    <span className="text-xs text-gray-400 uppercase tracking-widest font-bold">Points</span>
                  </div>
                </div>
                <div className="flex-1 space-y-4 text-center md:text-left">
                  <div>
                    <h3 className={clsx("text-3xl font-black italic tracking-tighter mb-1", riskTextColor)}>
                      {scoreResult.risk_category} RISK
                    </h3>
                    <p className="text-gray-400">Probability of Default: {(scoreResult.probability_of_default * 100).toFixed(2)}%</p>
                  </div>
                  <div className="flex flex-wrap gap-3 justify-center md:justify-start">
                    <span className={clsx("px-4 py-1.5 rounded-full text-xs font-bold uppercase",
                      scoreResult.decision === "APPROVE" ? "bg-zim-green/20 text-zim-green" : "bg-zim-red/20 text-zim-red")}>
                      System Decision: {scoreResult.decision}
                    </span>
                    <span className="px-4 py-1.5 rounded-full bg-white/5 text-gray-400 text-xs font-bold uppercase">Ensemble v2.0 · SHAP</span>
                    {scoreResult.peer_percentile != null && (
                      <span className="px-4 py-1.5 rounded-full bg-blue-500/10 text-blue-400 text-xs font-bold uppercase border border-blue-500/20">
                        Top {(100 - scoreResult.peer_percentile).toFixed(0)}% of borrowers
                      </span>
                    )}
                    {scoreResult.score_delta != null && (
                      <span className={clsx("px-4 py-1.5 rounded-full text-xs font-bold uppercase border",
                        scoreResult.score_delta >= 0 ? "bg-zim-green/10 text-zim-green border-zim-green/20" : "bg-zim-red/10 text-zim-red border-zim-red/20")}>
                        {scoreResult.score_delta >= 0 ? "▲" : "▼"} {Math.abs(scoreResult.score_delta)} pts since last
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* AI Loan Limit */}
              {sizing && (
                <div className="glass p-8 rounded-3xl border border-zim-gold/20 bg-zim-gold/5">
                  <div className="flex items-center gap-2 mb-6">
                    <Brain className="w-5 h-5 text-zim-gold" />
                    <h3 className="text-xl font-bold">AI-Predicted Maximum Loan Amount</h3>
                  </div>
                  <div className="flex flex-col md:flex-row md:items-end gap-6 mb-6">
                    <div>
                      <p className="text-xs text-white/40 uppercase tracking-widest mb-1">Maximum Approved</p>
                      <p className="text-5xl font-black text-zim-gold">
                        ${sizing.recommended_offer.loan_amount.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                      </p>
                      <p className="text-sm text-white/40 mt-1">
                        {sizing.recommended_offer.term_days} day term · {sizing.recommended_offer.interest_rate_annual}% p.a. · ${sizing.recommended_offer.monthly_payment.toLocaleString(undefined, { maximumFractionDigits: 2 })}/mo
                      </p>
                    </div>
                    <div className="flex items-center gap-2 px-4 py-2 rounded-full border border-white/10 bg-white/5 text-sm text-white/50 mb-1">
                      <AlertTriangle className="w-4 h-4 text-zim-gold" />
                      Limiting factor: <span className="text-white font-semibold ml-1">{sizing.recommended_offer.limiting_factor?.replace(/_/g, " ")}</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {Object.entries(sizing.calculation_methods as Record<string, { amount: number; explanation: string }>).map(([key, val]) => {
                      const isBinding = sizing.recommended_offer.limiting_factor?.startsWith(key.replace("_based", ""));
                      return (
                        <div key={key} className={clsx("p-4 rounded-2xl border", isBinding ? "border-zim-gold/40 bg-zim-gold/10" : "border-white/5 bg-white/5")}>
                          <p className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-1">{key.replace(/_/g, " ")}</p>
                          <p className={clsx("text-lg font-bold", isBinding ? "text-zim-gold" : "text-white")}>
                            ${val.amount.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                          </p>
                          <p className="text-[10px] text-white/30 mt-1 leading-tight">{val.explanation}</p>
                        </div>
                      );
                    })}
                  </div>
                  <div className="mt-4 flex items-start gap-2 p-4 bg-white/5 rounded-xl border border-white/5">
                    <DollarSign className="w-4 h-4 text-zim-gold shrink-0 mt-0.5" />
                    <p className="text-xs text-white/40 leading-relaxed">
                      Loan applications above <span className="text-zim-gold font-semibold">${sizing.recommended_offer.loan_amount.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span> will be automatically rejected by the AI engine.
                    </p>
                  </div>
                </div>
              )}

              {/* Key Drivers — real SHAP */}
              <div className="glass p-8 rounded-3xl border border-white/5">
                <div className="flex items-center gap-2 mb-6">
                  <TrendingUp className="w-5 h-5 text-zim-gold" />
                  <h3 className="text-xl font-bold">SHAP Key Drivers</h3>
                  <span className="ml-auto text-[10px] px-2 py-0.5 rounded-full bg-zim-gold/10 text-zim-gold border border-zim-gold/20 font-bold uppercase tracking-wider">Real SHAP · RF Explainer</span>
                </div>
                <div className="space-y-3">
                  {(() => {
                    const maxAbs = Math.max(...scoreResult.key_drivers.map((d: any) => Math.abs(d.shap_value ?? 0)), 0.001);
                    return scoreResult.key_drivers.map((driver: any) => {
                      const pct = Math.round((Math.abs(driver.shap_value ?? 0) / maxAbs) * 100);
                      const isPos = driver.impact === "Positive";
                      return (
                        <div key={driver.feature} className="p-4 bg-white/5 rounded-2xl border border-white/5">
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-sm font-semibold">{driver.label ?? driver.feature.replaceAll("_", " ")}</span>
                            <span className={clsx("text-xs font-bold px-2 py-0.5 rounded-full", isPos ? "bg-zim-green/15 text-zim-green" : "bg-zim-red/15 text-zim-red")}>
                              {isPos ? "▲ Positive" : "▼ Negative"}
                            </span>
                          </div>
                          <div className="w-full h-2.5 bg-white/10 rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all duration-700"
                              style={{ width: `${pct}%`, backgroundColor: isPos ? "#006747" : "#CE1126" }}
                            />
                          </div>
                          <p className="text-[10px] text-white/30 mt-1">SHAP value: {(driver.shap_value ?? 0).toFixed(4)}</p>
                        </div>
                      );
                    });
                  })()}
                </div>
                <div className="mt-6 flex items-start gap-2 p-4 bg-zim-green/5 rounded-xl border border-zim-green/10">
                  <Info className="w-5 h-5 text-zim-green shrink-0 mt-0.5" />
                  <p className="text-xs text-gray-400 leading-relaxed">
                    SHAP (SHapley Additive exPlanations) values show each feature's exact contribution to the model's default probability prediction. Negative SHAP → reduces default risk → Positive for creditworthiness.
                  </p>
                </div>
              </div>

              {/* Improvement Tips */}
              {scoreResult.improvement_tips && scoreResult.improvement_tips.length > 0 && (
                <div className="glass p-8 rounded-3xl border border-zim-gold/15 bg-zim-gold/5">
                  <div className="flex items-center gap-2 mb-6">
                    <Brain className="w-5 h-5 text-zim-gold" />
                    <h3 className="text-xl font-bold">AI Score Improvement Simulation</h3>
                  </div>
                  <div className="space-y-3">
                    {scoreResult.improvement_tips.map((tip: any) => (
                      <div key={tip.feature} className="flex items-center gap-4 p-4 bg-white/5 rounded-2xl border border-white/5">
                        <div className="text-center min-w-[60px]">
                          <p className="text-2xl font-black text-zim-gold">+{tip.score_gain}</p>
                          <p className="text-[10px] text-white/30 uppercase">pts</p>
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-semibold">{tip.action}</p>
                          <p className="text-xs text-white/40 mt-0.5">PD reduction: {tip.pd_reduction_pct}% points</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <p className="text-[10px] text-white/20 mt-4">Simulated using Voting Ensemble. Gains are independent estimates per feature.</p>
                </div>
              )}
            </div>
          ) : (
            <div className="glass h-full rounded-3xl border border-dashed border-white/10 flex flex-col items-center justify-center text-gray-500 p-20 text-center">
              <ShieldCheck className="w-16 h-16 mb-4 opacity-20" />
              <h3 className="text-xl font-semibold mb-2">No Credit Assessment</h3>
              <p>Run the ML engine to generate a score based on alternative data points.</p>
            </div>
          )}
        </div>
      </div>

      {/* ── Dissertation Feature Sections ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

        {/* 1. Income Profile */}
        <div className="glass p-8 rounded-3xl border border-white/5">
          <SectionHeader icon={DollarSign} title="Income Profile" color="#006747" />
          <div className="grid grid-cols-2 gap-3">
            <StatTile label="Monthly Income" value={`$${b.monthly_income?.toLocaleString()}`} sub="Primary income signal" accent="green" />
            <StatTile label="Income Stability" value={`${(b.income_stability * 100).toFixed(0)}%`}
              sub="Variance in monthly inflows" accent="green" bar={b.income_stability} barMax={1} />
            <StatTile label="Income Growth" value={`${(b.income_growth * 100).toFixed(1)}%`}
              sub="Month-over-month trend" accent={b.income_growth >= 0 ? "green" : "red"} />
            <StatTile label="Income-to-Loan Ratio" value={b.income_to_loan_ratio?.toFixed(2)}
              sub="Income vs existing obligations" accent="gold" />
          </div>
        </div>

        {/* 2. Mobile Money Activity */}
        <div className="glass p-8 rounded-3xl border border-white/5">
          <SectionHeader icon={Smartphone} title="Mobile Money Activity" color="#FFD200" />
          <div className="grid grid-cols-2 gap-3">
            <StatTile label="Monthly Tx Count" value={b.monthly_tx_count?.toFixed(0)}
              sub="Avg transactions per month" accent="gold" />
            <StatTile label="Tx Consistency" value={`${(b.tx_consistency * 100).toFixed(0)}%`}
              sub="Regularity of mobile activity" accent="gold" bar={b.tx_consistency} barMax={1} />
            <StatTile label="Tx Diversity" value={b.tx_diversity}
              sub="Distinct counterparty types" accent="blue" />
            <StatTile label="Preferred Tx Hour" value={`${b.preferred_tx_time}:00`}
              sub="Most active time of day" accent="white" />
          </div>
        </div>

        {/* 3. Payment Discipline */}
        <div className="glass p-8 rounded-3xl border border-white/5">
          <SectionHeader icon={Receipt} title="Payment Discipline" color="#60a5fa" />
          <div className="grid grid-cols-2 gap-3">
            <StatTile label="Bills Paid On Time" value={`${(b.pct_bills_on_time * 100).toFixed(1)}%`}
              sub="% of utility bills on time" accent={b.pct_bills_on_time > 0.8 ? "green" : b.pct_bills_on_time > 0.5 ? "gold" : "red"}
              bar={b.pct_bills_on_time} barMax={1} />
            <StatTile label="Avg Days Late" value={`${b.avg_days_late?.toFixed(1)} days`}
              sub="Average lateness when late" accent={b.avg_days_late < 3 ? "green" : b.avg_days_late < 7 ? "gold" : "red"} />
            <StatTile label="Repeat Lateness" value={b.repeat_lateness_count}
              sub="Bills late more than once" accent={b.repeat_lateness_count === 0 ? "green" : b.repeat_lateness_count < 3 ? "gold" : "red"} />
            <StatTile label="Discipline Score" value={b.pct_bills_on_time > 0.9 && b.avg_days_late < 2 ? "Excellent" : b.pct_bills_on_time > 0.7 ? "Good" : "Poor"}
              sub="Overall payment behaviour" accent={b.pct_bills_on_time > 0.9 ? "green" : b.pct_bills_on_time > 0.7 ? "gold" : "red"} />
          </div>
        </div>

        {/* 4. Digital Engagement */}
        <div className="glass p-8 rounded-3xl border border-white/5">
          <SectionHeader icon={Activity} title="Digital Engagement" color="#CE1126" />
          <div className="grid grid-cols-2 gap-3">
            <StatTile label="Months Active" value={`${b.months_active} mo`}
              sub="Total digital history length" accent="green" bar={b.months_active} barMax={60} />
            <StatTile label="Activity Trend" value={b.activity_trend >= 0 ? `↑ ${(b.activity_trend * 100).toFixed(0)}%` : `↓ ${(Math.abs(b.activity_trend) * 100).toFixed(0)}%`}
              sub="Recent vs historical activity" accent={b.activity_trend >= 0 ? "green" : "red"} />
            <StatTile label="Device Stability" value={`${(b.device_stability * 100).toFixed(0)}%`}
              sub="Consistent device usage" accent="blue" bar={b.device_stability} barMax={1} />
            <StatTile label="Account Age" value={`${b.first_tx_date_months_ago} mo`}
              sub="Months since first transaction" accent="gold" bar={b.first_tx_date_months_ago} barMax={60} />
          </div>
        </div>
      </div>

      {/* ── Recent Transactions + Bills ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

        {/* Recent mobile money */}
        <div className="glass p-8 rounded-3xl border border-white/5">
          <SectionHeader icon={Smartphone} title="Recent Mobile Money Transactions" color="#FFD200" />
          {transactions.length === 0 ? (
            <p className="text-white/30 text-sm">No transactions found.</p>
          ) : (
            <div className="space-y-3">
              {transactions.map((tx: any) => (
                <div key={tx.id} className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5">
                  <div className="flex items-center gap-3">
                    <div className={clsx("w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold",
                      tx.type === "Inflow" ? "bg-zim-green/10 text-zim-green" : "bg-zim-red/10 text-zim-red")}>
                      {tx.type === "Inflow" ? "IN" : "OUT"}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{tx.type}</p>
                      <p className="text-[11px] text-white/30">{new Date(tx.date).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={clsx("font-bold text-sm", tx.type === "Inflow" ? "text-zim-green" : "text-zim-red")}>
                      {tx.type === "Inflow" ? "+" : "-"}${tx.amount.toLocaleString()}
                    </p>
                    <p className="text-[11px] text-white/30">Bal: ${tx.balance_after?.toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent bills */}
        <div className="glass p-8 rounded-3xl border border-white/5">
          <SectionHeader icon={Receipt} title="Recent Bill Payments" color="#60a5fa" />
          {bills.length === 0 ? (
            <p className="text-white/30 text-sm">No bill records found.</p>
          ) : (
            <div className="space-y-3">
              {bills.map((bill: any) => (
                <div key={bill.id} className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5">
                  <div className="flex items-center gap-3">
                    <div className={clsx("w-8 h-8 rounded-lg flex items-center justify-center",
                      bill.days_late === 0 ? "bg-zim-green/10" : "bg-zim-red/10")}>
                      {bill.days_late === 0
                        ? <CheckCircle2 className="w-4 h-4 text-zim-green" />
                        : <XCircle className="w-4 h-4 text-zim-red" />}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{bill.bill_type}</p>
                      <p className="text-[11px] text-white/30">Due: {new Date(bill.due_date).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-sm">${bill.amount.toLocaleString()}</p>
                    <p className={clsx("text-[11px]", bill.days_late === 0 ? "text-zim-green" : "text-zim-red")}>
                      {bill.days_late === 0 ? "On time" : `${bill.days_late}d late`}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
