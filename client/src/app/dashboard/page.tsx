"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  GraduationCap, 
  Zap, 
  FileText, 
  Code, 
  MessageSquare, 
  ArrowRight, 
  MessageCircle,
  Loader2,
  Clock
} from "lucide-react";
import api from "@/lib/axios";

interface Chat {
  _id: string;
  assistantType: 'Tutor' | 'ExamCoach' | 'NotesExplainer' | 'CodingTutor' | 'InterviewTrainer';
  title: string;
  updatedAt: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(true);
  const [creatingType, setCreatingType] = useState<string | null>(null);

  useEffect(() => {
    const fetchChats = async () => {
      try {
        const { data } = await api.get("/chats");
        setChats(data);
      } catch (err) {
        console.error("Failed to load user chats", err);
      } finally {
        setLoading(false);
      }
    };
    fetchChats();
  }, []);

  const handleStartChat = async (assistantType: string) => {
    try {
      setCreatingType(assistantType);
      const { data } = await api.post("/chats", { 
        assistantType,
        title: `New ${assistantType === 'ExamCoach' ? 'Exam Coach' : assistantType === 'NotesExplainer' ? 'Notes Explainer' : assistantType === 'CodingTutor' ? 'Coding Tutor' : assistantType === 'InterviewTrainer' ? 'Interview Trainer' : 'Personal Tutor'} Session`
      });
      router.push(`/dashboard/chat/${data._id}`);
    } catch (err) {
      console.error("Failed to create chat", err);
      alert("Failed to start session. Please try again.");
    } finally {
      setCreatingType(null);
    }
  };

  const assistants = [
    {
      type: "Tutor",
      title: "AI Personal Tutor",
      icon: <GraduationCap className="w-6 h-6 text-violet-400" />,
      color: "from-violet-500/20 to-purple-500/20 border-violet-500/30",
      glowColor: "hover:shadow-violet-500/10",
      btnBg: "bg-violet-600 hover:bg-violet-500 text-white",
      description: "Explain concepts simply, with beginner/advanced modes and auto-generated learning quizzes.",
      bullets: ["Simple Concept breakdown", "Difficulty modes", "Follow-up questions", "Interactive Quizzes"]
    },
    {
      type: "ExamCoach",
      title: "AI Exam Coach",
      icon: <Zap className="w-6 h-6 text-amber-400" />,
      color: "from-amber-500/20 to-yellow-500/20 border-amber-500/30",
      glowColor: "hover:shadow-amber-500/10",
      btnBg: "bg-amber-600 hover:bg-amber-500 text-slate-900",
      description: "Design exam schedules, weekly priorities, revision trackers, and score targeted mock test suggestions.",
      bullets: ["Custom Timetable generator", "Weekly revision goals", "Daily checklists", "Mock test advisor"]
    },
    {
      type: "NotesExplainer",
      title: "AI Notes Explainer",
      icon: <FileText className="w-6 h-6 text-blue-400" />,
      color: "from-blue-500/20 to-cyan-500/20 border-blue-500/30",
      glowColor: "hover:shadow-blue-500/10",
      btnBg: "bg-blue-600 hover:bg-blue-500 text-white",
      description: "Upload PDFs to extract notes, query content via semantic RAG, and generate flashcard summaries.",
      bullets: ["PDF upload text extraction", "Contextual RAG answers", "Summarize key chapters", "Flashcard builders"]
    },
    {
      type: "CodingTutor",
      title: "AI Coding Tutor",
      icon: <Code className="w-6 h-6 text-emerald-400" />,
      color: "from-emerald-500/20 to-teal-500/20 border-emerald-500/30",
      glowColor: "hover:shadow-emerald-500/10",
      btnBg: "bg-emerald-600 hover:bg-emerald-500 text-white",
      description: "Inspect code syntax, analyze big O performance, locate security bugs, and solve coding exercises.",
      bullets: ["Multi-language reviews", "Bug finder & repair", "Time/Space complexity", "Practice challenges"]
    },
    {
      type: "InterviewTrainer",
      title: "AI Interview Trainer",
      icon: <MessageSquare className="w-6 h-6 text-pink-400" />,
      color: "from-pink-500/20 to-rose-500/20 border-pink-500/30",
      glowColor: "hover:shadow-pink-500/10",
      btnBg: "bg-pink-600 hover:bg-pink-500 text-white",
      description: "Conduct technical mock interviews, reviewing coding role outputs with constructive feedback reports.",
      bullets: ["Role selection setup", "Interactive turn-based QA", "Constructive feedback reports", "Score metrics & evaluations"]
    }
  ];

  return (
    <div className="space-y-10">
      
      {/* Hero Welcome banner */}
      <div className="relative rounded-3xl p-8 overflow-hidden glass-panel border border-slate-200/80 dark:border-slate-800/80">
        <div className="absolute inset-0 bg-gradient-to-r from-violet-600/10 via-indigo-600/5 to-transparent"></div>
        <div className="relative z-10 max-w-2xl space-y-3">
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">
            Accelerate Your Learning Path
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-base font-light leading-relaxed">
            Choose from five highly specialized AI assistants. Each agent utilizes customized prompt instructions and tailored tools to guide your objectives.
          </p>
        </div>
      </div>

      {/* Grid of Assistants */}
      <div>
        <h2 className="text-2xl font-extrabold mb-6 tracking-tight flex items-center gap-2">
          Select Your AI Assistant
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {assistants.map((assistant) => (
            <div 
              key={assistant.type} 
              className={`glass-card rounded-2xl p-6 border flex flex-col justify-between transition-all ${assistant.color} ${assistant.glowColor}`}
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-slate-900 rounded-xl">
                    {assistant.icon}
                  </div>
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-1 bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-md">
                    Dedicated Agent
                  </span>
                </div>
                
                <h3 className="text-xl font-bold mb-2">{assistant.title}</h3>
                <p className="text-slate-500 dark:text-slate-400 text-sm mb-6 leading-relaxed">
                  {assistant.description}
                </p>

                {/* Capability bullet checklist */}
                <ul className="space-y-2 mb-6">
                  {assistant.bullets.map((bullet, idx) => (
                    <li key={idx} className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
                      <div className="w-1.5 h-1.5 rounded-full bg-violet-400"></div>
                      {bullet}
                    </li>
                  ))}
                </ul>
              </div>

              <button
                onClick={() => handleStartChat(assistant.type)}
                disabled={creatingType !== null}
                className={`w-full py-3 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2 cursor-pointer ${assistant.btnBg}`}
              >
                {creatingType === assistant.type ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Launching...
                  </>
                ) : (
                  <>
                    Start Session <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Recents Session list */}
      {chats.length > 0 && (
        <div className="glass-panel rounded-2xl p-6 border border-slate-200/80 dark:border-slate-800/80">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-slate-400" /> Recent Learning Sessions
          </h3>
          <div className="divide-y divide-slate-200 dark:divide-slate-800">
            {chats.slice(0, 5).map((chat) => (
              <div 
                key={chat._id} 
                onClick={() => router.push(`/dashboard/chat/${chat._id}`)}
                className="py-3.5 flex items-center justify-between cursor-pointer hover:bg-slate-200/30 dark:hover:bg-slate-800/30 transition-all rounded-lg px-2 group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-slate-900 rounded-lg">
                    {chat.assistantType === "Tutor" && <GraduationCap className="w-4 h-4 text-violet-400" />}
                    {chat.assistantType === "ExamCoach" && <Zap className="w-4 h-4 text-amber-400" />}
                    {chat.assistantType === "NotesExplainer" && <FileText className="w-4 h-4 text-blue-400" />}
                    {chat.assistantType === "CodingTutor" && <Code className="w-4 h-4 text-emerald-400" />}
                    {chat.assistantType === "InterviewTrainer" && <MessageSquare className="w-4 h-4 text-pink-400" />}
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold group-hover:text-violet-400 transition-colors">{chat.title}</h4>
                    <p className="text-[11px] text-slate-400">
                      Modified {new Date(chat.updatedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all text-violet-400" />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
