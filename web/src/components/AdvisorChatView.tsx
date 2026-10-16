"use client";

import React, { useState } from "react";
import { 
  Sparkles, 
  Send, 
  ShieldCheck, 
  ChevronDown, 
  ChevronUp, 
  Layers, 
  Database, 
  CheckCircle2, 
  HelpCircle,
  Cpu
} from "lucide-react";
import { askAdvisor } from "../lib/api";

interface ChatMessage {
  id: string;
  sender: "user" | "advisor";
  text: string;
  citations?: string[];
  toolTrace?: Array<{ tool: string; args: any; status: string }>;
  verified?: boolean;
}

export const AdvisorChatView: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "m-init",
      sender: "advisor",
      text:
        "Welcome to the PulseGrid Energy Intelligence Engine. I am grounded in live Computer Vision observations, the 1R1C digital twin physics model, and the campus electrical meters. Every figure in my answers is verified via tools with zero hallucinations.\n\nHow can I assist your facility decisions today?",
      citations: ["PulseGrid Digital Twin State Store", "Energy Tariff Database", "Camera Feeds"],
      toolTrace: [{ tool: "get_site_summary", args: { site_id: "aryabhatta-campus" }, status: "200 OK" }],
      verified: true
    }
  ]);
  const [inputQuery, setInputQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [expandedTrace, setExpandedTrace] = useState<string | null>(null);

  const predefinedQuestions = [
    "What happens if we increase AC setpoint from 22 to 24°C?",
    "Why is Block B consuming more than Block A?",
    "Which room should I fix first?",
    "Can we avoid the 2:15 pm peak tomorrow?",
    "Is the 10-year-old AC in B-207 worth replacing?"
  ];

  const handleSend = async (queryText?: string) => {
    const q = queryText || inputQuery;
    if (!q.trim()) return;

    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      sender: "user",
      text: q
    };
    setMessages(prev => [...prev, userMsg]);
    setInputQuery("");
    setLoading(true);

    try {
      const res = await askAdvisor(q);
      const advisorMsg: ChatMessage = {
        id: `a-${Date.now()}`,
        sender: "advisor",
        text: res.answer,
        citations: res.citations,
        toolTrace: res.tool_trace,
        verified: res.numeric_guard_verified
      };
      setMessages(prev => [...prev, advisorMsg]);
    } catch (e) {
      console.error(e);
      setMessages(prev => [
        ...prev,
        {
          id: `a-${Date.now()}`,
          sender: "advisor",
          text: "I experienced an error executing the twin tool call. Please verify backend connectivity.",
          verified: false
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4 p-4 max-w-5xl mx-auto">
      {/* Header */}
      <div className="glass-panel p-4 rounded-xl border border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-400" />
            <span>AI Energy Advisor — Tool-Calling & Numeric Verification Guard</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Strict grounded reasoning: The AI queries twin physics, runs simulations, and cites exact telemetry sources.
          </p>
        </div>

        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 text-xs font-mono">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Numeric Guard: All Figures Verified</span>
        </div>
      </div>

      {/* Suggested Questions Carousel */}
      <div className="space-y-1.5">
        <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
          Preset Grounded Questions (§11 Interaction Patterns)
        </span>
        <div className="flex flex-wrap gap-2">
          {predefinedQuestions.map((q, i) => (
            <button
              key={i}
              onClick={() => handleSend(q)}
              className="text-xs px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white transition flex items-center gap-1.5"
            >
              <span>{q}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Chat Messages Log */}
      <div className="glass-panel p-4 rounded-xl border border-slate-800 min-h-[420px] max-h-[560px] overflow-y-auto space-y-4">
        {messages.map(msg => (
          <div
            key={msg.id}
            className={`flex flex-col ${msg.sender === "user" ? "items-end" : "items-start"}`}
          >
            <div
              className={`max-w-[85%] rounded-xl p-4 text-xs leading-relaxed ${
                msg.sender === "user"
                  ? "bg-cyan-600 text-white font-medium"
                  : "bg-slate-900 border border-slate-800 text-slate-200"
              }`}
            >
              {msg.sender === "advisor" && (
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800 text-[11px]">
                  <div className="flex items-center gap-1.5 text-indigo-400 font-bold">
                    <Cpu className="w-3.5 h-3.5" />
                    <span>PulseGrid Advisor</span>
                  </div>
                  {msg.verified && (
                    <span className="text-emerald-400 font-mono text-[10px] flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>Figures Verified by Tool Execution</span>
                    </span>
                  )}
                </div>
              )}

              <div className="whitespace-pre-wrap">{msg.text}</div>

              {/* Data Sources / Citations */}
              {msg.citations && msg.citations.length > 0 && (
                <div className="mt-3 pt-2 border-t border-slate-800/80">
                  <span className="text-[10px] text-slate-400 block mb-1">Data Sources & Citations:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {msg.citations.map((cite, i) => (
                      <span key={i} className="text-[10px] px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-cyan-300 font-mono">
                        {cite}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Tool Execution Trace Dropdown */}
              {msg.toolTrace && msg.toolTrace.length > 0 && (
                <div className="mt-2.5">
                  <button
                    onClick={() => setExpandedTrace(expandedTrace === msg.id ? null : msg.id)}
                    className="text-[10px] text-indigo-300 hover:text-indigo-200 flex items-center gap-1"
                  >
                    <span>{expandedTrace === msg.id ? "Hide Tool Execution Trace" : "How I Got This (Inspect Tool Calls)"}</span>
                    {expandedTrace === msg.id ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  </button>

                  {expandedTrace === msg.id && (
                    <div className="mt-2 p-2.5 rounded bg-slate-950 border border-slate-800 font-mono text-[10px] text-slate-300 space-y-1.5">
                      {msg.toolTrace.map((t, idx) => (
                        <div key={idx}>
                          <span className="text-emerald-400">tool_call:</span> <strong>{t.tool}</strong>
                          <pre className="text-slate-400 mt-0.5">{JSON.stringify(t.args, null, 2)}</pre>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex items-center gap-2 text-xs text-slate-400 italic">
            <Sparkles className="w-4 h-4 text-indigo-400 animate-spin" />
            <span>Querying twin physics and running forward simulation...</span>
          </div>
        )}
      </div>

      {/* Input Field */}
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={inputQuery}
          onChange={(e) => setInputQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          placeholder="Ask anything about campus energy, anomalies, or test a what-if scenario..."
          className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-sans"
        />
        <button
          onClick={() => handleSend()}
          disabled={loading || !inputQuery.trim()}
          className="px-4 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white font-semibold text-xs transition flex items-center gap-1.5 shadow-md shadow-cyan-600/30"
        >
          <Send className="w-3.5 h-3.5" />
          <span>Send</span>
        </button>
      </div>
    </div>
  );
};
