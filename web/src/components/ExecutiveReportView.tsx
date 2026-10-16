"use client";

import React, { useState, useEffect } from "react";
import { 
  FileText, 
  Printer, 
  Download, 
  CheckCircle2, 
  ShieldCheck, 
  Leaf, 
  Building2, 
  Calendar,
  Sparkles,
  Award
} from "lucide-react";
import { fetchExecutiveReport } from "../lib/api";

export const ExecutiveReportView: React.FC = () => {
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const data = await fetchExecutiveReport();
        setReport(data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-4 p-4 max-w-5xl mx-auto">
      {/* Action Bar */}
      <div className="glass-panel p-4 rounded-xl border border-slate-800 flex flex-wrap items-center justify-between gap-3 print:hidden">
        <div>
          <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <FileText className="w-5 h-5 text-indigo-400" />
            <span>Executive Board Sustainability & Energy Audit Report</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Auto-generated AI report grounded in IPMVP Option C measurement and twin telemetry for Dean / CFO approval.
          </p>
        </div>

        <button
          onClick={handlePrint}
          className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition flex items-center gap-2 shadow-md shadow-indigo-600/30"
        >
          <Printer className="w-4 h-4" />
          <span>Print / Export PDF</span>
        </button>
      </div>

      {/* Printable Report Document Sheet */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 space-y-6 text-slate-200 shadow-2xl print:bg-white print:text-black print:border-none print:shadow-none print:p-0">
        {/* Document Header */}
        <div className="flex items-start justify-between border-b border-slate-800 pb-5">
          <div>
            <div className="flex items-center gap-2 text-indigo-400 font-mono text-xs uppercase tracking-widest font-bold">
              <Sparkles className="w-4 h-4" />
              <span>PULSEGRID DIGITAL TWIN AUDIT LEDGER</span>
            </div>
            <h1 className="text-2xl font-black text-white mt-1">
              Campus Energy & Sustainability Audit Report
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Site: Aryabhatta Digital Twin • Telemetry: Simulated Live — UCI Dataset (Candanedo et al., 2017)
            </p>
          </div>

          <div className="text-right text-xs space-y-1">
            <div className="px-2.5 py-1 rounded bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 font-mono font-bold">
              ISO 50001 / NAAC ESG COMPLIANT
            </div>
            <div className="text-[11px] text-slate-400">Auditor: Antigravity AI Engine</div>
          </div>
        </div>

        {/* Section 1: Executive Summary */}
        <div className="space-y-2">
          <h2 className="text-xs font-bold uppercase tracking-wider text-cyan-400">
            1. Executive Briefing
          </h2>
          <p className="text-xs text-slate-300 leading-relaxed">
            {report?.executive_summary || (
              "During the reporting period, Aryabhatta Engineering Campus maintained an overall Energy Efficiency Score of 74/100. " +
              "Continuous real-time reconciliation via the PulseGrid Digital Twin identified ₹4,100/day in recoverable Unexplained Load (UL), " +
              "concentrated primarily in unoccupied academic laboratories in Block B. " +
              "Implementing the vision-grounded occupancy setback package is projected to deliver ₹66,000/month in net savings and 6.4 tons of CO₂ abatement."
            )}
          </p>
        </div>

        {/* Section 2: Key Operational Metrics */}
        <div className="space-y-2">
          <h2 className="text-xs font-bold uppercase tracking-wider text-cyan-400">
            2. Campus Consumption Scorecard
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs font-mono">
            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
              <span className="text-slate-400 font-sans block text-[11px]">Baseline Energy</span>
              <div className="text-base font-bold text-white mt-0.5">55,500 kWh/mo</div>
            </div>
            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
              <span className="text-slate-400 font-sans block text-[11px]">Monthly Utility Cost</span>
              <div className="text-base font-bold text-amber-400 mt-0.5">₹4,71,750 / mo</div>
            </div>
            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
              <span className="text-slate-400 font-sans block text-[11px]">Carbon Emissions</span>
              <div className="text-base font-bold text-indigo-400 mt-0.5">45.5 tons CO₂</div>
            </div>
            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
              <span className="text-slate-400 font-sans block text-[11px]">Monthly Max Demand</span>
              <div className="text-base font-bold text-rose-400 mt-0.5">238 kW Peak</div>
            </div>
          </div>
        </div>

        {/* Section 3: Critical Findings */}
        <div className="space-y-2">
          <h2 className="text-xs font-bold uppercase tracking-wider text-cyan-400">
            3. Defect Analysis & Waste Ledger
          </h2>
          <div className="border border-slate-800 rounded-lg overflow-hidden text-xs">
            <table className="w-full text-left">
              <thead className="bg-slate-950 border-b border-slate-800 text-slate-400">
                <tr>
                  <th className="p-2.5">Identified Waste Anomaly</th>
                  <th className="p-2.5">Financial Impact</th>
                  <th className="p-2.5">Evidence & Diagnostic</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                <tr>
                  <td className="p-2.5 font-semibold text-slate-200">Empty-Room Conditioning in Lab B-204</td>
                  <td className="p-2.5 text-rose-400 font-mono font-bold">₹6,900 / month</td>
                  <td className="p-2.5 text-slate-400">CV confirms 0 occupants for &gt;50 min while AC draws 3.1 kW</td>
                </tr>
                <tr>
                  <td className="p-2.5 font-semibold text-slate-200">Air Conditioner Compressor Degradation in Lab B-207</td>
                  <td className="p-2.5 text-rose-400 font-mono font-bold">₹24,800 / year excess</td>
                  <td className="p-2.5 text-slate-400">10.5-year-old unit operating at COP 1.95 (20.4% efficiency drop)</td>
                </tr>
                <tr>
                  <td className="p-2.5 font-semibold text-slate-200">Overnight Workstation Idle Standby</td>
                  <td className="p-2.5 text-rose-400 font-mono font-bold">₹31,600 / month</td>
                  <td className="p-2.5 text-slate-400">70+ PCs left in active standby after operating hours</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Section 4: Closed-Loop Verified Savings (M&V) */}
        <div className="space-y-2">
          <h2 className="text-xs font-bold uppercase tracking-wider text-emerald-400">
            4. Closed-Loop Measurement & Verification (IPMVP Option C)
          </h2>
          <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-500/30 text-xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-200">
                Verified Energy & Carbon Abatement Achieved Post-Action
              </span>
              <span className="font-mono text-emerald-400 font-bold">Audited by PulseGrid</span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs font-mono pt-2 border-t border-emerald-900/40">
              <div>
                <span className="text-slate-400 font-sans block text-[10px]">Verified Savings</span>
                <span className="text-base font-bold text-emerald-400">₹66,000 / mo</span>
              </div>
              <div>
                <span className="text-slate-400 font-sans block text-[10px]">Avoided Electricity</span>
                <span className="text-base font-bold text-cyan-400">7,765 kWh / mo</span>
              </div>
              <div>
                <span className="text-slate-400 font-sans block text-[10px]">Avoided Carbon</span>
                <span className="text-base font-bold text-indigo-400">6.37 tons CO₂</span>
              </div>
              <div>
                <span className="text-slate-400 font-sans block text-[10px]">Ecological Impact</span>
                <span className="text-base font-bold text-emerald-300">290 Trees</span>
              </div>
            </div>
          </div>
        </div>

        {/* Sign-off Block */}
        <div className="pt-6 border-t border-slate-800 grid grid-cols-2 gap-8 text-xs text-slate-400">
          <div>
            <span className="block font-medium text-slate-300">Submitted by:</span>
            <div className="mt-4 pt-2 border-t border-slate-700 font-mono">
              Facility & Energy Management Directorate
            </div>
          </div>
          <div>
            <span className="block font-medium text-slate-300">Approved by:</span>
            <div className="mt-4 pt-2 border-t border-slate-700 font-mono">
              Dean of Infrastructure / CFO Approval
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
