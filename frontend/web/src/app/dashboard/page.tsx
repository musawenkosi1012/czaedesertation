"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import api from "@/lib/api";
import {
  Users, CreditCard, AlertTriangle, TrendingUp,
  CheckCircle2, BarChart3, ShieldCheck, ArrowRight, Activity,
} from "lucide-react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";

const RISK_COLORS: Record<string, string> = {
  LOW: "#006747",
  MEDIUM: "#FFD200",
  HIGH: "#FF8C00",
  VERY_HIGH: "#CE1126",
};

const RISK_LABELS: Record<string, string> = {
  LOW: "Low Risk",
  MEDIUM: "Medium Risk",
  HIGH: "High Risk",
  VERY_HIGH: "Very High",
};

export default function DashboardPage() {
  const [stats, setStats] = useState<any>(null);
  const [assertions, setAssertions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function safeFetch(endpoint: string, retries = 2): Promise<any> {
      for (let i = 0; i <= retries; i++) {
        try {
          const r = await api.get(endpoint);
          return r.data;
        } catch {
          if (i < retries) await new Promise(res => setTimeout(res, 3000));
        }
      }
      return null;
    }

    async function fetchData() {
      try {
        const [stats, assertions] = await Promise.all([
          safeFetch("/analytics/dashboard-stats"),
          safeFetch("/analytics/verified-assertions"),
        ]);
        if (stats)      setStats(stats);
        if (assertions) setAssertions(assertions);
      } catch (err) {
        console.error("Dashboard fetch error", err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const rfAccuracy = assertions.find(a => a.assertion === "Random Forest Accuracy")?.value ?? "—";
  const modelAUC = assertions.find(a => a.assertion === "Model AUC-ROC")?.value ?? "—";
  const passingCount = assertions.filter(a => a.status === "PASS").length;
  const totalAssertions = assertions.length;

  const riskData = Object.entries(stats?.risk_distribution || {})
    .map(([key, value]) => ({
      name: RISK_LABELS[key] || key,
      key,
      value: value as number,
      fill: RISK_COLORS[key] || "#555",
    }))
    .filter(d => d.value > 0);

  const totalScored = riskData.reduce((sum, d) => sum + d.value, 0);

  const cards = [
    {
      label: "Total Borrowers",
      value: stats?.total_borrowers?.toLocaleString() ?? "—",
      icon: Users,
      accent: "text-blue-400",
      bg: "bg-blue-400/10",
      note: "registered profiles",
    },
    {
      label: "Active Loans",
      value: stats?.total_loans?.toLocaleString() ?? "—",
      icon: CreditCard,
      accent: "text-zim-green",
      bg: "bg-zim-green/10",
      note: "approved + disbursed",
    },
    {
      label: "Default Rate",
      value: stats?.default_rate != null ? `${(stats.default_rate * 100).toFixed(1)}%` : "—",
      icon: AlertTriangle,
      accent: "text-orange-400",
      bg: "bg-orange-400/10",
      note: "historical portfolio",
    },
    {
      label: "Avg Credit Score",
      value: stats?.avg_score ? Math.round(stats.avg_score).toString() : "—",
      icon: TrendingUp,
      accent: "text-zim-gold",
      bg: "bg-zim-gold/10",
      note: "across scored borrowers",
    },
    {
      label: "Model Assertions",
      value: totalAssertions > 0 ? `${passingCount}/${totalAssertions}` : "—",
      icon: CheckCircle2,
      accent: "text-emerald-400",
      bg: "bg-emerald-400/10",
      note: "all validations passing",
    },
  ];

  const quickActions = [
    { label: "Borrowers", icon: Users, href: "/borrowers", color: "text-blue-400", border: "border-blue-500/20 hover:border-blue-400/50" },
    { label: "Loans", icon: CreditCard, href: "/loans", color: "text-zim-green", border: "border-zim-green/20 hover:border-zim-green/50" },
    { label: "Analytics", icon: BarChart3, href: "/analytics", color: "text-zim-gold", border: "border-zim-gold/20 hover:border-zim-gold/50" },
    { label: "Reports", icon: ShieldCheck, href: "/reports", color: "text-purple-400", border: "border-purple-500/20 hover:border-purple-400/50" },
  ];

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 w-72 bg-white/5 rounded-lg" />
        <div className="grid grid-cols-5 gap-4">
          {[...Array(5)].map((_, i) => <div key={i} className="h-32 bg-white/5 rounded-2xl" />)}
        </div>
        <div className="grid grid-cols-4 gap-3">
          {[...Array(4)].map((_, i) => <div key={i} className="h-12 bg-white/5 rounded-xl" />)}
        </div>
        <div className="grid grid-cols-2 gap-6">
          <div className="h-80 bg-white/5 rounded-2xl" />
          <div className="h-80 bg-white/5 rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Executive Dashboard</h1>
          <p className="text-gray-500 text-sm mt-0.5">Czae Credit Scoring System · Zimbabwe Lending Analytics</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zim-green/10 border border-zim-green/20">
          <Activity className="w-3.5 h-3.5 text-zim-green" />
          <span className="text-xs font-medium text-zim-green">System Active</span>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {cards.map((card) => (
          <div
            key={card.label}
            className="glass p-5 rounded-2xl border border-white/5 hover:border-white/10 transition-all"
          >
            <div className={`inline-flex p-2.5 rounded-xl ${card.bg} mb-4`}>
              <card.icon className={`w-5 h-5 ${card.accent}`} />
            </div>
            <p className="text-gray-500 text-[10px] font-semibold uppercase tracking-wider mb-1">{card.label}</p>
            <p className={`text-3xl font-bold ${card.accent} mb-1 tabular-nums`}>{card.value}</p>
            <p className="text-gray-600 text-xs">{card.note}</p>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {quickActions.map(action => (
          <Link
            key={action.href}
            href={action.href}
            className={`flex items-center justify-between px-4 py-3 rounded-xl border bg-white/[0.02] hover:bg-white/[0.04] transition-all ${action.border}`}
          >
            <div className="flex items-center gap-3">
              <action.icon className={`w-4 h-4 ${action.color}`} />
              <span className="text-sm font-medium text-gray-300">{action.label}</span>
            </div>
            <ArrowRight className="w-3.5 h-3.5 text-gray-600" />
          </Link>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Risk Distribution */}
        <div className="glass p-6 rounded-2xl border border-white/5">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-sm font-semibold text-white">Risk Distribution</h3>
            <span className="text-xs text-gray-500 tabular-nums">{totalScored.toLocaleString()} scored</span>
          </div>

          {totalScored === 0 ? (
            <div className="h-56 flex items-center justify-center text-gray-500 text-sm text-center">
              No borrowers scored yet.<br />
              <span className="text-xs text-gray-600">Run credit assessments to see distribution.</span>
            </div>
          ) : (
            <>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={riskData}
                      innerRadius={52}
                      outerRadius={76}
                      paddingAngle={3}
                      dataKey="value"
                      strokeWidth={0}
                    >
                      {riskData.map((entry) => (
                        <Cell key={entry.key} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        background: "#111",
                        border: "1px solid rgba(255,255,255,0.08)",
                        borderRadius: 8,
                        fontSize: 12,
                      }}
                      itemStyle={{ color: "#ccc" }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-2 mt-3">
                {riskData.map(d => (
                  <div key={d.key} className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: d.fill }} />
                    <span className="text-xs text-gray-400 truncate">{d.name}</span>
                    <span className="text-xs font-bold text-white ml-auto tabular-nums">{d.value}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* AI Model Health */}
        <div className="glass p-6 rounded-2xl border border-white/5">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-sm font-semibold text-white">AI Model Health</h3>
            <span className="text-[10px] px-2 py-1 rounded-full bg-emerald-400/10 text-emerald-400 border border-emerald-400/20 font-semibold">
              Ensemble v2.0
            </span>
          </div>

          <div className="space-y-5">
            {/* RF Accuracy */}
            <div>
              <div className="flex justify-between text-xs mb-1.5">
                <span className="text-gray-400">Random Forest Accuracy</span>
                <span className="font-bold text-zim-green">{rfAccuracy}</span>
              </div>
              <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                <div
                  className="h-full bg-zim-green rounded-full shadow-[0_0_8px_rgba(0,103,71,0.6)] transition-all duration-700"
                  style={{ width: rfAccuracy !== "—" ? rfAccuracy : "0%" }}
                />
              </div>
            </div>

            {/* AUC */}
            <div>
              <div className="flex justify-between text-xs mb-1.5">
                <span className="text-gray-400">AUC-ROC Score</span>
                <span className="font-bold text-zim-gold">{modelAUC}</span>
              </div>
              <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                <div
                  className="h-full bg-zim-gold rounded-full shadow-[0_0_8px_rgba(255,210,0,0.4)] transition-all duration-700"
                  style={{
                    width: modelAUC !== "—" ? `${Math.min(parseFloat(modelAUC) * 100, 100)}%` : "0%",
                  }}
                />
              </div>
            </div>

            {/* Assertions */}
            <div>
              <div className="flex justify-between text-xs mb-1.5">
                <span className="text-gray-400">Dissertation Validations</span>
                <span className="font-bold text-blue-400">
                  {totalAssertions > 0 ? `${passingCount}/${totalAssertions} passing` : "—"}
                </span>
              </div>
              <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-400 rounded-full transition-all duration-700"
                  style={{ width: totalAssertions > 0 ? `${(passingCount / totalAssertions) * 100}%` : "0%" }}
                />
              </div>
            </div>

            {/* Validation grid */}
            {assertions.length > 0 && (
              <div className="pt-3 border-t border-white/5">
                <p className="text-[9px] font-bold text-gray-600 uppercase tracking-[0.15em] mb-2">Validation Checks</p>
                <div className="grid grid-cols-2 gap-y-1.5 gap-x-3">
                  {assertions.slice(0, 8).map(a => (
                    <div key={a.assertion} className="flex items-center gap-1.5">
                      <div
                        className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${a.status === "PASS" ? "bg-emerald-400" : "bg-red-400"}`}
                      />
                      <span className="text-[10px] text-gray-500 truncate">
                        {a.assertion.replace("Random Forest ", "RF ").replace("Dissertation ", "")}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
