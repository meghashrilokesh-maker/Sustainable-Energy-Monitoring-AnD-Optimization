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
        "Hi there! I'm your PULSEGRID AI Advisor! I'm directly connected to the campus 1R1C digital twin physics model, Computer Vision occupancy feeds, and electrical meters.\n\nAll numbers are strictly verified via live tool execution. How can I assist your energy decisions today?",
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
          className="fixed bottom-32 right-4 sm:right-6 z-50 w-[calc(100vw-2rem)] sm:w-[440px] max-w-[460px] h-[590px] max-h-[calc(100vh-9.5rem)] flex flex-col rounded-2xl border border-purple-500/40 bg-[#0c0a1a]/95 backdrop-blur-xl shadow-2xl shadow-purple-950/50 overflow-hidden transition-all duration-300 animate-in fade-in zoom-in-95"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-purple-900/40 bg-purple-950/40 backdrop-blur-sm">
            <div className="flex items-center gap-2.5">
              <div className="relative flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-purple-600/30 to-purple-900/40 border border-purple-500/50 text-purple-300">
                <MiniCuteRobotIcon className="w-5 h-5 text-purple-300" />
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-slate-900" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="text-xs font-bold text-slate-100 tracking-wide uppercase">PULSEGRID AI Advisor</h3>
                  <span className="px-1.5 py-0.2 rounded text-[9px] font-mono bg-purple-950/80 border border-purple-500/40 text-purple-200">
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
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-purple-950/50 transition"
              >
                <Minus className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close AI Advisor"
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-purple-950/50 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Preset Questions Bar */}
          <div className="px-3 py-2 border-b border-purple-900/30 bg-purple-950/20 overflow-x-auto">
            <div className="flex items-center gap-1.5 whitespace-nowrap">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider shrink-0 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-purple-400" />
                <span>Presets:</span>
              </span>
              {predefinedQuestions.map((q, i) => (
                <button
                  key={i}
                  type="button"
                  disabled={loading}
                  onClick={() => handleSend(q)}
                  className="text-[11px] px-2.5 py-1 rounded-full bg-purple-950/60 hover:bg-purple-900/70 border border-purple-800/60 hover:border-purple-500/60 text-slate-200 hover:text-purple-100 transition shrink-0 disabled:opacity-50"
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
                      ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-medium shadow-md shadow-purple-950/40"
                      : "bg-slate-900/90 border border-purple-900/40 text-slate-200 shadow-sm"
                  }`}
                >
                  {msg.sender === "advisor" && (
                    <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-slate-800 text-[10px]">
                      <div className="flex items-center gap-1.5 text-purple-300 font-semibold">
                        <Cpu className="w-3 h-3" />
                        <span>PULSEGRID AI Companion</span>
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
                              className="text-[9px] px-1.5 py-0.5 rounded bg-purple-950/60 border border-purple-800 text-purple-200 font-mono"
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
                        className="text-[9px] text-purple-300 hover:text-purple-200 flex items-center gap-1"
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
              <div className="flex items-center gap-2 p-2.5 rounded-lg bg-purple-950/40 border border-purple-800/40 text-xs text-purple-200 italic">
                <Sparkles className="w-3.5 h-3.5 text-purple-400 animate-spin" />
                <span>Analyzing building physics and computing scenario results...</span>
              </div>
            )}

            {/* Error Banner with Retry */}
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
            className="p-3 border-t border-purple-900/40 bg-purple-950/30 flex items-center gap-2"
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
              className="flex-1 bg-slate-950 border border-purple-900/50 rounded-xl px-3.5 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-purple-400 font-sans disabled:opacity-60"
            />
            <button
              type="submit"
              disabled={loading || !inputQuery.trim()}
              aria-label="Send Message"
              className="px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-semibold text-xs transition flex items-center gap-1.5 shadow-md shadow-purple-950/40"
            >
              <Send className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Send</span>
            </button>
          </form>
        </aside>
      )}

      {/* Floating Cute Robot Trigger — NO ENCLOSING BOX / CARD / BORDER */}
      <div className="group fixed bottom-6 right-6 sm:right-8 z-40 flex flex-col items-center">
        {/* Hover / Focus Tooltip */}
        <div
          role="tooltip"
          className="absolute bottom-full mb-3 px-3 py-1.5 rounded-lg bg-slate-950/90 border border-purple-500/40 text-purple-200 text-xs font-medium shadow-xl whitespace-nowrap opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity duration-200 pointer-events-none flex items-center gap-1.5 z-50 backdrop-blur-sm"
        >
          <Sparkles className="w-3.5 h-3.5 text-purple-400" />
          <span>Ask PulseGrid AI</span>
          <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-slate-950" />
        </div>

        {/* The Cute Robot itself IS the clickable element — completely free of any enclosing card/box/border background */}
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
          className="relative bg-transparent border-0 p-0 m-0 shadow-none outline-none focus:outline-none cursor-pointer select-none"
        >
          {/* Animated jumping cute robot */}
          <div className={`transition-transform duration-300 group-hover:scale-115 ${isOpen ? "scale-105" : "animate-cute-jump"}`}>
            <CutePurpleRobotAvatar
              className="w-20 h-26 sm:w-24 sm:h-30 drop-shadow-[0_0_20px_rgba(192,132,252,0.6)] transition-all"
              isOpen={isOpen}
            />
          </div>
        </button>
      </div>
    </>
  );
};

// Cute Full-Body Purple Robot Character SVG
const CutePurpleRobotAvatar: React.FC<{ className?: string; isOpen?: boolean }> = ({ 
  className = "w-20 h-26", 
  isOpen = false 
}) => {
  return (
    <svg
      viewBox="0 0 76 96"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <defs>
        {/* Cute Head Gradient */}
        <linearGradient id="cuteHeadGrad" x1="15" y1="18" x2="61" y2="54" gradientUnits="userSpaceOnUse">
          <stop stopColor="#4c1d95" />
          <stop offset="0.5" stopColor="#3b0764" />
          <stop offset="1" stopColor="#1e1b4b" />
        </linearGradient>

        {/* Cute Chubby Body Gradient */}
        <linearGradient id="cuteBodyGrad" x1="23" y1="54" x2="53" y2="77" gradientUnits="userSpaceOnUse">
          <stop stopColor="#581c87" />
          <stop offset="0.6" stopColor="#3b0764" />
          <stop offset="1" stopColor="#1e1b4b" />
        </linearGradient>

        {/* Purple/Violet Glow Radial for Core & Eyes */}
        <radialGradient id="purpleEyeGlow" cx="50%" cy="50%" r="50%">
          <stop stopColor="#f5d0fe" offset="0%" />
          <stop stopColor="#d8b4fe" offset="50%" />
          <stop stopColor="#a855f7" offset="100%" />
        </radialGradient>

        {/* Purple Drop Shadow Filter */}
        <filter id="purpleNeonFilter" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="2" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      {/* ANTENNA WITH CUTE BOUNCY STAR/ORB */}
      <line x1="38" y1="18" x2="38" y2="9" stroke="#c084fc" strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="38" cy="7.5" r="4.5" fill="#e9d5ff" filter="url(#purpleNeonFilter)" />
      <circle cx="38" cy="7.5" r="2" fill="#ffffff" />

      {/* HEAD SECTION — CUTE & ROUNDED */}
      {/* Ear Headphone Cushions (Left & Right) */}
      <rect x="10" y="27" width="5.5" height="17" rx="2.75" fill="#581c87" stroke="#c084fc" strokeWidth="1.5" />
      <circle cx="12.75" cy="35.5" r="2" fill="#e9d5ff" />

      <rect x="60.5" y="27" width="5.5" height="17" rx="2.75" fill="#581c87" stroke="#c084fc" strokeWidth="1.5" />
      <circle cx="63.25" cy="35.5" r="2" fill="#e9d5ff" />

      {/* Main Rounded Helmet */}
      <rect
        x="15"
        y="18"
        width="46"
        height="36"
        rx="18"
        fill="url(#cuteHeadGrad)"
        stroke="#a855f7"
        strokeWidth="2"
      />

      {/* Shiny Headlight Top Arc */}
      <path d="M25 22C29 20 47 20 51 22" stroke="#d8b4fe" strokeWidth="1.5" strokeLinecap="round" opacity="0.6" />

      {/* Cute Deep Curved Visor Screen */}
      <rect
        x="20"
        y="24"
        width="36"
        height="23"
        rx="11.5"
        fill="#090514"
        stroke="#7e22ce"
        strokeWidth="1.5"
      />

      {/* EXPRESSIVE GLOWING VIOLET EYES (Blinking Animation) */}
      <g className="animate-cute-blink">
        {/* Left Eye */}
        <ellipse cx="29" cy="34" rx="4.5" ry="6" fill="url(#purpleEyeGlow)" filter="url(#purpleNeonFilter)" />
        {/* Left Eye Highlights */}
        <circle cx="27.5" cy="32" r="2" fill="#ffffff" />
        <circle cx="30.5" cy="36" r="1" fill="#ffffff" />

        {/* Right Eye */}
        <ellipse cx="47" cy="34" rx="4.5" ry="6" fill="url(#purpleEyeGlow)" filter="url(#purpleNeonFilter)" />
        {/* Right Eye Highlights */}
        <circle cx="45.5" cy="32" r="2" fill="#ffffff" />
        <circle cx="48.5" cy="36" r="1" fill="#ffffff" />
      </g>

      {/* CUTE BLUSHING CHEEKS */}
      <ellipse cx="23" cy="40" rx="3.5" ry="1.8" fill="#f472b6" opacity="0.65" />
      <ellipse cx="53" cy="40" rx="3.5" ry="1.8" fill="#f472b6" opacity="0.65" />

      {/* CUTE SMILING MOUTH */}
      {isOpen ? (
        <path d="M35 40.5 Q38 44.5 41 40.5 Z" fill="#e9d5ff" stroke="#c084fc" strokeWidth="1" />
      ) : (
        <path d="M35 40 Q38 43 41 40" stroke="#e9d5ff" strokeWidth="1.6" strokeLinecap="round" fill="none" />
      )}

      {/* TINY NECK COLLAR */}
      <rect x="33.5" y="52" width="9" height="3" rx="1.5" fill="#581c87" stroke="#c084fc" strokeWidth="1" />

      {/* CHUBBY ROUNDED TORSO */}
      <rect
        x="23"
        y="54"
        width="30"
        height="23"
        rx="11.5"
        fill="url(#cuteBodyGrad)"
        stroke="#a855f7"
        strokeWidth="2"
      />

      {/* CHEST ENERGY SYMBOL (Glowing Purple Core) */}
      <circle cx="38" cy="64.5" r="5.5" fill="#2e1065" stroke="#c084fc" strokeWidth="1.2" />
      <circle cx="38" cy="64.5" r="3.5" fill="#e9d5ff" className="animate-purple-core" filter="url(#purpleNeonFilter)" />
      {/* Tiny energy spark inside */}
      <path d="M38 62V67M35.5 64.5H40.5" stroke="#7e22ce" strokeWidth="1" strokeLinecap="round" />

      {/* CUTE ROUNDED ARMS */}
      {/* Left Arm (Resting cutely) */}
      <path
        d="M23 58 C16 62 16 68 20 71"
        stroke="#a855f7"
        strokeWidth="3.5"
        strokeLinecap="round"
        fill="none"
      />
      <circle cx="20" cy="71" r="2.8" fill="#c084fc" />

      {/* Right Arm (Waving cheerfully!) */}
      <path
        d="M53 58 C60 56 63 50 62 44"
        stroke="#a855f7"
        strokeWidth="3.5"
        strokeLinecap="round"
        fill="none"
      />
      <circle cx="62" cy="44" r="3" fill="#e9d5ff" filter="url(#purpleNeonFilter)" />
      {/* Tiny wave sparkles near hand */}
      <path d="M66 41 C67.5 42.5 67.5 45 66 46" stroke="#c084fc" strokeWidth="1.2" strokeLinecap="round" fill="none" />

      {/* CUTE LITTLE LEGS & FEET */}
      {/* Left Leg */}
      <rect x="27.5" y="74.5" width="7" height="9" rx="3.5" fill="#581c87" stroke="#a855f7" strokeWidth="1.5" />
      <rect x="25.5" y="81.5" width="10.5" height="4.5" rx="2.25" fill="#c084fc" filter="url(#purpleNeonFilter)" />

      {/* Right Leg */}
      <rect x="41.5" y="74.5" width="7" height="9" rx="3.5" fill="#581c87" stroke="#a855f7" strokeWidth="1.5" />
      <rect x="39.5" y="81.5" width="10.5" height="4.5" rx="2.25" fill="#c084fc" filter="url(#purpleNeonFilter)" />

      {/* SOFT PURPLE HOVER GLOW SHADOW */}
      <ellipse cx="38" cy="90" rx="14" ry="2.5" fill="rgba(192, 132, 252, 0.4)" filter="url(#purpleNeonFilter)" />
    </svg>
  );
};

// Simplified Mini Cute Icon for Chat Header
const MiniCuteRobotIcon: React.FC<{ className?: string }> = ({ className = "w-4 h-4" }) => {
  return (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} aria-hidden="true">
      <path d="M12 2V4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <circle cx="12" cy="2" r="1.5" fill="currentColor" />
      <rect x="4" y="4" width="16" height="15" rx="6" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="9" cy="11" r="1.8" fill="currentColor" />
      <circle cx="15" cy="11" r="1.8" fill="currentColor" />
      <path d="M10 15C11 16 13 16 14 15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
};
