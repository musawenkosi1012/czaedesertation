"use client";

import React, { useEffect, useState } from "react";
import api from "@/lib/api";
import { BarChart3, ShieldCheck, Scale, Microscope, Brain } from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, BarChart, Bar, Cell, ReferenceLine,
} from "recharts";
import { clsx } from "clsx";

/* ── Colour palette ── */
const MODEL_COLORS: Record<string, string> = {
  "Random Forest":       "#006747",
  "XGBoost":             "#FFD200",
  "Neural Network":      "#60a5fa",
  "Logistic Regression": "#f87171",
  "Ensemble":            "#a78bfa",
};

/* ── Heatmap cell colour (red → white → green) ── */
function heatColor(v: number): string {
  if (v > 0)  return `rgba(0, 103, 71, ${Math.min(v, 1) * 0.85 + 0.1})`;
  if (v < 0)  return `rgba(206, 17, 38, ${Math.min(-v, 1) * 0.85 + 0.1})`;
  return "rgba(255,255,255,0.04)";
}

/* ── Section header ── */
function SectionHeader({ icon: Icon, title, color }: { icon: any; title: string; color: string }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <Icon className="w-5 h-5" style={{ color }} />
      <h2 className="text-xl font-bold uppercase tracking-widest">{title}</h2>
    </div>
  );
}

/* ── Chart card wrapper ── */
function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="glass p-6 rounded-3xl border border-white/5">
      <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest text-center mb-5">{title}</h3>
      {children}
    </div>
  );
}

export default function AnalyticsPage() {
  const [comparison,   setComparison]   = useState<any[]>([]);
  const [fairness,     setFairness]     = useState<any[]>([]);
  const [assertions,   setAssertions]   = useState<any[]>([]);
  const [sensitivity,  setSensitivity]  = useState<any[]>([]);
  const [rocData,      setRocData]      = useState<any[]>([]);
  const [confMatrix,   setConfMatrix]   = useState<any>(null);
  const [corrData,     setCorrData]     = useState<any>(null);
  const [featureImp,   setFeatureImp]   = useState<any[]>([]);
  const [loading,      setLoading]      = useState(true);

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
        // Wake the service, then fetch sequentially to avoid concurrent 503s on cold start
        const [comparison, fairness, assertions, sensitivity] = await Promise.all([
          safeFetch("/analytics/model-comparison"),
          safeFetch("/analytics/fairness-report"),
          safeFetch("/analytics/verified-assertions"),
          safeFetch("/analytics/sensitivity-analysis"),
        ]);
        if (comparison)  setComparison(comparison);
        if (fairness)    setFairness(fairness);
        if (assertions)  setAssertions(assertions);
        if (sensitivity) setSensitivity(sensitivity);

        const [rocData, confMatrix, corrData, featureImp] = await Promise.all([
          safeFetch("/analytics/roc-data"),
          safeFetch("/analytics/confusion-matrix"),
          safeFetch("/analytics/correlation-data"),
          safeFetch("/analytics/feature-importance"),
        ]);
        if (rocData)    setRocData(rocData);
        if (confMatrix) setConfMatrix(confMatrix);
        if (corrData)   setCorrData(corrData);
        if (featureImp) setFeatureImp(featureImp);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) return <div className="p-10 text-center text-gray-500">Loading research data...</div>;

  /* ── Prep data for charts ── */

  // ROC: merge all model points into a unified fpr axis for recharts
  // We'll render each model as its own line using raw points
  const rocLines = rocData;

  // Model accuracy bar chart data
  const accuracyBarData = comparison.map((m) => ({
    name: m.Model?.replace(" ", "\n"),
    Accuracy: parseFloat((m["Test Accuracy"] * 100).toFixed(2)),
    AUC: parseFloat((m.AUC * 100).toFixed(2)),
  }));

  // Feature importance bar (horizontal)
  const featureBarData = [...featureImp]
    .sort((a, b) => a.importance - b.importance)
    .map((f) => ({
      name: f.feature.replace(/_/g, " "),
      value: parseFloat((f.importance * 100).toFixed(2)),
    }));

  // Sensitivity bar
  const sensBarData = sensitivity
    .filter((s) => s.accuracy.includes("%"))
    .map((s) => ({
      name: s.test,
      value: parseFloat(s.accuracy),
      target: parseFloat((s.target || "0").replace(/[^0-9.]/g, "")) || 0,
    }));

  return (
    <div className="space-y-14">
      <div>
        <h1 className="text-3xl font-bold mb-2 italic tracking-tight">Empirical Research Findings</h1>
        <p className="text-gray-400 font-medium">Interactive charts built from real ML model data.</p>
      </div>

      {/* 1. Model Comparison Table */}
      <div className="space-y-4">
        <SectionHeader icon={Microscope} title="Model Performance Matrix" color="#FFD200" />
        <div className="glass rounded-3xl border border-white/10 overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-white/5 text-gray-400 text-xs font-black uppercase">
              <tr>
                <th className="px-6 py-4">Model</th>
                <th className="px-6 py-4">Accuracy</th>
                <th className="px-6 py-4">Precision</th>
                <th className="px-6 py-4">Recall</th>
                <th className="px-6 py-4">ROC AUC</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {comparison.map((m) => (
                <tr key={m.Model} className="hover:bg-white/5 transition-all">
                  <td className="px-6 py-4 font-bold flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full inline-block" style={{ background: MODEL_COLORS[m.Model] || "#fff" }} />
                    {m.Model}
                  </td>
                  <td className="px-6 py-4">
                    <span className={m["Test Accuracy"] >= 0.84 ? "text-zim-green font-bold" : ""}>
                      {(m["Test Accuracy"] * 100).toFixed(2)}%
                    </span>
                  </td>
                  <td className="px-6 py-4">{(m.Precision * 100).toFixed(1)}%</td>
                  <td className="px-6 py-4">{(m.Recall * 100).toFixed(1)}%</td>
                  <td className="px-6 py-4 font-mono font-bold text-zim-gold">{m.AUC.toFixed(3)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 2. Charts Grid */}
      <div className="space-y-4">
        <SectionHeader icon={BarChart3} title="Statistical Visualizations" color="#006747" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

          {/* ROC Curves */}
          <ChartCard title="ROC Curves Comparison">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart margin={{ top: 5, right: 20, bottom: 20, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="fpr" type="number" domain={[0, 1]} tickFormatter={(v) => v.toFixed(1)}
                  label={{ value: "False Positive Rate", position: "insideBottom", offset: -10, fill: "#666", fontSize: 11 }}
                  tick={{ fill: "#666", fontSize: 11 }} />
                <YAxis domain={[0, 1]} tickFormatter={(v) => v.toFixed(1)}
                  label={{ value: "True Positive Rate", angle: -90, position: "insideLeft", fill: "#666", fontSize: 11 }}
                  tick={{ fill: "#666", fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ background: "#111", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8 }}
                  formatter={(v: any) => v.toFixed(3)}
                  labelFormatter={(v) => `FPR: ${parseFloat(v).toFixed(3)}`}
                />
                <Legend wrapperStyle={{ fontSize: 11, paddingTop: 12 }} />
                {/* Diagonal reference line */}
                <Line data={[{fpr:0,tpr:0},{fpr:1,tpr:1}]} dataKey="tpr" dot={false}
                  stroke="rgba(255,255,255,0.15)" strokeDasharray="4 4" name="Random" strokeWidth={1} />
                {rocLines.map((m) => (
                  <Line key={m.model} data={m.points} dataKey="tpr" dot={false}
                    stroke={MODEL_COLORS[m.model] || "#fff"} strokeWidth={2}
                    name={`${m.model} (AUC ${m.auc})`} />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* Model Accuracy Comparison */}
          <ChartCard title="Model Accuracy & AUC Comparison">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={accuracyBarData} margin={{ top: 5, right: 20, bottom: 30, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="name" tick={{ fill: "#666", fontSize: 10 }} />
                <YAxis domain={[80, 100]} tick={{ fill: "#666", fontSize: 11 }} unit="%" />
                <Tooltip contentStyle={{ background: "#111", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8 }}
                  formatter={(v: any) => `${v}%`} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <ReferenceLine y={84} stroke="#FFD200" strokeDasharray="4 4" label={{ value: "84% target", fill: "#FFD200", fontSize: 10 }} />
                <Bar dataKey="Accuracy" fill="#006747" radius={[4,4,0,0]}>
                  {accuracyBarData.map((_, i) => (
                    <Cell key={i} fill={Object.values(MODEL_COLORS)[i] || "#006747"} />
                  ))}
                </Bar>
                <Bar dataKey="AUC" fill="#FFD200" radius={[4,4,0,0]} opacity={0.7} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* Confusion Matrix */}
          <ChartCard title="Confusion Matrix — Random Forest">
            {confMatrix ? (
              <div className="flex flex-col items-center gap-4 py-4">
                <div className="grid grid-cols-2 gap-2 w-full max-w-sm">
                  {[
                    { label: "True Negative", value: confMatrix.tn, sub: "Correctly predicted no default", color: "#006747" },
                    { label: "False Positive", value: confMatrix.fp, sub: "Predicted default, actually OK", color: "#CE1126" },
                    { label: "False Negative", value: confMatrix.fn, sub: "Missed a default", color: "#f97316" },
                    { label: "True Positive", value: confMatrix.tp, sub: "Correctly caught default", color: "#006747" },
                  ].map((cell) => (
                    <div key={cell.label} className="p-5 rounded-2xl border flex flex-col items-center text-center"
                      style={{ borderColor: `${cell.color}44`, background: `${cell.color}11` }}>
                      <p className="text-3xl font-black mb-1" style={{ color: cell.color }}>{cell.value.toLocaleString()}</p>
                      <p className="text-xs font-bold text-white/70">{cell.label}</p>
                      <p className="text-[10px] text-white/30 mt-1 leading-tight">{cell.sub}</p>
                      <p className="text-[10px] text-white/40 mt-1">{((cell.value / confMatrix.total) * 100).toFixed(1)}%</p>
                    </div>
                  ))}
                </div>
                <div className="flex gap-8 text-sm text-white/40">
                  <span>Predicted: <strong className="text-white/60">No Default | Default</strong></span>
                </div>
              </div>
            ) : <p className="text-center text-white/30">No data</p>}
          </ChartCard>

          {/* Feature Importance */}
          <ChartCard title="Feature Importance (Random Forest)">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={featureBarData} layout="vertical" margin={{ top: 5, right: 30, bottom: 5, left: 110 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
                <XAxis type="number" tick={{ fill: "#666", fontSize: 11 }} unit="%" />
                <YAxis type="category" dataKey="name" tick={{ fill: "#aaa", fontSize: 10 }} width={105} />
                <Tooltip contentStyle={{ background: "#111", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8 }}
                  formatter={(v: any) => [`${v}%`, "Importance"]} />
                <Bar dataKey="value" radius={[0,4,4,0]}>
                  {featureBarData.map((_, i) => (
                    <Cell key={i} fill={i >= featureBarData.length - 3 ? "#FFD200" : "#006747"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* Correlation Heatmap */}
          <ChartCard title="Feature Correlation Heatmap">
            {corrData ? (
              <div className="overflow-x-auto">
                <div style={{ display: "grid", gridTemplateColumns: `80px repeat(${corrData.labels.length}, 1fr)`, gap: 2, fontSize: 10 }}>
                  {/* Top header row */}
                  <div />
                  {corrData.labels.map((l: string) => (
                    <div key={l} className="text-center text-white/40 py-1 leading-tight" style={{ fontSize: 9 }}>
                      {l.split(" ").map((w: string, i: number) => <div key={i}>{w}</div>)}
                    </div>
                  ))}
                  {/* Data rows */}
                  {corrData.matrix.map((row: number[], ri: number) => (
                    <React.Fragment key={ri}>
                      <div className="text-right pr-2 text-white/40 flex items-center justify-end leading-tight" style={{ fontSize: 9 }}>
                        {corrData.labels[ri].split(" ").map((w: string, i: number) => <span key={i}>{w} </span>)}
                      </div>
                      {row.map((val: number, ci: number) => (
                        <div key={ci}
                          className="rounded flex items-center justify-center font-mono"
                          style={{ background: heatColor(val), paddingTop: "100%", position: "relative", fontSize: 9 }}>
                          <span style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", color: Math.abs(val) > 0.4 ? "#fff" : "#999" }}>
                            {val.toFixed(2)}
                          </span>
                        </div>
                      ))}
                    </React.Fragment>
                  ))}
                </div>
                <div className="flex items-center gap-2 mt-4 justify-center text-xs text-white/30">
                  <div className="w-4 h-3 rounded" style={{ background: "rgba(206,17,38,0.8)" }} /> Negative
                  <div className="w-4 h-3 rounded mx-2" style={{ background: "rgba(255,255,255,0.04)" }} /> Neutral
                  <div className="w-4 h-3 rounded" style={{ background: "rgba(0,103,71,0.8)" }} /> Positive
                </div>
              </div>
            ) : <p className="text-center text-white/30">No data</p>}
          </ChartCard>

          {/* Sensitivity Analysis */}
          <ChartCard title="Robustness / Sensitivity Analysis">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={sensBarData} margin={{ top: 5, right: 20, bottom: 40, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="name" tick={{ fill: "#666", fontSize: 10 }} angle={-15} textAnchor="end" />
                <YAxis domain={[75, 100]} tick={{ fill: "#666", fontSize: 11 }} unit="%" />
                <Tooltip contentStyle={{ background: "#111", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8 }}
                  formatter={(v: any) => `${v}%`} />
                <ReferenceLine y={81} stroke="#FFD200" strokeDasharray="4 4" label={{ value: "81% min", fill: "#FFD200", fontSize: 10 }} />
                <Bar dataKey="value" radius={[4,4,0,0]}>
                  {sensBarData.map((d, i) => (
                    <Cell key={i} fill={d.value >= (d.target || 81) ? "#006747" : "#CE1126"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <div className="mt-2 space-y-2">
              {sensitivity.map((s) => (
                <div key={s.test} className="flex items-center justify-between text-xs px-2">
                  <span className="text-white/50">{s.test}</span>
                  <span className={clsx("font-bold", s.status === "PASS" ? "text-zim-green" : s.status === "INFO" ? "text-zim-gold" : "text-zim-red")}>
                    {s.accuracy} — {s.status}
                  </span>
                </div>
              ))}
            </div>
          </ChartCard>

        </div>
      </div>

      {/* 3. Fairness Report */}
      <div className="space-y-4">
        <SectionHeader icon={Scale} title="Algorithmic Fairness Audit" color="#CE1126" />
        <div className="glass rounded-3xl border border-white/10 overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-white/5 text-gray-400 text-xs font-black uppercase">
              <tr>
                <th className="px-6 py-4">Demographic Group</th>
                <th className="px-6 py-4">Sample Size</th>
                <th className="px-6 py-4">Accuracy</th>
                <th className="px-6 py-4">False Positive Rate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {fairness.map((f) => (
                <tr key={f.Group + f.Category} className="hover:bg-white/5 transition-all">
                  <td className="px-6 py-4">
                    <span className="text-gray-400 text-xs uppercase block">{f.Category}</span>
                    <span className="font-bold text-lg">{f.Group}</span>
                  </td>
                  <td className="px-6 py-4">{f["Sample Size"]}</td>
                  <td className="px-6 py-4">{(f.Accuracy * 100).toFixed(2)}%</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-4">
                      <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden min-w-[100px]">
                        <div className="h-full bg-zim-red rounded-full" style={{ width: `${f.FPR * 100 * 5}%` }} />
                      </div>
                      <span className="font-mono">{(f.FPR * 100).toFixed(2)}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. Assertions + Sensitivity tables */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        <div className="space-y-4">
          <SectionHeader icon={ShieldCheck} title="Dissertation Assertions" color="#FFD200" />
          <div className="glass rounded-3xl border border-white/10 overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="bg-white/5 text-gray-400 text-[10px] font-black uppercase">
                <tr>
                  <th className="px-6 py-4">Assertion</th>
                  <th className="px-6 py-4 text-center">Value</th>
                  <th className="px-6 py-4 text-center">Target</th>
                  <th className="px-6 py-4 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {assertions.map((a) => (
                  <tr key={a.assertion} className="hover:bg-white/5 transition-all">
                    <td className="px-6 py-4 font-medium">{a.assertion}</td>
                    <td className="px-6 py-4 text-center font-mono">{a.value}</td>
                    <td className="px-6 py-4 text-center text-gray-500">{a.target}</td>
                    <td className="px-6 py-4 text-right">
                      <span className={a.status === "PASS" ? "text-zim-green font-bold" : "text-zim-red"}>{a.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-4">
          <SectionHeader icon={Microscope} title="Sensitivity Analysis" color="#006747" />
          <div className="glass rounded-3xl border border-white/10 overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="bg-white/5 text-gray-400 text-[10px] font-black uppercase">
                <tr>
                  <th className="px-6 py-4">Stress Test</th>
                  <th className="px-6 py-4 text-center">Accuracy</th>
                  <th className="px-6 py-4 text-center">Target</th>
                  <th className="px-6 py-4 text-right">Result</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {sensitivity.map((s) => (
                  <tr key={s.test} className="hover:bg-white/5 transition-all">
                    <td className="px-6 py-4 font-medium">{s.test}</td>
                    <td className="px-6 py-4 text-center font-mono">{s.accuracy}</td>
                    <td className="px-6 py-4 text-center text-gray-500">{s.target}</td>
                    <td className="px-6 py-4 text-right font-bold text-zim-gold">{s.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
