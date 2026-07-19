"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight, BookOpen, GraduationCap, FileText, Code, MessageSquare, Zap, Sparkles } from "lucide-react";

export default function Home() {
  const assistants = [
    {
      icon: <GraduationCap className="w-6 h-6 text-violet-400" />,
      title: "AI Personal Tutor",
      description: "Explains complex academic concepts simply, matching your learning speed with customizable difficulty modes.",
    },
    {
      icon: <Zap className="w-6 h-6 text-amber-400" />,
      title: "AI Exam Coach",
      description: "Generates daily revision schedules, weekly goals, study planners, and mock test recommenders for high stakes tests.",
    },
    {
      icon: <FileText className="w-6 h-6 text-blue-400" />,
      title: "AI Notes Explainer",
      description: "Upload your study PDFs to extract topics, summarize chapters, ask deep context questions, and create dynamic flashcards.",
    },
    {
      icon: <Code className="w-6 h-6 text-emerald-400" />,
      title: "AI Coding Tutor",
      description: "Interactive code debugger and static analyzer. Evaluates time & space complexity, suggests repairs, and generates practices.",
    },
    {
      icon: <MessageSquare className="w-6 h-6 text-pink-400" />,
      title: "AI Interview Trainer",
      description: "Interactive mock interviews asking role-specific technical questions one-by-one, calculating scoring evaluations and feedbacks.",
    },
  ];

  return (
    <div className="relative min-h-screen bg-[#090d16] text-[#f1f5f9] flex flex-col items-center justify-between overflow-hidden">
      {/* Background Blobs */}
      <div className="absolute top-1/6 left-1/4 w-96 h-96 bg-purple-600 rounded-full mix-blend-screen filter blur-[120px] opacity-20 animate-blob"></div>
      <div className="absolute bottom-1/5 right-1/4 w-96 h-96 bg-indigo-600 rounded-full mix-blend-screen filter blur-[120px] opacity-20 animate-blob animation-delay-2000"></div>

      {/* Header navbar */}
      <header className="w-full max-w-7xl px-6 py-6 flex items-center justify-between z-10">
        <div className="flex items-center gap-2">
          <BookOpen className="w-6 h-6 text-violet-400" />
          <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent">
            AI Learning Hub
          </span>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/login" className="text-slate-400 hover:text-slate-200 text-sm font-semibold transition-all">
            Log In
          </Link>
          <Link
            href="/signup"
            className="px-4 py-2 bg-violet-600 hover:bg-violet-500 text-sm font-semibold rounded-lg transition-all shadow-md hover:shadow-violet-600/20"
          >
            Sign Up
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <main className="w-full max-w-7xl px-6 py-12 flex flex-col items-center justify-center text-center z-10 flex-1">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-violet-950/40 border border-violet-500/30 text-violet-300 rounded-full text-xs font-semibold mb-6">
          <Sparkles className="w-3.5 h-3.5" /> Empowering Lifelong Learners with AI
        </div>

        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight max-w-4xl mb-6 leading-tight">
          Supercharge Your Goals with{" "}
          <span className="bg-gradient-to-r from-violet-400 via-fuchsia-400 to-indigo-400 bg-clip-text text-transparent">
            Specialized AI Coaches
          </span>
        </h1>

        <p className="text-lg md:text-xl text-slate-400 max-w-2xl mb-10 leading-relaxed font-light">
          Say goodbye to generic chatbots. Experience an immersive hub of five dedicated learning assistants tailored to your study, coding, and interview prep.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-4 mb-20">
          <Link
            href="/signup"
            className="px-8 py-4 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-semibold rounded-xl shadow-xl hover:shadow-violet-600/20 active:scale-95 transition-all flex items-center gap-2"
          >
            Get Started Free <ArrowRight className="w-5 h-5" />
          </Link>
          <Link
            href="/login"
            className="px-8 py-4 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-[#f1f5f9] font-semibold rounded-xl transition-all"
          >
            Enter Dashboard
          </Link>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 w-full text-left">
          {assistants.map((assistant, index) => (
            <div key={index} className="glass-card p-6 rounded-2xl relative overflow-hidden flex flex-col justify-between">
              <div>
                <div className="p-3 bg-slate-950/80 rounded-xl w-fit mb-4">
                  {assistant.icon}
                </div>
                <h3 className="text-lg font-bold mb-2 text-white">{assistant.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{assistant.description}</p>
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full max-w-7xl px-6 py-8 border-t border-slate-900 text-center text-slate-500 text-xs z-10">
        © {new Date().getFullYear()} AI Learning Hub. All rights reserved.
      </footer>
    </div>
  );
}

