"use client";

import React, { useState, useRef, useEffect } from "react";
import { 
  Sparkles, 
  Send, 
  ShieldCheck, 
  ChevronDown, 
  ChevronUp, 
  CheckCircle2, 
  Cpu,
  X,
  Minus,
  RotateCw,
  AlertTriangle
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

interface FloatingRobotAssistantProps {
  isOpen: boolean;
  onToggle: () => void;
  onClose: () => void;
}

export const FloatingRobotAssistant: React.FC<FloatingRobotAssistantProps> = ({
  isOpen,
  onToggle,
  onClose
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "m-init",
      sender: "advisor",
      text:
        "Welcome to PulseGrid AI. I am directly connected to the campus 1R1C digital twin physics model, Computer Vision occupancy feeds, and electrical meters.\n\nAll figures are strictly verified via live tool execution. How can I assist your energy decisions today?",
      citations: ["Digital Twin Physics Engine", "Energy Tariff Database", "Vision Occupancy Feed"],
      toolTrace: [{ tool: "get_site_summary", args: { site_id: "aryabhatta-campus" }, status: "200 OK" }],
      verified: true
    }
  ]);

  const [inputQuery, setInputQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [lastFailedQuery, setLastFailedQuery] = useState<string | null>(null);
  const [expandedTrace, setExpandedTrace] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const predefinedQuestions = [
    "What happens if we increase AC setpoint from 22 to 24°C?",
    "Why is Block B consuming more than Block A?",
    "Which room should I fix first?",
    "Can we avoid the 2:15 pm peak tomorrow?",
    "Is the 10-year-old AC in B-207 worth replacing?"
  ];

  // Auto-scroll on new message or when opened
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [messages, isOpen]);

  // Handle ESC key to close assistant
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  const handleSend = async (queryText?: string, isRetry = false) => {
    const q = (queryText !== undefined ? queryText : inputQuery).trim();
    if (!q || loading) return;

    setErrorMessage(null);

    if (!isRetry) {
      const userMsg: ChatMessage = {
        id: `u-${Date.now()}`,
        sender: "user",
        text: q
      };
      setMessages(prev => [...prev, userMsg]);
    }

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
      // Only clear input query and failed query on SUCCESS
      setInputQuery("");
      setLastFailedQuery(null);
    } catch (e: any) {
      console.error("PulseGrid AI Advisor error:", e);
      const friendlyError = e?.message || "Failed to communicate with PulseGrid AI service.";
      setErrorMessage(friendlyError);
      setLastFailedQuery(q);
      // Preserve inputQuery if not cleared so user doesn't lose typed text
      if (!inputQuery && q) {
        setInputQuery(q);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSend();
  };

  return (
    <>
      {/* Floating Chat Panel */}
      {isOpen && (
        <aside
          role="dialog"
          aria-label="PulseGrid AI Advisor Panel"
          className="fixed bottom-24 right-4 sm:right-6 z-50 w-[calc(100vw-2rem)] sm:w-[440px] max-w-[460px] h-[590px] max-h-[calc(100vh-7.5rem)] flex flex-col rounded-2xl border border-cyan-500/30 bg-[#090e1a]/95 backdrop-blur-xl shadow-2xl shadow-cyan-950/70 overflow-hidden transition-all duration-300 animate-in fade-in zoom-in-95"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 bg-slate-900/60 backdrop-blur-sm">
            <div className="flex items-center gap-2.5">
              <div className="relative flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border border-cyan-500/40 text-cyan-300">
                <RobotIcon className="w-5 h-5 text-cyan-400" />
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-slate-900" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="text-xs font-bold text-slate-100 tracking-wide uppercase">PulseGrid AI</h3>
                  <span className="px-1.5 py-0.2 rounded text-[9px] font-mono bg-cyan-950/60 border border-cyan-500/40 text-cyan-300">
                    Live Twin
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-emerald-400" />
                  <span>Zero-Hallucination Numeric Guard</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={onClose}
                aria-label="Minimize AI Advisor"
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
              >
                <Minus className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close AI Advisor"
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Preset Questions Bar */}
          <div className="px-3 py-2 border-b border-slate-800/80 bg-slate-950/40 overflow-x-auto">
            <div className="flex items-center gap-1.5 whitespace-nowrap">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider shrink-0 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-cyan-400" />
                <span>Presets:</span>
              </span>
              {predefinedQuestions.map((q, i) => (
                <button
                  key={i}
                  type="button"
                  disabled={loading}
                  onClick={() => handleSend(q)}
                  className="text-[11px] px-2.5 py-1 rounded-full bg-slate-900/90 hover:bg-slate-800 border border-slate-800 hover:border-cyan-500/40 text-slate-300 hover:text-cyan-200 transition shrink-0 disabled:opacity-50"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>

          {/* Messages Log */}
          <div className="flex-1 p-3.5 overflow-y-auto space-y-3 scroll-smooth">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${msg.sender === "user" ? "items-end" : "items-start"}`}
              >
                <div
                  className={`max-w-[88%] rounded-xl p-3 text-xs leading-relaxed ${
                    msg.sender === "user"
                      ? "bg-gradient-to-r from-cyan-600 to-cyan-500 text-white font-medium shadow-md shadow-cyan-900/30"
                      : "bg-slate-900/90 border border-slate-800/90 text-slate-200 shadow-sm"
                  }`}
                >
                  {msg.sender === "advisor" && (
                    <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-slate-800 text-[10px]">
                      <div className="flex items-center gap-1.5 text-cyan-400 font-semibold">
                        <Cpu className="w-3 h-3" />
                        <span>Twin Advisor</span>
                      </div>
                      {msg.verified && (
                        <span className="text-emerald-400 font-mono text-[9px] flex items-center gap-1">
                          <CheckCircle2 className="w-2.5 h-2.5" />
                          <span>Figures Verified</span>
                        </span>
                      )}
                    </div>
                  )}

                  <div className="whitespace-pre-wrap">{msg.text}</div>

                  {/* Safely Render Citations (always strings) */}
                  {msg.citations && msg.citations.length > 0 && (
                    <div className="mt-2.5 pt-2 border-t border-slate-800/80">
                      <span className="text-[9px] text-slate-400 block mb-1">Citations & Sources:</span>
                      <div className="flex flex-wrap gap-1">
                        {msg.citations.map((cite: any, i: number) => {
                          const citeText =
                            typeof cite === "string"
                              ? cite
                              : cite && typeof cite === "object" && cite.doc
                              ? `${cite.doc}${cite.ref ? ` (${cite.ref})` : ""}`
                              : JSON.stringify(cite);
                          return (
                            <span
                              key={i}
                              className="text-[9px] px-1.5 py-0.5 rounded bg-slate-950 border border-slate-800 text-cyan-300 font-mono"
                            >
                              {citeText}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Tool Execution Trace */}
                  {msg.toolTrace && msg.toolTrace.length > 0 && (
                    <div className="mt-2">
                      <button
                        type="button"
                        onClick={() => setExpandedTrace(expandedTrace === msg.id ? null : msg.id)}
                        className="text-[9px] text-cyan-300 hover:text-cyan-200 flex items-center gap-1"
                      >
                        <span>{expandedTrace === msg.id ? "Hide Tool Calls" : "Inspect Tool Execution Trace"}</span>
                        {expandedTrace === msg.id ? <ChevronUp className="w-2.5 h-2.5" /> : <ChevronDown className="w-2.5 h-2.5" />}
                      </button>

                      {expandedTrace === msg.id && (
                        <div className="mt-1.5 p-2 rounded bg-slate-950 border border-slate-800 font-mono text-[9px] text-slate-300 space-y-1">
                          {msg.toolTrace.map((t, idx) => (
                            <div key={idx}>
                              <span className="text-emerald-400">tool:</span> <strong>{t.tool}</strong>
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
              <div className="flex items-center gap-2 p-2.5 rounded-lg bg-slate-900/60 border border-slate-800 text-xs text-slate-400 italic">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400 animate-spin" />
                <span>Querying twin physics and running forward simulation...</span>
              </div>
            )}

            {/* Recoverable Error Banner with Retry */}
            {errorMessage && (
              <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-800/70 text-rose-200 text-xs flex flex-col gap-2 shadow-lg">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="font-semibold block text-rose-300 text-xs">AI Service Unavailable</strong>
                    <p className="text-slate-300 text-[11px] leading-relaxed mt-0.5">{errorMessage}</p>
                  </div>
                </div>
                {lastFailedQuery && (
                  <button
                    type="button"
                    onClick={() => handleSend(lastFailedQuery, true)}
                    disabled={loading}
                    className="self-end px-2.5 py-1 rounded bg-rose-800 hover:bg-rose-700 disabled:opacity-50 text-white font-medium text-[11px] transition flex items-center gap-1 shadow"
                  >
                    <RotateCw className="w-3 h-3" />
                    <span>Retry Question</span>
                  </button>
                )}
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Chat Input Form */}
          <form
            onSubmit={handleFormSubmit}
            className="p-3 border-t border-slate-800 bg-slate-900/70 flex items-center gap-2"
          >
            <input
              ref={inputRef}
              type="text"
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              disabled={loading}
              placeholder="Ask anything about campus energy, anomalies, or simulations..."
              className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-sans disabled:opacity-60"
            />
            <button
              type="submit"
              disabled={loading || !inputQuery.trim()}
              aria-label="Send Message"
              className="px-3.5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white font-semibold text-xs transition flex items-center gap-1.5 shadow-md shadow-cyan-600/30"
            >
              <Send className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Send</span>
            </button>
          </form>
        </aside>
      )}

      {/* Floating Robot Trigger Button */}
      <div className="fixed bottom-6 right-6 z-40 group">
        {/* Hover / Focus Tooltip */}
        <div
          role="tooltip"
          className="absolute bottom-full right-0 mb-3 px-3 py-1.5 rounded-lg bg-slate-900/95 border border-cyan-500/40 text-cyan-300 text-xs font-medium shadow-xl whitespace-nowrap opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity duration-200 pointer-events-none flex items-center gap-1.5"
        >
          <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
          <span>Ask PulseGrid AI</span>
          <div className="absolute top-full right-5 -mt-1 border-4 border-transparent border-t-slate-900" />
        </div>

        {/* Robot Button */}
        <button
          type="button"
          onClick={onToggle}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              onToggle();
            }
          }}
          aria-label={isOpen ? "Close PulseGrid AI Assistant" : "Ask PulseGrid AI Assistant"}
          aria-expanded={isOpen}
          className={`relative w-14 h-14 rounded-full p-1.5 flex items-center justify-center transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2 focus:ring-offset-slate-900 ${
            isOpen
              ? "bg-gradient-to-br from-cyan-600 to-blue-700 border-2 border-cyan-300 shadow-[0_0_25px_rgba(6,182,212,0.6)]"
              : "bg-gradient-to-br from-[#0c162d] to-[#060b17] border-2 border-cyan-500/50 hover:border-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.35)] hover:shadow-[0_0_30px_rgba(6,182,212,0.55)] animate-bot-float"
          }`}
        >
          {/* Animated Robot SVG */}
          <RobotAvatar className="w-9 h-9" isOpen={isOpen} />

          {/* Online Pulsing Indicator Dot */}
          <span className="absolute top-0.5 right-0.5 flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500 border border-slate-900" />
          </span>
        </button>
      </div>
    </>
  );
};

// Animated Futuristic Robot Face SVG
const RobotAvatar: React.FC<{ className?: string; isOpen?: boolean }> = ({ className = "w-8 h-8", isOpen = false }) => {
  return (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      {/* Antenna */}
      <line x1="24" y1="9" x2="24" y2="4" stroke="#06b6d4" strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="24" cy="3.5" r="3" fill="#22d3ee" className="animate-antenna-pulse" />

      {/* Head Outer Shell */}
      <rect
        x="8"
        y="9"
        width="32"
        height="28"
        rx="9"
        fill="url(#headGradient)"
        stroke="#22d3ee"
        strokeWidth="1.5"
      />

      {/* Ear Transceivers */}
      <rect x="5" y="18" width="3" height="10" rx="1.5" fill="#0891b2" />
      <rect x="40" y="18" width="3" height="10" rx="1.5" fill="#0891b2" />

      {/* Visor Display Screen */}
      <rect
        x="12"
        y="14"
        width="24"
        height="18"
        rx="5"
        fill="#050a14"
        stroke="#155e75"
        strokeWidth="1"
      />

      {/* Twin Digital Eyes (with blink animation) */}
      <g className="animate-eye-blink">
        <rect x="16" y="19" width="5" height="7" rx="2.5" fill="#22d3ee" />
        <rect x="27" y="19" width="5" height="7" rx="2.5" fill="#22d3ee" />
        {/* Eye Gleam highlights */}
        <circle cx="17.5" cy="20.5" r="1" fill="#ffffff" />
        <circle cx="28.5" cy="20.5" r="1" fill="#ffffff" />
      </g>

      {/* Friendly Mouth Arc or Live Wave */}
      {isOpen ? (
        <path d="M19 28C21.5 30 26.5 30 29 28" stroke="#38bdf8" strokeWidth="1.8" strokeLinecap="round" />
      ) : (
        <line x1="20" y1="28" x2="28" y2="28" stroke="#38bdf8" strokeWidth="1.6" strokeLinecap="round" />
      )}

      {/* Gradients */}
      <defs>
        <linearGradient id="headGradient" x1="8" y1="9" x2="40" y2="37" gradientUnits="userSpaceOnUse">
          <stop stopColor="#0f172a" />
          <stop offset="1" stopColor="#020617" />
        </linearGradient>
      </defs>
    </svg>
  );
};

// Simplified Mini Icon for Header
const RobotIcon: React.FC<{ className?: string }> = ({ className = "w-4 h-4" }) => {
  return (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-hidden="true">
      <path d="M12 2V4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <circle cx="12" cy="2" r="1.5" fill="currentColor" />
      <rect x="4" y="4" width="16" height="15" rx="4" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="9" cy="11" r="1.8" fill="currentColor" />
      <circle cx="15" cy="11" r="1.8" fill="currentColor" />
      <path d="M9 15C10.5 16.5 13.5 16.5 15 15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
};
