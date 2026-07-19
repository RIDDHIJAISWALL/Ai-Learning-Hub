"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  Zap, Plus, Loader2, Calendar, CheckCircle2, Circle, 
  ArrowRight, Target, TrendingUp, X, AlertCircle
} from "lucide-react";
import api from "@/lib/axios";

interface Task {
  _id: string;
  taskText: string;
  isCompleted: boolean;
}

interface WeeklyGoal {
  _id: string;
  week: number;
  focus: string;
  tasks: Task[];
}

interface StudyPlan {
  _id: string;
  examName: string;
  examDate: string;
  weeklyGoals: WeeklyGoal[];
  tips: string[];
  progress: number;
  createdAt: string;
}

export default function StudyPlansPage() {
  const router = useRouter();
  const [plans, setPlans] = useState<StudyPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState<StudyPlan | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [updatingTask, setUpdatingTask] = useState<string | null>(null);
  const [createError, setCreateError] = useState("");
  const [addingTaskWeek, setAddingTaskWeek] = useState<number | null>(null);
  const [newTaskText, setNewTaskText] = useState("");
  const [savingTask, setSavingTask] = useState(false);

  const [form, setForm] = useState({
    examName: "",
    examDate: "",
    currentLevel: "Beginner",
    topics: ""
  });

  const fetchPlans = async () => {
    try {
      const { data } = await api.get("/exam-coach/plans");
      setPlans(data);
      if (data.length > 0 && !selectedPlan) setSelectedPlan(data[0]);
    } catch (err) {
      console.error("Failed to fetch study plans", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPlans(); }, []);

  const handleCreatePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError("");
    if (!form.examName || !form.examDate) {
      setCreateError("Please fill in exam name and date.");
      return;
    }
    setCreating(true);
    try {
      const { data } = await api.post("/exam-coach/plan", form);
      setPlans(prev => [data, ...prev]);
      setSelectedPlan(data);
      setShowCreateModal(false);
      setForm({ examName: "", examDate: "", currentLevel: "Beginner", topics: "" });
    } catch (err: any) {
      setCreateError(err.response?.data?.message || "Failed to create plan.");
    } finally {
      setCreating(false);
    }
  };

  const toggleTask = async (weekIdx: number, taskIdx: number) => {
    if (!selectedPlan) return;
    const taskId = `${weekIdx}-${taskIdx}`;
    setUpdatingTask(taskId);

    try {
      const updatedGoals = selectedPlan.weeklyGoals.map((week, wi) => ({
        ...week,
        tasks: week.tasks.map((task, ti) =>
          wi === weekIdx && ti === taskIdx
            ? { ...task, isCompleted: !task.isCompleted }
            : task
        )
      }));

      const { data } = await api.patch(`/exam-coach/plans/${selectedPlan._id}`, {
        weeklyGoals: updatedGoals
      });

      setSelectedPlan(data);
      setPlans(prev => prev.map(p => p._id === data._id ? data : p));
    } catch (err) {
      console.error("Failed to update task", err);
    } finally {
      setUpdatingTask(null);
    }
  };

  const handleAddCustomTask = async (weekIdx: number) => {
    if (!selectedPlan || !newTaskText.trim()) return;
    setSavingTask(true);
    try {
      const updatedGoals = selectedPlan.weeklyGoals.map((week, wi) =>
        wi === weekIdx
          ? { ...week, tasks: [...week.tasks, { taskText: newTaskText.trim(), isCompleted: false }] }
          : week
      );
      const { data } = await api.patch(`/exam-coach/plans/${selectedPlan._id}`, {
        weeklyGoals: updatedGoals
      });
      setSelectedPlan(data);
      setPlans(prev => prev.map(p => p._id === data._id ? data : p));
      setNewTaskText("");
      setAddingTaskWeek(null);
    } catch (err) {
      console.error("Failed to add task", err);
    } finally {
      setSavingTask(false);
    }
  };

  const daysUntilExam = (examDate: string) => {
    const diff = new Date(examDate).getTime() - Date.now();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-amber-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight mb-1">Study Plans</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm">AI-generated personalized exam preparation roadmaps.</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-amber-600 hover:bg-amber-500 text-slate-900 font-bold rounded-xl text-sm transition-all shadow-md"
        >
          <Plus className="w-4 h-4" /> New Study Plan
        </button>
      </div>

      {plans.length === 0 ? (
        <div className="glass-panel rounded-2xl p-12 text-center border border-slate-200/50 dark:border-slate-800/50">
          <div className="w-14 h-14 bg-amber-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Zap className="w-7 h-7 text-amber-400" />
          </div>
          <h3 className="text-xl font-bold mb-2">No Study Plans Yet</h3>
          <p className="text-slate-500 dark:text-slate-400 text-sm max-w-sm mx-auto mb-6">
            Create your first AI-powered study plan. Enter your exam details and get a personalized weekly schedule.
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-amber-600 hover:bg-amber-500 text-slate-900 font-bold rounded-xl text-sm transition-all"
          >
            <Plus className="w-4 h-4" /> Create My First Plan
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Plan Selector */}
          <div className="space-y-3">
            <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Your Plans</h2>
            {plans.map(plan => (
              <button
                key={plan._id}
                onClick={() => setSelectedPlan(plan)}
                className={`w-full text-left glass-card border rounded-xl p-4 transition-all ${
                  selectedPlan?._id === plan._id
                    ? "border-amber-500/40 bg-amber-500/10"
                    : "border-slate-200/80 dark:border-slate-800/80"
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <span className="font-bold text-sm truncate pr-2">{plan.examName}</span>
                  <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                    plan.progress >= 80 ? "bg-emerald-500/20 text-emerald-400" :
                    plan.progress >= 40 ? "bg-amber-500/20 text-amber-400" :
                    "bg-slate-500/20 text-slate-400"
                  }`}>{plan.progress}%</span>
                </div>
                <p className="text-xs text-slate-400 mb-3">
                  📅 {new Date(plan.examDate).toLocaleDateString()} · {daysUntilExam(plan.examDate)} days left
                </p>
                <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-amber-500 to-yellow-400 rounded-full transition-all duration-500"
                    style={{ width: `${plan.progress}%` }}
                  />
                </div>
              </button>
            ))}
          </div>

          {/* Plan Detail */}
          {selectedPlan && (
            <div className="lg:col-span-2 space-y-5">
              {/* Stats row */}
              <div className="grid grid-cols-3 gap-4">
                <div className="glass-card border border-slate-200/80 dark:border-slate-800/80 rounded-xl p-4 text-center">
                  <p className="text-2xl font-extrabold text-amber-400">{selectedPlan.progress}%</p>
                  <p className="text-xs text-slate-400 mt-0.5">Progress</p>
                </div>
                <div className="glass-card border border-slate-200/80 dark:border-slate-800/80 rounded-xl p-4 text-center">
                  <p className="text-2xl font-extrabold text-blue-400">{daysUntilExam(selectedPlan.examDate)}</p>
                  <p className="text-xs text-slate-400 mt-0.5">Days Left</p>
                </div>
                <div className="glass-card border border-slate-200/80 dark:border-slate-800/80 rounded-xl p-4 text-center">
                  <p className="text-2xl font-extrabold text-violet-400">
                    {selectedPlan.weeklyGoals.reduce((sum, w) => sum + w.tasks.filter(t => t.isCompleted).length, 0)}
                    /
                    {selectedPlan.weeklyGoals.reduce((sum, w) => sum + w.tasks.length, 0)}
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">Tasks Done</p>
                </div>
              </div>

              {/* Weekly Goals */}
              <div className="space-y-4">
                {selectedPlan.weeklyGoals.map((week, wi) => {
                  const completedCount = week.tasks.filter(t => t.isCompleted).length;
                  return (
                    <div key={week._id || wi} className="glass-panel border border-slate-200/50 dark:border-slate-800/50 rounded-xl p-5">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider">Week {week.week}</span>
                          <h3 className="font-bold text-base">{week.focus}</h3>
                        </div>
                        <span className="text-xs font-semibold text-slate-400">
                          {completedCount}/{week.tasks.length} done
                        </span>
                      </div>
                      <div className="space-y-2">
                        {week.tasks.map((task, ti) => (
                          <button
                            key={task._id || ti}
                            onClick={() => toggleTask(wi, ti)}
                            disabled={updatingTask === `${wi}-${ti}`}
                            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-left transition-all ${
                              task.isCompleted
                                ? "bg-emerald-500/10 text-emerald-400"
                                : "hover:bg-slate-100 dark:hover:bg-slate-800/50 text-[#0f172a] dark:text-[#f1f5f9]"
                            }`}
                          >
                            {updatingTask === `${wi}-${ti}` ? (
                              <Loader2 className="w-4 h-4 animate-spin text-slate-400 shrink-0" />
                            ) : task.isCompleted ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                            ) : (
                              <Circle className="w-4 h-4 text-slate-400 shrink-0" />
                            )}
                            <span className={task.isCompleted ? "line-through opacity-70" : ""}>
                              {task.taskText}
                            </span>
                          </button>
                        ))}

                        {/* Add custom task */}
                        {addingTaskWeek === wi ? (
                          <div className="flex items-center gap-2 mt-1 pt-2 border-t border-slate-200/40 dark:border-slate-700/40">
                            <input
                              autoFocus
                              type="text"
                              value={newTaskText}
                              onChange={e => setNewTaskText(e.target.value)}
                              onKeyDown={e => {
                                if (e.key === "Enter") handleAddCustomTask(wi);
                                if (e.key === "Escape") { setAddingTaskWeek(null); setNewTaskText(""); }
                              }}
                              placeholder="Type a task and press Enter..."
                              className="flex-1 px-3 py-1.5 bg-slate-900/60 border border-amber-500/40 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                            />
                            <button
                              onClick={() => handleAddCustomTask(wi)}
                              disabled={savingTask || !newTaskText.trim()}
                              className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-900 font-bold rounded-lg text-xs transition-all flex items-center gap-1"
                            >
                              {savingTask ? <Loader2 className="w-3 h-3 animate-spin" /> : "Add"}
                            </button>
                            <button
                              onClick={() => { setAddingTaskWeek(null); setNewTaskText(""); }}
                              className="p-1.5 hover:bg-slate-800/50 rounded-lg text-slate-400"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => { setAddingTaskWeek(wi); setNewTaskText(""); }}
                            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-slate-400 hover:text-amber-400 hover:bg-amber-500/5 border border-dashed border-slate-300/40 dark:border-slate-700/40 hover:border-amber-500/30 transition-all mt-1"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            Add custom task
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Tips */}
              {selectedPlan.tips && selectedPlan.tips.length > 0 && (
                <div className="glass-card border border-violet-500/20 bg-violet-500/5 rounded-xl p-5">
                  <h3 className="font-bold text-sm flex items-center gap-2 mb-3">
                    <Target className="w-4 h-4 text-violet-400" /> Study Tips
                  </h3>
                  <ul className="space-y-2">
                    {selectedPlan.tips.map((tip, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-slate-500 dark:text-slate-400">
                        <span className="text-violet-400 font-bold shrink-0">•</span>
                        {tip}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Chat with Exam Coach CTA */}
              <button
                onClick={() => router.push("/dashboard")}
                className="w-full flex items-center justify-center gap-2 py-3 border border-amber-500/30 text-amber-400 hover:bg-amber-500/10 font-semibold rounded-xl text-sm transition-all"
              >
                <Zap className="w-4 h-4" /> Start New Exam Coach Session <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Create Plan Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-panel rounded-2xl p-6 w-full max-w-md border border-slate-700/50 relative">
            <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-amber-500 to-yellow-500 rounded-t-2xl"></div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Zap className="w-5 h-5 text-amber-400" /> Create Study Plan
              </h2>
              <button onClick={() => setShowCreateModal(false)} className="p-1.5 hover:bg-slate-800/50 rounded-lg text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            {createError && (
              <div className="mb-4 flex items-center gap-2 text-sm text-red-400 bg-red-500/10 border border-red-500/30 rounded-lg p-3">
                <AlertCircle className="w-4 h-4 shrink-0" /> {createError}
              </div>
            )}

            <form onSubmit={handleCreatePlan} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Exam Name *</label>
                <input
                  type="text"
                  placeholder="e.g. JEE Main, UPSC, AWS Certification"
                  className="w-full px-4 py-2.5 bg-slate-900/60 border border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                  value={form.examName}
                  onChange={e => setForm(f => ({ ...f, examName: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Exam Date *</label>
                <input
                  type="date"
                  className="w-full px-4 py-2.5 bg-slate-900/60 border border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                  value={form.examDate}
                  onChange={e => setForm(f => ({ ...f, examDate: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Current Level</label>
                <select
                  className="w-full px-4 py-2.5 bg-slate-900/60 border border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                  value={form.currentLevel}
                  onChange={e => setForm(f => ({ ...f, currentLevel: e.target.value }))}
                >
                  <option>Beginner</option>
                  <option>Intermediate</option>
                  <option>Advanced</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Topics to Cover <span className="text-slate-600">(optional)</span></label>
                <textarea
                  rows={2}
                  placeholder="e.g. Data Structures, Algorithms, System Design..."
                  className="w-full px-4 py-2.5 bg-slate-900/60 border border-slate-700 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-amber-500"
                  value={form.topics}
                  onChange={e => setForm(f => ({ ...f, topics: e.target.value }))}
                />
              </div>
              <button
                type="submit"
                disabled={creating}
                className="w-full py-3 bg-amber-600 hover:bg-amber-500 text-slate-900 font-bold rounded-xl text-sm transition-all flex items-center justify-center gap-2"
              >
                {creating ? <><Loader2 className="w-4 h-4 animate-spin" /> Generating Plan...</> : "Generate Study Plan"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
