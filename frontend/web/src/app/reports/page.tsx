"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { Download, FileText, CheckCircle2, AlertCircle, Info, Beaker, FileCheck, Loader2 } from "lucide-react";

async function downloadCsv(endpoint: string, filename: string) {
  const res = await api.get(endpoint, { responseType: "blob" });
  const url = URL.createObjectURL(new Blob([res.data], { type: "text/csv" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function ReportsPage() {
  const [assertions, setAssertions] = useState<any[]>([]);
  const [sensitivity, setSensitivity] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const [assRes, senRes] = await Promise.all([
          api.get("/analytics/verified-assertions"),
          api.get("/analytics/sensitivity-analysis"),
        ]);
        setAssertions(assRes.data);
        setSensitivity(senRes.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  async function handleDownload(endpoint: string, filename: string) {
    setDownloading(filename);
    try {
      await downloadCsv(endpoint, filename);
    } finally {
      setDownloading(null);
    }
  }

  async function handleExportAll() {
    setDownloading("all");
    try {
      await downloadCsv("/analytics/export/borrowers", "borrowers.csv");
      await downloadCsv("/analytics/export/model-comparison", "model_comparison.csv");
      await downloadCsv("/analytics/export/fairness", "fairness_analysis.csv");
    } finally {
      setDownloading(null);
    }
  }

  if (loading) return <div className="p-10 text-center text-gray-500">Loading dissertation reports...</div>;

  return (
    <div className="space-y-12">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold mb-2">Research & Compliance</h1>
          <p className="text-gray-400 font-medium">Final validation against dissertation Appendix P & Chapter 4.</p>
        </div>
        <button
          onClick={handleExportAll}
          disabled={downloading !== null}
          className="px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl flex items-center gap-2 text-sm font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {downloading === "all" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
          Export All Data (CSV)
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-10">
        {/* Dissertation Assertions */}
        <div className="space-y-6">
          <div className="flex items-center gap-2">
            <FileCheck className="w-5 h-5 text-zim-green" />
            <h2 className="text-xl font-bold uppercase tracking-widest">Dissertation Assertions</h2>
          </div>
          <div className="glass rounded-3xl border border-white/10 overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-white/5 text-gray-400 text-[10px] font-black uppercase tracking-widest">
                <tr>
                  <th className="px-6 py-4">Assertion</th>
                  <th className="px-6 py-4">Actual</th>
                  <th className="px-6 py-4">Target</th>
                  <th className="px-6 py-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {assertions.map((ass) => (
                  <tr key={ass.assertion} className="hover:bg-white/5 transition-all">
                    <td className="px-6 py-4 text-sm font-medium">{ass.assertion}</td>
                    <td className="px-6 py-4 font-mono text-sm">{ass.value}</td>
                    <td className="px-6 py-4 text-xs text-gray-500">{ass.target}</td>
                    <td className="px-6 py-4 text-center">
                       {ass.status === "PASS" ? (
                         <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-zim-green/20 text-zim-green text-[10px] font-black">
                           <CheckCircle2 className="w-3 h-3" /> PASS
                         </span>
                       ) : (
                         <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-zim-red/20 text-zim-red text-[10px] font-black">
                           <AlertCircle className="w-3 h-3" /> FAIL
                         </span>
                       )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Sensitivity & Robustness */}
        <div className="space-y-6">
          <div className="flex items-center gap-2">
            <Beaker className="w-5 h-5 text-zim-gold" />
            <h2 className="text-xl font-bold uppercase tracking-widest">Robustness Analysis</h2>
          </div>
          <div className="grid grid-cols-1 gap-4">
             {sensitivity.map((test) => (
               <div key={test.test} className="glass p-6 rounded-2xl border border-white/5 flex items-center justify-between">
                  <div className="space-y-1">
                     <h3 className="font-bold">{test.test}</h3>
                     <p className="text-xs text-gray-500">Target: {test.target}</p>
                  </div>
                  <div className="text-right">
                     <span className="text-2xl font-black block text-zim-gold">{test.accuracy}</span>
                     <span className="text-[10px] text-gray-400 uppercase font-black tracking-widest">Accuracy</span>
                  </div>
               </div>
             ))}
          </div>

          <div className="p-6 bg-blue-400/5 border border-blue-400/10 rounded-2xl flex gap-4">
             <Info className="w-6 h-6 text-blue-400 shrink-0" />
             <div className="space-y-1">
                <h4 className="text-sm font-bold text-blue-400">Methodology Note</h4>
                <p className="text-xs text-gray-400 leading-relaxed">
                  Sensitivity tests are performed by injecting Gaussian noise into numerical features and evaluating model degradation. "Feature Removal" is simulated via mean-imputation to assess information loss.
                </p>
             </div>
          </div>
        </div>
      </div>

      {/* Export Section */}
      <div className="space-y-6 pt-6">
         <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-gray-400" />
            <h2 className="text-xl font-bold uppercase tracking-widest">Appendix Exports</h2>
         </div>
         <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { name: "Raw Synthetic Data", file: "borrowers.csv", endpoint: "/analytics/export/borrowers", size: "~400 KB" },
              { name: "Model Performance Matrix", file: "model_comparison.csv", endpoint: "/analytics/export/model-comparison", size: "~1 KB" },
              { name: "Fairness Audit Logs", file: "fairness_analysis.csv", endpoint: "/analytics/export/fairness", size: "~2 KB" },
            ].map((exp) => (
              <div key={exp.name} className="glass p-6 rounded-2xl border border-white/5 hover:border-white/20 transition-all flex flex-col justify-between group">
                 <div>
                    <h3 className="font-bold group-hover:text-zim-gold transition-colors">{exp.name}</h3>
                    <p className="text-xs text-gray-500 font-mono mt-1">{exp.file}</p>
                 </div>
                 <div className="mt-6 flex items-center justify-between">
                    <span className="text-xs text-gray-400">{exp.size}</span>
                    <button
                      onClick={() => handleDownload(exp.endpoint, exp.file)}
                      disabled={downloading !== null}
                      className="text-zim-green hover:text-zim-green/80 text-xs font-black uppercase tracking-widest disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1"
                    >
                      {downloading === exp.file ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
                      Download
                    </button>
                 </div>
              </div>
            ))}
         </div>
      </div>
    </div>
  );
}
