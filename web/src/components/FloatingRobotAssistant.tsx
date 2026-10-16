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
        "Welcome to PULSEGRID AI Advisor. I am directly connected to the campus 1R1C digital twin physics model, Computer Vision occupancy feeds, and electrical meters.\n\nAll figures are strictly verified via live tool execution. How can I assist your energy decisions today?",
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
      setInputQuery("");
      setLastFailedQuery(null);
    } catch (e: any) {
      console.error("PulseGrid AI Advisor error:", e);
      const friendlyError = e?.message || "Failed to communicate with PulseGrid AI service.";
      setErrorMessage(friendlyError);
      setLastFailedQuery(q);
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
      {/* Floating AI Advisor Chat Panel */}
      {isOpen && (
        <aside
          role="dialog"
          aria-label="PULSEGRID AI Advisor Panel"
          className="fixed bottom-28 right-4 sm:right-6 z-50 w-[calc(100vw-2rem)] sm:w-[440px] max-w-[460px] h-[590px] max-h-[calc(100vh-8.5rem)] flex flex-col rounded-2xl border border-red-500/30 bg-[#090e1a]/95 backdrop-blur-xl shadow-2xl shadow-red-950/40 overflow-hidden transition-all duration-300 animate-in fade-in zoom-in-95"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 bg-slate-900/70 backdrop-blur-sm">
            <div className="flex items-center gap-2.5">
              <div className="relative flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-red-600/25 to-red-950/40 border border-red-500/50 text-red-400">
                <MiniRobotIcon className="w-5 h-5 text-red-400" />
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-slate-900" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="text-xs font-bold text-slate-100 tracking-wide uppercase">PULSEGRID AI Advisor</h3>
                  <span className="px-1.5 py-0.2 rounded text-[9px] font-mono bg-red-950/70 border border-red-500/40 text-red-300">
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
                <Sparkles className="w-3 h-3 text-red-400" />
                <span>Presets:</span>
              </span>
              {predefinedQuestions.map((q, i) => (
                <button
                  key={i}
                  type="button"
                  disabled={loading}
                  onClick={() => handleSend(q)}
                  className="text-[11px] px-2.5 py-1 rounded-full bg-slate-900/90 hover:bg-slate-800 border border-slate-800 hover:border-red-500/40 text-slate-300 hover:text-red-200 transition shrink-0 disabled:opacity-50"
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
                      ? "bg-gradient-to-r from-red-600 to-red-700 text-white font-medium shadow-md shadow-red-950/40"
                      : "bg-slate-900/90 border border-slate-800/90 text-slate-200 shadow-sm"
                  }`}
                >
                  {msg.sender === "advisor" && (
                    <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-slate-800 text-[10px]">
                      <div className="flex items-center gap-1.5 text-red-400 font-semibold">
                        <Cpu className="w-3 h-3" />
                        <span>PULSEGRID AI</span>
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

                  {/* Citations & Sources */}
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
                              className="text-[9px] px-1.5 py-0.5 rounded bg-slate-950 border border-slate-800 text-red-300 font-mono"
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
                        className="text-[9px] text-red-300 hover:text-red-200 flex items-center gap-1"
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
                <Sparkles className="w-3.5 h-3.5 text-red-400 animate-spin" />
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
              className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-red-500 font-sans disabled:opacity-60"
            />
            <button
              type="submit"
              disabled={loading || !inputQuery.trim()}
              aria-label="Send Message"
              className="px-3.5 py-2 rounded-xl bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white font-semibold text-xs transition flex items-center gap-1.5 shadow-md shadow-red-950/40"
            >
              <Send className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Send</span>
            </button>
          </form>
        </aside>
      )}

      {/* Floating Full-Body Robot Trigger Button */}
      <div className="fixed bottom-5 right-5 sm:right-6 z-40 flex flex-col items-center group">
        {/* Hover / Focus Tooltip */}
        <div
          role="tooltip"
          className="absolute bottom-full mb-3 px-3 py-1.5 rounded-lg bg-slate-900/95 border border-red-500/50 text-red-300 text-xs font-medium shadow-2xl whitespace-nowrap opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity duration-200 pointer-events-none flex items-center gap-1.5 z-50"
        >
          <Sparkles className="w-3.5 h-3.5 text-red-400" />
          <span>Ask PulseGrid AI</span>
          <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-slate-900" />
        </div>

        {/* Full-Body Robot Interactive Trigger */}
        <button
          type="button"
          onClick={onToggle}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              onToggle();
            }
          }}
          aria-label={isOpen ? "Close PulseGrid AI Advisor" : "Open PulseGrid AI Advisor"}
          aria-expanded={isOpen}
          className={`relative flex flex-col items-center justify-center p-2 rounded-2xl transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-offset-2 focus:ring-offset-slate-900 cursor-pointer ${
            isOpen
              ? "bg-gradient-to-b from-[#220a0a]/90 via-[#140606]/95 to-[#0b0303]/95 border-2 border-red-500 shadow-[0_0_25px_rgba(239,68,68,0.55)] scale-105"
              : "bg-gradient-to-b from-[#180808]/80 via-[#0e0404]/80 to-[#070202]/90 border border-red-500/40 hover:border-red-400 shadow-[0_0_20px_rgba(239,68,68,0.35)] hover:shadow-[0_0_30px_rgba(239,68,68,0.6)] animate-bot-float"
          }`}
        >
          {/* Full-Body Robot Artwork */}
          <FullBodyRobotAvatar
            className="w-16 h-22 sm:w-18 sm:h-24 drop-shadow-[0_0_12px_rgba(239,68,68,0.45)]"
            isOpen={isOpen}
          />

          {/* Online Pulsing Indicator Dot */}
          <span className="absolute top-1.5 right-1.5 flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500 border border-slate-900" />
          </span>

          {/* AI Advisor Label */}
          <span className="mt-1 px-2.5 py-0.5 rounded-full text-[9.5px] font-mono font-bold tracking-wider uppercase bg-red-950/90 border border-red-500/50 text-red-200 group-hover:text-white group-hover:border-red-400 transition shadow-sm">
            AI Advisor
          </span>
        </button>
      </div>
    </>
  );
};

// Full-Body Red Themed Futuristic Robot SVG
const FullBodyRobotAvatar: React.FC<{ className?: string; isOpen?: boolean }> = ({ 
  className = "w-16 h-24", 
  isOpen = false 
}) => {
  return (
    <svg
      viewBox="0 0 68 96"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <defs>
        {/* Head armor gradient */}
        <linearGradient id="headArmorRed" x1="20" y1="12" x2="48" y2="38" gradientUnits="userSpaceOnUse">
          <stop stopColor="#27272a" />
          <stop offset="0.6" stopColor="#18181b" />
          <stop offset="1" stopColor="#09090b" />
        </linearGradient>

        {/* Chestplate armor gradient */}
        <linearGradient id="chestPlateRed" x1="18" y1="40" x2="50" y2="65" gradientUnits="userSpaceOnUse">
          <stop stopColor="#27272a" />
          <stop offset="0.5" stopColor="#18181b" />
          <stop offset="1" stopColor="#0a0a0c" />
        </linearGradient>

        {/* Red glowing core radial gradient */}
        <radialGradient id="redCoreGlow" cx="50%" cy="50%" r="50%">
          <stop stopColor="#fca5a5" offset="0%" />
          <stop stopColor="#ef4444" offset="50%" />
          <stop stopColor="#991b1b" offset="100%" />
        </radialGradient>

        {/* Red thruster plume gradient */}
        <linearGradient id="thrusterPlumeRed" x1="0" y1="0" x2="0" y2="1">
          <stop stopColor="#ef4444" stopOpacity="0.95" offset="0%" />
          <stop stopColor="#dc2626" stopOpacity="0.45" offset="60%" />
          <stop stopColor="#991b1b" stopOpacity="0" offset="100%" />
        </linearGradient>

        {/* Red Neon Glow Filter */}
        <filter id="redNeonGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="1.8" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      {/* ANTENNA & TRANSMITTER */}
      <line x1="34" y1="12" x2="34" y2="5" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" />
      <circle cx="34" cy="4.5" r="3" fill="#f87171" className="animate-red-core-pulse" filter="url(#redNeonGlow)" />
      <circle cx="34" cy="4.5" r="1.2" fill="#ffffff" />

      {/* HEAD SECTION */}
      {/* Ear Audio Receivers (L & R) */}
      <rect x="17" y="19" width="3.5" height="11" rx="1.75" fill="#7f1d1d" stroke="#ef4444" strokeWidth="0.8" />
      <rect x="47.5" y="19" width="3.5" height="11" rx="1.75" fill="#7f1d1d" stroke="#ef4444" strokeWidth="0.8" />

      {/* Helmet Outer Shell (Dark metallic with red stroke) */}
      <rect
        x="20"
        y="12"
        width="28"
        height="25"
        rx="8"
        fill="url(#headArmorRed)"
        stroke="#dc2626"
        strokeWidth="1.5"
      />

      {/* Forehead Sensor Ridge / Crown */}
      <path d="M25 15H43" stroke="#ef4444" strokeWidth="1" strokeLinecap="round" opacity="0.8" />
      <circle cx="34" cy="15" r="1.5" fill="#ef4444" />

      {/* Dark Visor Screen */}
      <rect
        x="23.5"
        y="18"
        width="21"
        height="13.5"
        rx="4"
        fill="#050508"
        stroke="#991b1b"
        strokeWidth="1"
      />

      {/* Glowing Red Eyes (with blinking animation) */}
      <g className="animate-eye-blink">
        <rect x="26.5" y="21.5" width="4.5" height="5.5" rx="2" fill="#ef4444" filter="url(#redNeonGlow)" />
        <rect x="37" y="21.5" width="4.5" height="5.5" rx="2" fill="#ef4444" filter="url(#redNeonGlow)" />
        <circle cx="28" cy="23" r="1" fill="#ffffff" />
        <circle cx="38.5" cy="23" r="1" fill="#ffffff" />
      </g>

      {/* Friendly Mouth Arc / Live Wave */}
      {isOpen ? (
        <path d="M28.5 28.5C30.5 30.5 37.5 30.5 39.5 28.5" stroke="#f87171" strokeWidth="1.4" strokeLinecap="round" />
      ) : (
        <line x1="29" y1="28.5" x2="39" y2="28.5" stroke="#ef4444" strokeWidth="1.2" strokeLinecap="round" opacity="0.85" />
      )}

      {/* NECK JOINT */}
      <rect x="29.5" y="36.5" width="9" height="4" rx="1.5" fill="#27272a" stroke="#71717a" strokeWidth="0.8" />
      <line x1="31" y1="38.5" x2="37" y2="38.5" stroke="#ef4444" strokeWidth="0.8" strokeLinecap="round" />

      {/* TORSO & CHESTPLATE */}
      <path
        d="M19 43C19 41.5 20.5 40 22.5 40H45.5C47.5 40 49 41.5 49 43L47.5 62C47.5 63.5 46 65 44 65H24C22 65 20.5 63.5 20.5 62L19 43Z"
        fill="url(#chestPlateRed)"
        stroke="#dc2626"
        strokeWidth="1.5"
      />

      {/* Chest Armor Inset Lines */}
      <path d="M22 45L28 51M46 45L40 51" stroke="#ef4444" strokeWidth="1" strokeLinecap="round" opacity="0.6" />

      {/* CHEST ENERGY INDICATOR (Arc Reactor Core) */}
      <circle cx="34" cy="51.5" r="6.5" fill="#18181b" stroke="#dc2626" strokeWidth="1.2" />
      <circle cx="34" cy="51.5" r="4" fill="url(#redCoreGlow)" className="animate-red-core-pulse" filter="url(#redNeonGlow)" />
      {/* Energy core cross motif */}
      <path d="M34 49V54M32 51.5H36" stroke="#ffffff" strokeWidth="1" strokeLinecap="round" opacity="0.9" />

      {/* SHOULDER JOINTS */}
      {/* Left Shoulder */}
      <circle cx="16.5" cy="43.5" r="4" fill="#18181b" stroke="#ef4444" strokeWidth="1" />
      <circle cx="16.5" cy="43.5" r="1.5" fill="#dc2626" />

      {/* Right Shoulder */}
      <circle cx="51.5" cy="43.5" r="4" fill="#18181b" stroke="#ef4444" strokeWidth="1" />
      <circle cx="51.5" cy="43.5" r="1.5" fill="#dc2626" />

      {/* ARMS & HANDS */}
      {/* Left Arm */}
      <path
        d="M15 47L12.5 56C12 57.5 12.5 59 13.5 60L14 62"
        stroke="#27272a"
        strokeWidth="3.5"
        strokeLinecap="round"
      />
      <path
        d="M15 47L12.5 56C12 57.5 12.5 59 13.5 60L14 62"
        stroke="#ef4444"
        strokeWidth="1"
        strokeLinecap="round"
        fill="none"
      />
      <rect x="11.5" y="61" width="5" height="5.5" rx="2" fill="#18181b" stroke="#ef4444" strokeWidth="1" />

      {/* Right Arm */}
      <path
        d="M53 47L55.5 56C56 57.5 55.5 59 54.5 60L54 62"
        stroke="#27272a"
        strokeWidth="3.5"
        strokeLinecap="round"
      />
      <path
        d="M53 47L55.5 56C56 57.5 55.5 59 54.5 60L54 62"
        stroke="#ef4444"
        strokeWidth="1"
        strokeLinecap="round"
        fill="none"
      />
      <rect x="51.5" y="61" width="5" height="5.5" rx="2" fill="#18181b" stroke="#ef4444" strokeWidth="1" />

      {/* PELVIS / WAIST BELT */}
      <rect x="23" y="64" width="22" height="4.5" rx="2" fill="#18181b" stroke="#7f1d1d" strokeWidth="1" />
      <circle cx="34" cy="66.2" r="1.5" fill="#ef4444" />

      {/* LEGS & FEET / THRUSTER NOZZLES */}
      {/* Left Leg */}
      <rect x="24" y="68.5" width="6.5" height="9" rx="2.5" fill="#18181b" stroke="#dc2626" strokeWidth="1" />
      <circle cx="27.2" cy="77.5" r="2.2" fill="#27272a" stroke="#ef4444" strokeWidth="0.8" />
      <path d="M23 80H31.5L30 85.5C29.7 86.5 28.8 87 27.5 87H27C25.7 87 24.8 86.5 24.5 85.5L23 80Z" fill="#18181b" stroke="#ef4444" strokeWidth="1" />

      {/* Right Leg */}
      <rect x="37.5" y="68.5" width="6.5" height="9" rx="2.5" fill="#18181b" stroke="#dc2626" strokeWidth="1" />
      <circle cx="40.8" cy="77.5" r="2.2" fill="#27272a" stroke="#ef4444" strokeWidth="0.8" />
      <path d="M36.5 80H45L43.5 85.5C43.2 86.5 42.3 87 41 87H40.5C39.2 87 38.3 86.5 38 85.5L36.5 80Z" fill="#18181b" stroke="#ef4444" strokeWidth="1" />

      {/* THRUSTER HOVER PLUMES */}
      <g className="animate-red-thruster">
        <ellipse cx="27.2" cy="89" rx="3.5" ry="3" fill="url(#thrusterPlumeRed)" />
        <ellipse cx="40.8" cy="89" rx="3.5" ry="3" fill="url(#thrusterPlumeRed)" />
        <circle cx="27.2" cy="87.5" r="1.5" fill="#fca5a5" />
        <circle cx="40.8" cy="87.5" r="1.5" fill="#fca5a5" />
      </g>
    </svg>
  );
};

// Simplified Mini Icon for Header
const MiniRobotIcon: React.FC<{ className?: string }> = ({ className = "w-4 h-4" }) => {
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
