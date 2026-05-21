"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { TrendingUp, AlertCircle, CheckCircle2, DollarSign, Calendar, Percent, Target, Eye, EyeOff } from "lucide-react";
import { clsx } from "clsx";

export default function LoanCalculatorPage() {
  const [borrowers, setBorrowers] = useState<any[]>([]);
  const [selectedBorrowerId, setSelectedBorrowerId] = useState<number | null>(null);
  const [sizing, setSizing] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);

  useEffect(() => {
    async function fetchBorrowers() {
      try {
        const res = await api.get("/borrowers/");
        setBorrowers(res.data);
      } catch (err) {
        console.error("Failed to fetch borrowers", err);
      }
    }
    fetchBorrowers();
  }, []);

  const calculateSize = async (borrowerId: number) => {
    setLoading(true);
    setError("");
    try {
      const res = await api.get(`/loans/sizing/${borrowerId}`);
      setSizing(res.data);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to calculate loan size");
      setSizing(null);
    } finally {
      setLoading(false);
    }
  };

  const handleBorrowerSelect = (id: number) => {
    setSelectedBorrowerId(id);
    calculateSize(id);
  };

  const getRiskColor = (riskCategory: string) => {
    switch (riskCategory) {
      case "LOW": return "text-zim-green bg-zim-green/10 border-zim-green/20";
      case "MEDIUM": return "text-zim-gold bg-zim-gold/10 border-zim-gold/20";
      case "HIGH": return "text-orange-400 bg-orange-400/10 border-orange-400/20";
      case "VERY_HIGH": return "text-zim-red bg-zim-red/10 border-zim-red/20";
      default: return "text-gray-400 bg-white/5 border-white/10";
    }
  };

  const getBarColor = (key: string) => {
    switch (key) {
      case "income_based": return "bg-blue-500";
      case "dti_based": return "bg-purple-500";
      case "risk_adjusted": return "bg-orange-500";
      default: return "bg-zim-red";
    }
  };

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-3xl font-bold mb-2">Loan Sizing Calculator</h1>
        <p className="text-gray-400">AI-powered recommendations combining income, DTI, risk, and portfolio constraints.</p>
      </div>

      {/* Borrower Selection */}
      <div className="glass p-8 rounded-3xl border border-white/10">
        <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
          <Target className="w-5 h-5 text-zim-gold" />
          Select Borrower
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {borrowers.map((borrower) => (
            <button
              key={borrower.id}
              onClick={() => handleBorrowerSelect(borrower.id)}
              className={clsx(
                "p-6 rounded-2xl border-2 transition-all text-left",
                selectedBorrowerId === borrower.id
                  ? "border-zim-green bg-zim-green/10"
                  : "border-white/10 bg-white/5 hover:border-zim-gold hover:bg-white/10"
              )}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-full bg-zim-green/20 flex items-center justify-center text-zim-green font-bold">
                  {borrower.name?.charAt(0) || 'B'}
                </div>
                {selectedBorrowerId === borrower.id && (
                  <CheckCircle2 className="w-5 h-5 text-zim-green" />
                )}
              </div>
              <h3 className="font-bold mb-1">{borrower.name}</h3>
              <p className="text-xs text-gray-500">ID: {borrower.id}</p>
              <p className="text-sm text-zim-green font-semibold mt-2">${borrower.monthly_income?.toLocaleString()}/mo</p>
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="glass p-6 rounded-2xl border border-zim-red/20 bg-zim-red/5 text-zim-red">
          {error}
        </div>
      )}

      {loading && (
        <div className="glass p-20 rounded-3xl border border-white/10 text-center text-gray-500">
          Calculating optimal loan size...
        </div>
      )}

      {sizing && !loading && (
        <div className="space-y-8">
          {/* Recommended Offer - Prominent */}
          <div className="glass p-10 rounded-3xl border border-zim-green/20 bg-gradient-to-br from-zim-green/10 via-transparent to-transparent relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-10">
              <TrendingUp className="w-40 h-40 text-zim-green" />
            </div>

            <h2 className="text-2xl font-bold mb-8 flex items-center gap-3">
              <CheckCircle2 className="w-6 h-6 text-zim-green" />
              Recommended Loan Offer
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 relative z-10">
              <div className="space-y-2">
                <span className="text-xs font-black uppercase text-gray-500">Loan Amount</span>
                <div className="text-4xl font-black text-zim-green">
                  ${sizing.recommended_offer.loan_amount.toLocaleString()}
                </div>
                <span className="text-xs text-gray-500">
                  Limited by: <strong>{sizing.recommended_offer.limiting_factor}</strong>
                </span>
              </div>

              <div className="space-y-2">
                <span className="text-xs font-black uppercase text-gray-500">Term & Rate</span>
                <div className="space-y-1">
                  <div className="text-2xl font-bold text-white flex items-baseline gap-2">
                    <Calendar className="w-5 h-5 text-zim-gold" />
                    {sizing.recommended_offer.term_days} days
                  </div>
                  <div className="text-2xl font-bold text-zim-gold flex items-baseline gap-2">
                    <Percent className="w-5 h-5" />
                    {sizing.recommended_offer.interest_rate_annual}%/yr
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <span className="text-xs font-black uppercase text-gray-500">Monthly Payment</span>
                <div className="text-3xl font-black text-white">
                  ${sizing.recommended_offer.monthly_payment.toLocaleString()}
                </div>
                <span className="text-xs text-gray-500">
                  Total interest: ${sizing.recommended_offer.total_interest.toLocaleString()}
                </span>
              </div>

              <div className="space-y-2">
                <span className="text-xs font-black uppercase text-gray-500">Total Repayment</span>
                <div className="text-3xl font-black text-zim-gold">
                  ${sizing.recommended_offer.total_repayment.toLocaleString()}
                </div>
                <span className="text-xs text-gray-500">
                  Over {sizing.recommended_offer.term_days} days
                </span>
              </div>
            </div>
          </div>

          {/* Financial Details */}
          <div className="glass p-8 rounded-3xl border border-white/10">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-zim-gold" />
              Financial Analysis
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="p-6 bg-white/5 rounded-2xl border border-white/10">
                <span className="text-xs font-bold text-gray-500 block uppercase mb-2">Expected Loss</span>
                <span className="text-2xl font-black text-zim-red">
                  ${sizing.financial_details.expected_loss_usd.toLocaleString()}
                </span>
                <span className="text-xs text-gray-500 block mt-2">
                  {(sizing.risk_assessment.probability_of_default_pct).toFixed(2)}% PD × 50% LGD
                </span>
              </div>

              <div className="p-6 bg-white/5 rounded-2xl border border-white/10">
                <span className="text-xs font-bold text-gray-500 block uppercase mb-2">Expected Revenue</span>
                <span className="text-2xl font-black text-zim-green">
                  ${sizing.financial_details.expected_revenue_usd.toLocaleString()}
                </span>
                <span className="text-xs text-gray-500 block mt-2">Interest minus expected loss</span>
              </div>

              <div className="p-6 bg-white/5 rounded-2xl border border-white/10">
                <span className="text-xs font-bold text-gray-500 block uppercase mb-2">ROI</span>
                <span className="text-2xl font-black text-zim-gold">
                  {sizing.financial_details.roi.toFixed(2)}%
                </span>
                <span className="text-xs text-gray-500 block mt-2">Return on investment</span>
              </div>

              <div className="p-6 bg-white/5 rounded-2xl border border-white/10">
                <span className="text-xs font-bold text-gray-500 block uppercase mb-2">Portfolio Exposure</span>
                <span className="text-2xl font-black text-blue-400">
                  {sizing.portfolio_impact.exposure_pct.toFixed(4)}%
                </span>
                <span className="text-xs text-gray-500 block mt-2">Of $5M portfolio</span>
              </div>
            </div>
          </div>

          {/* Risk Assessment */}
          <div className="glass p-8 rounded-3xl border border-white/10">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-zim-gold" />
              Risk Assessment
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="p-6 bg-white/5 rounded-2xl border border-white/10">
                <span className="text-xs font-bold text-gray-500 block uppercase mb-2">Probability of Default</span>
                <span className="text-2xl font-black text-white">
                  {sizing.risk_assessment.probability_of_default_pct.toFixed(2)}%
                </span>
                <div className="mt-3 w-full bg-white/10 rounded-full h-2">
                  <div
                    className="bg-zim-red rounded-full h-2"
                    style={{ width: `${Math.min(sizing.risk_assessment.probability_of_default_pct, 100)}%` }}
                  />
                </div>
              </div>

              <div className="p-6 bg-white/5 rounded-2xl border border-white/10">
                <span className="text-xs font-bold text-gray-500 block uppercase mb-2">Loss Given Default</span>
                <span className="text-2xl font-black text-white">
                  {sizing.risk_assessment.loss_given_default_pct.toFixed(1)}%
                </span>
                <span className="text-xs text-gray-500 block mt-2">For unsecured loans</span>
              </div>

              <div className="p-6 bg-white/5 rounded-2xl border border-white/10">
                <span className="text-xs font-bold text-gray-500 block uppercase mb-2">Expected Loss Rate</span>
                <span className="text-2xl font-black text-zim-red">
                  {sizing.risk_assessment.expected_loss_rate.toFixed(2)}%
                </span>
                <span className="text-xs text-gray-500 block mt-2">Per dollar loaned</span>
              </div>

              <div className="p-6 bg-white/5 rounded-2xl border border-white/10">
                <span className="text-xs font-bold text-gray-500 block uppercase mb-2">Rate Covers Loss</span>
                <div className="mt-4">
                  {sizing.risk_assessment.interest_rate_covers_loss ? (
                    <div className="flex items-center gap-2 text-zim-green">
                      <CheckCircle2 className="w-5 h-5" />
                      <span className="font-bold">Yes</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-zim-red">
                      <AlertCircle className="w-5 h-5" />
                      <span className="font-bold">No</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* All Calculation Methods */}
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="w-full flex items-center justify-center gap-2 py-3 text-gray-400 hover:text-white transition-colors"
          >
            {showAdvanced ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            {showAdvanced ? "Hide" : "Show"} Calculation Details
          </button>

          {showAdvanced && (
            <div className="space-y-6">
              <h2 className="text-xl font-bold">Loan Sizing Methodology</h2>
              <p className="text-gray-400 text-sm">
                The recommended loan amount is the <strong>MINIMUM</strong> of all four constraints below, ensuring the loan stays within all regulatory, risk, and portfolio limits.
              </p>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Income-Based */}
                <div className="glass p-8 rounded-3xl border border-white/10 relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-6 opacity-5">
                    <TrendingUp className="w-24 h-24" />
                  </div>
                  <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                    <span className="w-8 h-8 flex items-center justify-center bg-blue-500/20 text-blue-400 rounded-lg font-bold text-xs">1</span> Income-Based Limit
                  </h3>
                  <div className="space-y-4 relative z-10">
                    <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                      <span className="text-xs font-bold text-gray-500 block uppercase mb-2">Maximum Amount</span>
                      <span className="text-3xl font-black text-blue-400">
                        ${sizing.calculation_methods.income_based.amount.toLocaleString()}
                      </span>
                    </div>
                    <div className="text-sm text-gray-400">
                      <strong className="text-white">{sizing.calculation_methods.income_based.explanation}</strong>
                    </div>
                  </div>
                </div>

                {/* DTI-Based */}
                <div className="glass p-8 rounded-3xl border border-white/10 relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-6 opacity-5">
                    <TrendingUp className="w-24 h-24" />
                  </div>
                  <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                    <span className="w-8 h-8 flex items-center justify-center bg-purple-500/20 text-purple-400 rounded-lg font-bold text-xs">2</span> DTI-Based Limit
                  </h3>
                  <div className="space-y-4 relative z-10">
                    <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                      <span className="text-xs font-bold text-gray-500 block uppercase mb-2">Maximum Amount</span>
                      <span className="text-3xl font-black text-purple-400">
                        ${sizing.calculation_methods.dti_based.amount.toLocaleString()}
                      </span>
                    </div>
                    <div className="text-sm text-gray-400">
                      <strong className="text-white">{sizing.calculation_methods.dti_based.explanation}</strong>
                    </div>
                  </div>
                </div>

                {/* Risk-Adjusted */}
                <div className="glass p-8 rounded-3xl border border-white/10 relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-6 opacity-5">
                    <TrendingUp className="w-24 h-24" />
                  </div>
                  <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                    <span className="w-8 h-8 flex items-center justify-center bg-orange-500/20 text-orange-400 rounded-lg font-bold text-xs">3</span> Risk-Adjusted Limit
                  </h3>
                  <div className="space-y-4 relative z-10">
                    <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                      <span className="text-xs font-bold text-gray-500 block uppercase mb-2">Maximum Amount</span>
                      <span className="text-3xl font-black text-orange-400">
                        ${sizing.calculation_methods.risk_adjusted.amount.toLocaleString()}
                      </span>
                    </div>
                    <div className="text-sm text-gray-400">
                      <strong className="text-white">{sizing.calculation_methods.risk_adjusted.explanation}</strong>
                    </div>
                  </div>
                </div>

                {/* Expected Loss */}
                <div className="glass p-8 rounded-3xl border border-white/10 relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-6 opacity-5">
                    <TrendingUp className="w-24 h-24" />
                  </div>
                  <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                    <span className="w-8 h-8 flex items-center justify-center bg-zim-red/20 text-zim-red rounded-lg font-bold text-xs">4</span> Expected Loss Limit
                  </h3>
                  <div className="space-y-4 relative z-10">
                    <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                      <span className="text-xs font-bold text-gray-500 block uppercase mb-2">Maximum Amount</span>
                      <span className="text-3xl font-black text-zim-red">
                        ${sizing.calculation_methods.expected_loss.amount.toLocaleString()}
                      </span>
                    </div>
                    <div className="text-sm text-gray-400">
                      <strong className="text-white">{sizing.calculation_methods.expected_loss.explanation}</strong>
                      <div className="mt-2 text-xs">
                        Expected loss: ${sizing.calculation_methods.expected_loss.expected_loss_per_100_usd} per $100
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Constraint Comparison */}
              <div className="glass p-8 rounded-3xl border border-white/10">
                <h3 className="text-lg font-bold mb-6">Constraint Comparison</h3>
                <div className="space-y-4">
                  {Object.entries(sizing.calculation_methods).map(([key, method]: [string, any]) => (
                    <div key={key} className="flex items-center gap-4">
                      <div className="flex-1">
                        <span className="text-sm font-bold capitalize text-gray-300">{key.replaceAll("_", " ")}</span>
                        <div className="mt-1 w-full bg-white/10 rounded-full h-2">
                          <div
                            className={clsx(
                              "rounded-full h-2",
                              getBarColor(key)
                            )}
                            style={{
                              width: `${Math.min((method.amount / sizing.calculation_methods.income_based.amount) * 100, 100)}%`
                            }}
                          />
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold">${method.amount.toLocaleString()}</div>
                        {key === sizing.recommended_offer.limiting_factor.replaceAll("-", "_") && (
                          <span className="text-xs text-zim-red font-bold">← LIMITING</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Borrower Profile */}
          <div className="glass p-8 rounded-3xl border border-white/10">
            <h2 className="text-xl font-bold mb-6">Borrower Profile</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="p-6 bg-white/5 rounded-2xl border border-white/10">
                <span className="text-xs font-bold text-gray-500 block uppercase mb-2">Monthly Income</span>
                <span className="text-2xl font-black text-zim-green">
                  ${sizing.monthly_income.toLocaleString()}
                </span>
              </div>

              <div className="p-6 bg-white/5 rounded-2xl border border-white/10">
                <span className="text-xs font-bold text-gray-500 block uppercase mb-2">Risk Category</span>
                <span className={clsx("text-2xl font-black mt-2 px-3 py-1 rounded-lg border inline-block", getRiskColor(sizing.risk_category))}>
                  {sizing.risk_category}
                </span>
              </div>

              <div className="p-6 bg-white/5 rounded-2xl border border-white/10">
                <span className="text-xs font-bold text-gray-500 block uppercase mb-2">Probability of Default</span>
                <span className="text-2xl font-black text-white">
                  {(sizing.probability_of_default * 100).toFixed(2)}%
                </span>
              </div>

              <div className="p-6 bg-white/5 rounded-2xl border border-white/10">
                <span className="text-xs font-bold text-gray-500 block uppercase mb-2">Recommendation</span>
                <span className="text-lg font-bold text-zim-green mt-2">Offer Qualified</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
