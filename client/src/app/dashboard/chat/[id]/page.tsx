"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { 
  GraduationCap, Zap, FileText, Code, MessageSquare, 
  Send, Loader2, ArrowLeft, Bot, User, Copy, Check,
  RotateCcw, Sparkles
} from "lucide-react";
import api from "@/lib/axios";
import ReactMarkdown from "react-markdown";

interface Message {
  _id: string;
  role: "user" | "assistant";
  content: string;
  createdAt?: string;
}

interface Chat {
  _id: string;
  assistantType: string;
  title: string;
}

const ASSISTANT_CONFIG: Record<string, {
  label: string;
  icon: React.ReactNode;
  color: string;
  placeholder: string;
  systemHint: string;
}> = {
  Tutor: {
    label: "AI Personal Tutor",
    icon: <GraduationCap className="w-5 h-5 text-violet-400" />,
    color: "text-violet-400 border-violet-500/30 bg-violet-500/10",
    placeholder: "Ask me to explain any concept... e.g. 'Explain recursion with examples'",
    systemHint: "Ask me to explain concepts, give examples, quiz you, or change difficulty level."
  },
  ExamCoach: {
    label: "AI Exam Coach",
    icon: <Zap className="w-5 h-5 text-amber-400" />,
    color: "text-amber-400 border-amber-500/30 bg-amber-500/10",
    placeholder: "Tell me your exam details... e.g. 'I have JEE exam on March 15'",
    systemHint: "Share your exam name, date, and topics. I'll create a personalized study plan."
  },
  NotesExplainer: {
    label: "AI Notes Explainer",
    icon: <FileText className="w-5 h-5 text-blue-400" />,
    color: "text-blue-400 border-blue-500/30 bg-blue-500/10",
    placeholder: "Upload notes first, then ask questions... e.g. 'Summarize chapter 3'",
    systemHint: "Upload your PDF notes from the Documents page, then ask me questions about your content."
  },
  CodingTutor: {
    label: "AI Coding Tutor",
    icon: <Code className="w-5 h-5 text-emerald-400" />,
    color: "text-emerald-400 border-emerald-500/30 bg-emerald-500/10",
    placeholder: "Share your code or ask... e.g. 'Explain binary search in Python'",
    systemHint: "Paste your code, describe bugs, or ask for practice problems and code explanations."
  },
  InterviewTrainer: {
    label: "AI Interview Trainer",
    icon: <MessageSquare className="w-5 h-5 text-pink-400" />,
    color: "text-pink-400 border-pink-500/30 bg-pink-500/10",
    placeholder: "Tell me your target role... e.g. 'I want to practice for Frontend React interviews'",
    systemHint: "Tell me the role you're preparing for and I'll conduct a mock interview question by question."
  }
};

export default function ChatPage() {
  const params = useParams();
  const router = useRouter();
  const chatId = params.id as string;

  const [chat, setChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingText, setStreamingText] = useState("");
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingText, scrollToBottom]);

  useEffect(() => {
    const fetchChatData = async () => {
      try {
        setLoading(true);
        const [chatsRes, messagesRes] = await Promise.all([
          api.get("/chats"),
          api.get(`/chats/${chatId}/messages`)
        ]);
        const foundChat = chatsRes.data.find((c: Chat) => c._id === chatId);
        setChat(foundChat || null);
        setMessages(messagesRes.data);
      } catch (err) {
        console.error("Failed to load chat", err);
      } finally {
        setLoading(false);
      }
    };
    if (chatId) fetchChatData();
  }, [chatId]);

  const handleSend = async () => {
    if (!input.trim() || isStreaming) return;

    const userContent = input.trim();
    setInput("");
    setIsStreaming(true);
    setStreamingText("");

    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }

    // Optimistically add user message to UI
    const tempUserMessage: Message = {
      _id: `temp-${Date.now()}`,
      role: "user",
      content: userContent,
      createdAt: new Date().toISOString()
    };
    setMessages(prev => [...prev, tempUserMessage]);

    try {
      const token = localStorage.getItem("token");
      abortControllerRef.current = new AbortController();

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"}/chats/${chatId}/messages`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ content: userContent }),
          signal: abortControllerRef.current.signal
        }
      );

      if (!response.body) throw new Error("No response body");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = "";
      let savedUserMessage: Message | null = null;
      let savedAssistantMessage: Message | null = null;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6));

              if (data.type === "user_message") {
                savedUserMessage = data.message;
                // Replace optimistic message with saved one
                setMessages(prev => prev.map(m =>
                  m._id === tempUserMessage._id ? (data.message as Message) : m
                ));
              } else if (data.token) {
                accumulated += data.token;
                setStreamingText(accumulated);
              } else if (data.type === "done") {
                savedAssistantMessage = data.message;
                setMessages(prev => [...prev, data.message as Message]);
                setStreamingText("");
              } else if (data.type === "error") {
                console.error("Stream error:", data.message);
              }
            } catch (e) {
              // Skip malformed JSON lines
            }
          }
        }
      }
    } catch (err: any) {
      if (err.name !== "AbortError") {
        console.error("Stream failed:", err);
        setMessages(prev => [
          ...prev,
          {
            _id: `error-${Date.now()}`,
            role: "assistant",
            content: "Sorry, something went wrong. Please check your connection and try again.",
            createdAt: new Date().toISOString()
          }
        ]);
      }
    } finally {
      setIsStreaming(false);
      setStreamingText("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    // Auto-resize textarea
    e.target.style.height = "auto";
    e.target.style.height = Math.min(e.target.scrollHeight, 160) + "px";
  };

  const copyToClipboard = async (text: string, id: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const stopStreaming = () => {
    abortControllerRef.current?.abort();
    setIsStreaming(false);
    setStreamingText("");
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center h-full">
        <div className="text-center space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-violet-400 mx-auto" />
          <p className="text-slate-400 text-sm">Loading your session...</p>
        </div>
      </div>
    );
  }

  const config = chat ? ASSISTANT_CONFIG[chat.assistantType] : ASSISTANT_CONFIG["Tutor"];

  return (
    <div className="flex flex-col h-[calc(100vh-130px)] rounded-2xl overflow-hidden glass-panel border border-slate-200/50 dark:border-slate-800/50">
      
      {/* Chat Header */}
      <div className="flex items-center gap-3 px-6 py-4 border-b border-slate-200/50 dark:border-slate-800/50 bg-slate-100/50 dark:bg-slate-900/30">
        <button
          onClick={() => router.push("/dashboard")}
          className="p-2 hover:bg-slate-200/70 dark:hover:bg-slate-800/70 rounded-xl transition-all text-slate-500"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-sm font-semibold ${config.color}`}>
          {config.icon}
          {config.label}
        </div>

        <div className="ml-auto">
          <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
            <Sparkles className="w-3.5 h-3.5 text-violet-400" />
            {isStreaming ? (
              <span className="text-violet-400">Generating response...</span>
            ) : (
              <span>Powered by GPT-4o mini</span>
            )}
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
        
        {/* Empty state hint */}
        {messages.length === 0 && !isStreaming && (
          <div className="flex flex-col items-center justify-center h-full text-center space-y-4 px-4">
            <div className="p-5 bg-slate-100 dark:bg-slate-900/50 rounded-2xl">
              {config.icon && React.cloneElement(config.icon as React.ReactElement<any>, { className: "w-10 h-10" })}
            </div>
            <h3 className="text-xl font-bold">{config.label}</h3>
            <p className="text-slate-500 dark:text-slate-400 max-w-md text-sm leading-relaxed">{config.systemHint}</p>
            <div className="glass-card rounded-xl px-5 py-3 border border-slate-200 dark:border-slate-800 text-xs text-slate-400 italic max-w-sm">
              💡 {config.placeholder}
            </div>
          </div>
        )}

        {/* Messages */}
        {messages.map((message) => (
          <div
            key={message._id}
            className={`flex gap-3 ${message.role === "user" ? "justify-end" : "justify-start"}`}
          >
            {message.role === "assistant" && (
              <div className="w-8 h-8 shrink-0 rounded-xl bg-violet-600/20 flex items-center justify-center mt-1">
                <Bot className="w-4 h-4 text-violet-400" />
              </div>
            )}

            <div className={`group max-w-[78%] ${message.role === "user" ? "order-first" : ""}`}>
              <div
                className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                  message.role === "user"
                    ? "bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-tr-sm"
                    : "glass-card border border-slate-200/80 dark:border-slate-800/80 text-[#0f172a] dark:text-[#f1f5f9] rounded-tl-sm"
                }`}
              >
                {message.role === "assistant" ? (
                  <div className="prose prose-sm dark:prose-invert max-w-none prose-pre:bg-slate-900 prose-pre:border prose-pre:border-slate-700 prose-code:text-violet-400 prose-code:bg-slate-900/50 prose-code:px-1 prose-code:rounded">
                    <ReactMarkdown>{message.content}</ReactMarkdown>
                  </div>
                ) : (
                  <p className="whitespace-pre-wrap">{message.content}</p>
                )}
              </div>

              {message.role === "assistant" && (
                <button
                  onClick={() => copyToClipboard(message.content, message._id)}
                  className="mt-1.5 flex items-center gap-1 text-[11px] text-slate-400 hover:text-slate-300 opacity-0 group-hover:opacity-100 transition-all px-1"
                >
                  {copiedId === message._id ? (
                    <><Check className="w-3 h-3 text-green-400" /> Copied</>
                  ) : (
                    <><Copy className="w-3 h-3" /> Copy</>
                  )}
                </button>
              )}
            </div>

            {message.role === "user" && (
              <div className="w-8 h-8 shrink-0 rounded-xl bg-slate-200 dark:bg-slate-800 flex items-center justify-center mt-1 text-xs font-bold text-slate-600 dark:text-slate-400">
                <User className="w-4 h-4" />
              </div>
            )}
          </div>
        ))}

        {/* Streaming bubble */}
        {isStreaming && streamingText && (
          <div className="flex gap-3 justify-start">
            <div className="w-8 h-8 shrink-0 rounded-xl bg-violet-600/20 flex items-center justify-center mt-1">
              <Bot className="w-4 h-4 text-violet-400 animate-pulse" />
            </div>
            <div className="max-w-[78%] glass-card border border-slate-200/80 dark:border-slate-800/80 rounded-2xl rounded-tl-sm px-4 py-3 text-sm leading-relaxed text-[#0f172a] dark:text-[#f1f5f9]">
              <div className="prose prose-sm dark:prose-invert max-w-none prose-code:text-violet-400 prose-code:bg-slate-900/50 prose-code:px-1 prose-code:rounded">
                <ReactMarkdown>{streamingText}</ReactMarkdown>
              </div>
              <span className="inline-block w-2 h-4 bg-violet-400 animate-pulse ml-1 rounded-sm align-middle"></span>
            </div>
          </div>
        )}

        {/* Thinking indicator (no text yet) */}
        {isStreaming && !streamingText && (
          <div className="flex gap-3 justify-start">
            <div className="w-8 h-8 shrink-0 rounded-xl bg-violet-600/20 flex items-center justify-center mt-1">
              <Bot className="w-4 h-4 text-violet-400 animate-pulse" />
            </div>
            <div className="glass-card border border-slate-200/80 dark:border-slate-800/80 rounded-2xl rounded-tl-sm px-5 py-3.5 text-sm">
              <div className="flex gap-1.5 items-center">
                <div className="w-2 h-2 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></div>
                <div className="w-2 h-2 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></div>
                <div className="w-2 h-2 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-slate-200/50 dark:border-slate-800/50 bg-slate-50/50 dark:bg-slate-900/30">
        <div className="flex gap-3 items-end">
          <div className="flex-1 relative">
            <textarea
              ref={textareaRef}
              rows={1}
              value={input}
              onChange={handleTextareaChange}
              onKeyDown={handleKeyDown}
              placeholder={config.placeholder}
              disabled={isStreaming}
              className="w-full px-4 py-3 pr-12 bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent placeholder:text-slate-400 transition-all leading-relaxed"
              style={{ maxHeight: "160px" }}
            />
          </div>

          {isStreaming ? (
            <button
              onClick={stopStreaming}
              className="p-3 bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 rounded-xl transition-all"
              title="Stop generating"
            >
              <RotateCcw className="w-5 h-5" />
            </button>
          ) : (
            <button
              onClick={handleSend}
              disabled={!input.trim()}
              className="p-3 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white rounded-xl transition-all shadow-md hover:shadow-violet-500/20 disabled:opacity-40 disabled:cursor-not-allowed"
              title="Send message"
            >
              <Send className="w-5 h-5" />
            </button>
          )}
        </div>
        <p className="text-[11px] text-slate-400 mt-2 text-center">
          Press <kbd className="px-1 py-0.5 bg-slate-200 dark:bg-slate-800 rounded text-[10px]">Enter</kbd> to send · <kbd className="px-1 py-0.5 bg-slate-200 dark:bg-slate-800 rounded text-[10px]">Shift+Enter</kbd> for new line
        </p>
      </div>
    </div>
  );
}
