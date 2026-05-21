"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  ShieldCheck,
  BarChart3,
  Users,
  Zap,
  ArrowRight,
  ChevronRight,
  Brain,
  Scale,
  Smartphone,
  TrendingUp,
  Globe,
} from "lucide-react";

/* ─── Animated counter ─── */
function useCounter(target: number, duration = 1800, start = false) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!start) return;
    let startTime: number | null = null;
    const step = (ts: number) => {
      if (!startTime) startTime = ts;
      const progress = Math.min((ts - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.floor(eased * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [target, duration, start]);
  return value;
}

/* ─── Intersection observer hook ─── */
function useInView(threshold = 0.2) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setInView(true); }, { threshold });
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, inView };
}

/* ─── Stats ─── */
const STATS = [
  { label: "Accuracy", value: 95, suffix: "%", description: "Random Forest model" },
  { label: "AUC-ROC", value: 96, suffix: "%", description: "Discrimination power" },
  { label: "Borrowers", value: 5000, suffix: "+", description: "Synthetic records" },
  { label: "ML Models", value: 5, suffix: "", description: "Trained & compared" },
];

/* ─── Features ─── */
const FEATURES = [
  {
    icon: Brain,
    title: "Explainable AI",
    description: "Every credit decision backed by SHAP values — transparent feature importance drivers your team can trust and present.",
    accent: "#006747",
  },
  {
    icon: Scale,
    title: "Fairness Analysis",
    description: "Statistical bias testing across urban/rural and employment groups. Statistically significant results validated at p < 0.001.",
    accent: "#FFD200",
  },
  {
    icon: Smartphone,
    title: "Alternative Data",
    description: "Mobile money transactions and bill payment history replace traditional credit bureau data unavailable in Zimbabwe's informal economy.",
    accent: "#006747",
  },
  {
    icon: TrendingUp,
    title: "Ensemble Modelling",
    description: "Five models — Random Forest, XGBoost, Neural Networks, and more — combined into a robust ensemble that outperforms any individual model.",
    accent: "#FFD200",
  },
  {
    icon: Globe,
    title: "Context-Aware",
    description: "Built specifically for Zimbabwe's economic context: informal employment, mobile-first payments, rural-urban dynamics.",
    accent: "#006747",
  },
  {
    icon: BarChart3,
    title: "Research Validated",
    description: "11 dissertation assertions independently verified in the system. Every claim backed by reproducible experimental results.",
    accent: "#FFD200",
  },
];

/* ─── Steps ─── */
const STEPS = [
  { num: "01", title: "Ingest Alternative Data", body: "Mobile money history, bill payments, and demographic signals are ingested and feature-engineered into 40+ predictive variables." },
  { num: "02", title: "Score with Ensemble ML", body: "Five models run in parallel. Their outputs are combined into a final credit score with calibrated probability estimates." },
  { num: "03", title: "Explain & Decide", body: "SHAP explainability surfaces the top drivers. Loan officers see exactly why a score was assigned — no black box." },
];

/* ─── Hero background grid lines ─── */
function GridBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden>
      <svg className="absolute inset-0 w-full h-full opacity-[0.04]" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="grid" width="60" height="60" patternUnits="userSpaceOnUse">
            <path d="M 60 0 L 0 0 0 60" fill="none" stroke="white" strokeWidth="0.8"/>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
      </svg>
      {/* Glow blobs */}
      <div className="absolute top-[-10%] left-[20%] w-[600px] h-[600px] rounded-full opacity-20"
        style={{ background: "radial-gradient(circle, #006747 0%, transparent 70%)", filter: "blur(60px)" }} />
      <div className="absolute bottom-[-20%] right-[10%] w-[400px] h-[400px] rounded-full opacity-10"
        style={{ background: "radial-gradient(circle, #FFD200 0%, transparent 70%)", filter: "blur(80px)" }} />
    </div>
  );
}

/* ─── Stat Card with counter ─── */
function StatCard({ stat, start }: { stat: typeof STATS[0]; start: boolean }) {
  const count = useCounter(stat.value, 1600, start);
  return (
    <div className="text-center px-6">
      <div className="text-5xl font-bold text-white tabular-nums" style={{ fontFamily: "var(--font-dm-serif), serif" }}>
        {count}{stat.suffix}
      </div>
      <div className="mt-1 text-sm font-semibold text-zim-gold uppercase tracking-widest">{stat.label}</div>
      <div className="mt-0.5 text-xs text-white/40">{stat.description}</div>
    </div>
  );
}

/* ─── Main Page ─── */
export default function LandingPage() {
  const statsSection = useInView(0.3);
  const featuresSection = useInView(0.1);
  const stepsSection = useInView(0.1);

  return (
    <div className="min-h-screen bg-[#030303] text-white overflow-x-hidden" style={{ fontFamily: "var(--font-dm-sans), sans-serif" }}>

      {/* ── Nav ── */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-8 py-5 border-b border-white/5"
        style={{ background: "rgba(3,3,3,0.85)", backdropFilter: "blur(20px)" }}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "#006747" }}>
            <ShieldCheck className="w-4 h-4 text-white" />
          </div>
          <span className="text-lg font-bold tracking-tight">Czae Credit</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-xs text-white/40 uppercase tracking-widest hidden sm:block">
            Zimbabwean Digital Lending
          </span>
          <Link
            href="/login"
            className="flex items-center gap-2 px-5 py-2 rounded-full text-sm font-semibold transition-all duration-200 hover:gap-3"
            style={{ background: "#006747", color: "white" }}
          >
            Enter Portal <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="relative min-h-screen flex flex-col items-center justify-center px-6 pt-24 pb-20 text-center">
        <GridBackground />



        {/* Headline */}
        <h1 className="relative max-w-5xl text-5xl sm:text-6xl lg:text-7xl font-bold leading-[1.05] tracking-tight mb-6"
          style={{ fontFamily: "var(--font-dm-serif), serif", letterSpacing: "-0.02em" }}>
          Credit Scoring for
          <span className="block" style={{ color: "#006747" }}>
            Zimbabwe&apos;s Digital Economy
          </span>
        </h1>

        <p className="relative max-w-2xl text-lg text-white/50 leading-relaxed mb-10">
          Machine learning meets alternative data — mobile money, bill payments, and
          behavioural signals — to assess creditworthiness where traditional bureaus don&apos;t reach.
        </p>

        {/* CTAs */}
        <div className="relative flex flex-col sm:flex-row gap-4 items-center">
          <Link
            href="/login"
            className="group flex items-center gap-2 px-8 py-4 rounded-full font-bold text-base transition-all duration-200 shadow-lg hover:shadow-green-900/40 hover:scale-105"
            style={{ background: "#006747", color: "white" }}
          >
            Enter Research Portal
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </Link>
          <Link
            href="/login"
            className="flex items-center gap-2 px-8 py-4 rounded-full font-semibold text-base border border-white/10 text-white/70 hover:text-white hover:border-white/25 transition-all duration-200"
          >
            View API Docs
          </Link>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 opacity-30">
          <span className="text-xs uppercase tracking-widest">Scroll</span>
          <div className="w-px h-8 bg-white/40" />
        </div>
      </section>

      {/* ── Stats Bar ── */}
      <div ref={statsSection.ref}>
        <section className="relative py-16 border-y border-white/5" style={{ background: "rgba(0,103,71,0.06)" }}>
          <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-10">
            {STATS.map((stat) => (
              <StatCard key={stat.label} stat={stat} start={statsSection.inView} />
            ))}
          </div>
        </section>
      </div>

      {/* ── Features ── */}
      <section ref={featuresSection.ref} className="py-28 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-xs font-semibold text-zim-gold uppercase tracking-widest mb-4">System Capabilities</p>
            <h2 className="text-4xl sm:text-5xl font-bold" style={{ fontFamily: "var(--font-dm-serif), serif" }}>
              Built for the informal economy
            </h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((f, i) => (
              <div
                key={f.title}
                className="group p-7 rounded-2xl border border-white/5 transition-all duration-300 hover:border-white/15 hover:-translate-y-1"
                style={{
                  background: "rgba(255,255,255,0.02)",
                  animationDelay: `${i * 80}ms`,
                  opacity: featuresSection.inView ? 1 : 0,
                  transform: featuresSection.inView ? "translateY(0)" : "translateY(20px)",
                  transition: `opacity 0.5s ease ${i * 80}ms, transform 0.5s ease ${i * 80}ms, border-color 0.2s, box-shadow 0.2s`,
                }}
              >
                <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-5"
                  style={{ background: `${f.accent}22`, border: `1px solid ${f.accent}44` }}>
                  <f.icon className="w-5 h-5" style={{ color: f.accent === "#FFD200" ? "#FFD200" : "#4ade80" }} />
                </div>
                <h3 className="text-base font-bold mb-2">{f.title}</h3>
                <p className="text-sm text-white/45 leading-relaxed">{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section ref={stepsSection.ref} className="py-28 px-6 border-t border-white/5">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-xs font-semibold text-zim-gold uppercase tracking-widest mb-4">Methodology</p>
            <h2 className="text-4xl sm:text-5xl font-bold" style={{ fontFamily: "var(--font-dm-serif), serif" }}>
              How the scoring works
            </h2>
          </div>
          <div className="relative">
            {/* Connector line */}
            <div className="hidden md:block absolute top-8 left-0 right-0 h-px" style={{ background: "linear-gradient(to right, transparent, rgba(0,103,71,0.4), rgba(255,210,0,0.4), transparent)" }} />
            <div className="grid md:grid-cols-3 gap-8">
              {STEPS.map((step, i) => (
                <div
                  key={step.num}
                  className="relative p-8 rounded-2xl border border-white/5"
                  style={{
                    background: "rgba(255,255,255,0.015)",
                    opacity: stepsSection.inView ? 1 : 0,
                    transform: stepsSection.inView ? "translateY(0)" : "translateY(30px)",
                    transition: `opacity 0.6s ease ${i * 120}ms, transform 0.6s ease ${i * 120}ms`,
                  }}
                >
                  <div className="text-5xl font-bold mb-5 leading-none"
                    style={{ fontFamily: "var(--font-dm-serif), serif", color: i % 2 === 0 ? "rgba(0,103,71,0.6)" : "rgba(255,210,0,0.5)" }}>
                    {step.num}
                  </div>
                  <h3 className="text-base font-bold mb-3">{step.title}</h3>
                  <p className="text-sm text-white/45 leading-relaxed">{step.body}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Research Context ── */}
      <section className="py-28 px-6 border-t border-white/5">
        <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-16 items-center">
          <div>
            <p className="text-xs font-semibold text-zim-gold uppercase tracking-widest mb-4">Research Context</p>
            <h2 className="text-4xl font-bold mb-6" style={{ fontFamily: "var(--font-dm-serif), serif" }}>
              Addressing Zimbabwe&apos;s credit gap
            </h2>
            <p className="text-white/50 leading-relaxed mb-4">
              Zimbabwe&apos;s informal economy accounts for the majority of economic activity, yet most participants remain credit-invisible — excluded from formal lending by the absence of traditional credit bureau data.
            </p>
            <p className="text-white/50 leading-relaxed mb-8">
              This system demonstrates that mobile money transactions and utility payments contain sufficient signal to produce robust, fair credit scores — achieving 95% accuracy and passing all fairness tests across demographic groups.
            </p>
            <Link
              href="/login"
              className="group inline-flex items-center gap-2 text-sm font-semibold text-zim-green hover:text-green-400 transition-colors"
            >
              Explore the research portal
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
          <div className="space-y-4">
            {[
              { label: "Model Accuracy", value: 95, max: 100, color: "#006747" },
              { label: "AUC-ROC Score", value: 96, max: 100, color: "#006747" },
              { label: "Noise Robustness (10% noise)", value: 90, max: 100, color: "#FFD200" },
              { label: "Fairness p-value threshold met", value: 100, max: 100, color: "#FFD200" },
            ].map((bar) => (
              <div key={bar.label}>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-white/60">{bar.label}</span>
                  <span className="font-semibold text-white">{bar.value}%</span>
                </div>
                <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-1000"
                    style={{ width: `${bar.value}%`, background: bar.color }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Banner ── */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto text-center rounded-3xl py-20 px-8 relative overflow-hidden"
          style={{ background: "linear-gradient(135deg, rgba(0,103,71,0.2) 0%, rgba(0,103,71,0.05) 100%)", border: "1px solid rgba(0,103,71,0.3)" }}>
          <div className="absolute inset-0 opacity-10" style={{ background: "radial-gradient(circle at 50% 0%, #006747, transparent 60%)" }} />
          <Zap className="relative mx-auto w-10 h-10 mb-6 text-zim-gold" />
          <h2 className="relative text-4xl sm:text-5xl font-bold mb-4" style={{ fontFamily: "var(--font-dm-serif), serif" }}>
            Ready to explore?
          </h2>
          <p className="relative text-white/50 mb-10 max-w-xl mx-auto">
            Access the full research portal — borrower profiles, live credit scoring, fairness reports, and validated dissertation assertions.
          </p>
          <Link
            href="/login"
            className="group inline-flex items-center gap-3 px-10 py-4 rounded-full font-bold text-base transition-all duration-200 hover:scale-105 shadow-lg shadow-green-900/30"
            style={{ background: "#006747", color: "white" }}
          >
            Enter Portal
            <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
          </Link>
          <p className="mt-4 text-xs text-white/25">Use credentials: admin / czae2026</p>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-white/5 py-10 px-8">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 rounded flex items-center justify-center" style={{ background: "#006747" }}>
              <ShieldCheck className="w-3 h-3 text-white" />
            </div>
            <span className="text-sm font-semibold">Czae Credit Scoring</span>
          </div>
          <p className="text-xs text-white/25 text-center">
            Sizalobuhle Ngulube — Computer Science Dissertation, University of Zimbabwe, 2025
          </p>
          <div className="flex items-center gap-1 text-xs text-white/25">
            <Users className="w-3 h-3" />
            <span>Academic Use Only</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
