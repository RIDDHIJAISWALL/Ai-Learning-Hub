"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { 
  Code, Play, Loader2, Zap, Bug, HelpCircle, Lightbulb,
  Copy, Check, ArrowRight, ChevronDown
} from "lucide-react";
import api from "@/lib/axios";

const LANGUAGES = [
  "JavaScript", "TypeScript", "Python", "Java", "C++", "C#", "Go", "Rust",
  "Swift", "Kotlin", "PHP", "Ruby", "SQL"
];

const ACTION_TYPES = [
  { id: "review", label: "Code Review", icon: <Zap className="w-4 h-4" />, color: "text-violet-400" },
  { id: "debug", label: "Debug Help", icon: <Bug className="w-4 h-4" />, color: "text-red-400" },
  { id: "explain", label: "Explain Code", icon: <HelpCircle className="w-4 h-4" />, color: "text-blue-400" },
  { id: "optimize", label: "Optimize", icon: <Lightbulb className="w-4 h-4" />, color: "text-amber-400" },
  { id: "practice", label: "Practice Problem", icon: <Code className="w-4 h-4" />, color: "text-emerald-400" }
];

export default function CodingTutorPage() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [language, setLanguage] = useState("JavaScript");
  const [actionType, setActionType] = useState("review");
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [chatLoading, setChatLoading] = useState(false);

  const handleAnalyze = async () => {
    if (actionType !== "practice" && !code.trim()) {
      setError("Please enter some code first.");
      return;
    }
    setLoading(true);
    setError("");
    setResult(null);

    try {
      let endpoint = "";
      let body: Record<string, any> = { code, language };

      if (actionType === "review") endpoint = "/coding/review";
      else if (actionType === "debug") endpoint = "/coding/debug";
      else if (actionType === "explain") endpoint = "/coding/explain";
      else if (actionType === "optimize") endpoint = "/coding/optimize";
      else if (actionType === "practice") {
        endpoint = "/coding/practice";
        body = { language, difficulty: "medium", topic: "" };
      }

      const { data } = await api.post(endpoint, body);
      setResult(data);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to analyze. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const copyCode = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const openCodingChat = async () => {
    try {
      setChatLoading(true);
      const { data } = await api.post("/chats", {
        assistantType: "CodingTutor",
        title: "Coding Tutor Session"
      });
      router.push(`/dashboard/chat/${data._id}`);
    } catch (err) {
      console.error("Failed to start coding chat", err);
    } finally {
      setChatLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight mb-1 flex items-center gap-2">
            <Code className="w-7 h-7 text-emerald-400" /> Coding Tutor
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm">
            Paste your code for instant review, debugging, explanations, and practice problems.
          </p>
        </div>
        <button
          onClick={openCodingChat}
          disabled={chatLoading}
          className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-sm transition-all"
        >
          {chatLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
          Open Chat
        </button>
      </div>

      {/* Action type picker */}
      <div className="flex flex-wrap gap-2">
        {ACTION_TYPES.map((action) => (
          <button
            key={action.id}
            onClick={() => setActionType(action.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-semibold transition-all ${
              actionType === action.id
                ? "bg-slate-900 border-emerald-500/50 text-emerald-400"
                : "glass-card border-slate-200/80 dark:border-slate-800/80 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
            }`}
          >
            <span className={actionType === action.id ? action.color : ""}>{action.icon}</span>
            {action.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Code Input */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-sm font-bold">
              {actionType === "practice" ? "Target Language" : "Your Code"}
            </label>
            <div className="relative">
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="appearance-none bg-slate-100 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-700 text-sm font-semibold px-3 py-1.5 pr-7 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
              >
                {LANGUAGES.map((lang) => (
                  <option key={lang} value={lang}>{lang}</option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400" />
            </div>
          </div>

          {actionType !== "practice" ? (
            <div className="relative">
              <textarea
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder={`// Paste your ${language} code here...\nfunction example() {\n  // Your code\n}`}
                rows={18}
                className="w-full px-4 py-3 bg-[#0d1117] dark:bg-[#0d1117] border border-slate-700 text-emerald-400 font-mono text-sm rounded-2xl resize-none focus:outline-none focus:ring-2 focus:ring-emerald-500 placeholder:text-slate-600 leading-relaxed"
                style={{ fontFamily: "'JetBrains Mono', 'Fira Code', monospace" }}
              />
              {code && (
                <button
                  onClick={() => setCode("")}
                  className="absolute top-3 right-3 text-xs text-slate-500 hover:text-slate-300 transition-all"
                >
                  Clear
                </button>
              )}
            </div>
          ) : (
            <div className="h-48 glass-card border border-slate-200/80 dark:border-slate-800/80 rounded-2xl flex flex-col items-center justify-center gap-3 text-slate-400">
              <Code className="w-10 h-10 text-emerald-400/40" />
              <p className="text-sm text-center px-6">
                Click <strong className="text-emerald-400">Analyze</strong> to generate a {language} practice problem with full explanation.
              </p>
            </div>
          )}

          {error && (
            <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-2.5">
              {error}
            </div>
          )}

          <button
            onClick={handleAnalyze}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold rounded-xl text-sm transition-all shadow-md disabled:opacity-50"
          >
            {loading ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Analyzing with AI...</>
            ) : (
              <><Play className="w-4 h-4" /> {ACTION_TYPES.find(a => a.id === actionType)?.label}</>
            )}
          </button>
        </div>

        {/* Result Panel */}
        <div className="glass-panel border border-slate-200/50 dark:border-slate-800/50 rounded-2xl overflow-hidden flex flex-col">
          <div className="flex items-center justify-between px-5 py-3 border-b border-slate-200/50 dark:border-slate-800/50 bg-slate-100/50 dark:bg-slate-900/30">
            <span className="text-sm font-bold text-emerald-400">AI Analysis Output</span>
            {result && (
              <button
                onClick={() => copyCode(JSON.stringify(result, null, 2))}
                className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-300 transition-all"
              >
                {copied ? <><Check className="w-3 h-3 text-green-400" /> Copied!</> : <><Copy className="w-3 h-3" /> Copy</>}
              </button>
            )}
          </div>

          <div className="flex-1 p-5 overflow-y-auto max-h-[500px]">
            {loading && (
              <div className="flex flex-col items-center justify-center h-full gap-3 text-slate-400 py-16">
                <div className="flex gap-1.5">
                  <div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></div>
                  <div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></div>
                  <div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></div>
                </div>
                <p className="text-sm">Analyzing your code...</p>
              </div>
            )}

            {!loading && !result && (
              <div className="flex flex-col items-center justify-center h-full text-slate-400 py-16 text-center">
                <Code className="w-12 h-12 mb-3 opacity-20" />
                <p className="text-sm">Paste your code and click Analyze to see the AI-powered feedback here.</p>
              </div>
            )}

            {result && (
              <div className="space-y-5 text-sm">
                
                {/* Code Review result */}
                {result.summary && (
                  <div>
                    <h3 className="font-bold text-emerald-400 mb-2 flex items-center gap-1.5"><Zap className="w-4 h-4" /> Summary</h3>
                    <p className="text-slate-400 leading-relaxed">{result.summary}</p>
                  </div>
                )}
                {result.issues && result.issues.length > 0 && (
                  <div>
                    <h3 className="font-bold text-red-400 mb-2 flex items-center gap-1.5"><Bug className="w-4 h-4" /> Issues Found</h3>
                    <ul className="space-y-1.5">
                      {result.issues.map((issue: string, i: number) => (
                        <li key={i} className="flex items-start gap-2 text-slate-400">
                          <span className="text-red-400 shrink-0 mt-0.5">•</span>{issue}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {result.suggestions && result.suggestions.length > 0 && (
                  <div>
                    <h3 className="font-bold text-amber-400 mb-2 flex items-center gap-1.5"><Lightbulb className="w-4 h-4" /> Suggestions</h3>
                    <ul className="space-y-1.5">
                      {result.suggestions.map((s: string, i: number) => (
                        <li key={i} className="flex items-start gap-2 text-slate-400">
                          <span className="text-amber-400 shrink-0 mt-0.5">→</span>{s}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {result.improvedCode && (
                  <div>
                    <h3 className="font-bold text-violet-400 mb-2">Improved Code</h3>
                    <pre className="bg-[#0d1117] border border-slate-700 rounded-xl p-4 overflow-x-auto text-emerald-400 font-mono text-xs leading-relaxed">
                      {result.improvedCode}
                    </pre>
                  </div>
                )}
                {result.complexity && (
                  <div className="flex flex-wrap gap-3">
                    {result.complexity.time && (
                      <div className="glass-card border border-slate-700 rounded-lg px-3 py-2">
                        <p className="text-[11px] text-slate-500 mb-0.5">Time Complexity</p>
                        <p className="font-mono font-bold text-violet-400 text-sm">{result.complexity.time}</p>
                      </div>
                    )}
                    {result.complexity.space && (
                      <div className="glass-card border border-slate-700 rounded-lg px-3 py-2">
                        <p className="text-[11px] text-slate-500 mb-0.5">Space Complexity</p>
                        <p className="font-mono font-bold text-blue-400 text-sm">{result.complexity.space}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Debug / Explain / Optimize (generic response fields) */}
                {result.explanation && (
                  <div>
                    <h3 className="font-bold text-blue-400 mb-2 flex items-center gap-1.5"><HelpCircle className="w-4 h-4" /> Explanation</h3>
                    <p className="text-slate-400 leading-relaxed">{result.explanation}</p>
                  </div>
                )}
                {result.bugs && result.bugs.length > 0 && (
                  <div>
                    <h3 className="font-bold text-red-400 mb-2">Bugs Found</h3>
                    <ul className="space-y-1.5">
                      {result.bugs.map((b: string, i: number) => (
                        <li key={i} className="flex items-start gap-2 text-slate-400">
                          <span className="text-red-400 shrink-0 mt-0.5">•</span>{b}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {result.fixedCode && (
                  <div>
                    <h3 className="font-bold text-emerald-400 mb-2">Fixed Code</h3>
                    <pre className="bg-[#0d1117] border border-slate-700 rounded-xl p-4 overflow-x-auto text-emerald-400 font-mono text-xs leading-relaxed">
                      {result.fixedCode}
                    </pre>
                  </div>
                )}

                {/* Practice Problem */}
                {result.title && (
                  <div>
                    <h3 className="font-bold text-emerald-400 mb-2 text-base">{result.title}</h3>
                  </div>
                )}
                {result.difficulty && (
                  <span className={`inline-block text-xs font-bold px-2 py-0.5 rounded-full ${
                    result.difficulty === "Easy" ? "bg-emerald-500/20 text-emerald-400" :
                    result.difficulty === "Medium" ? "bg-amber-500/20 text-amber-400" :
                    "bg-red-500/20 text-red-400"
                  }`}>{result.difficulty}</span>
                )}
                {result.description && (
                  <p className="text-slate-400 leading-relaxed">{result.description}</p>
                )}
                {result.examples && result.examples.length > 0 && (
                  <div>
                    <h4 className="font-bold text-slate-300 mb-2">Examples</h4>
                    <div className="space-y-2">
                      {result.examples.map((ex: any, i: number) => (
                        <div key={i} className="bg-[#0d1117] border border-slate-700 rounded-xl px-4 py-3 font-mono text-xs text-emerald-400">
                          <p>Input: {ex.input}</p>
                          <p>Output: {ex.output}</p>
                          {ex.explanation && <p className="text-slate-500 mt-1">// {ex.explanation}</p>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {result.hints && result.hints.length > 0 && (
                  <div>
                    <h4 className="font-bold text-amber-400 mb-2">Hints</h4>
                    <ul className="space-y-1.5">
                      {result.hints.map((h: string, i: number) => (
                        <li key={i} className="text-slate-400 flex items-start gap-2">
                          <span className="text-amber-400 shrink-0 mt-0.5">💡</span>{h}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
