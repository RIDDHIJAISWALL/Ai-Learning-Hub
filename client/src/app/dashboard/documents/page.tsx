"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { 
  Upload, FileText, Trash2, Loader2, CheckCircle2, AlertCircle,
  File, Plus, MessageSquare, ArrowRight
} from "lucide-react";
import api from "@/lib/axios";

interface UploadedDocument {
  _id: string;
  fileName: string;
  fileSize: number;
  createdAt: string;
}

export default function DocumentsPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [documents, setDocuments] = useState<UploadedDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<{ type: "success" | "error"; msg: string } | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const fetchDocuments = async () => {
    try {
      const { data } = await api.get("/documents");
      setDocuments(data);
    } catch (err) {
      console.error("Failed to fetch documents", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDocuments(); }, []);

  const handleFileUpload = async (file: File) => {
    if (!file || file.type !== "application/pdf") {
      setUploadStatus({ type: "error", msg: "Only PDF files are supported." });
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setUploadStatus({ type: "error", msg: "File size must be under 10MB." });
      return;
    }

    setUploading(true);
    setUploadStatus(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"}/documents/upload`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: formData
        }
      );

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.message || "Upload failed");
      }

      const data = await response.json();
      setUploadStatus({ type: "success", msg: `"${file.name}" uploaded and indexed successfully!` });
      fetchDocuments();
      if (data.note && data.note._id) {
        startNotesChat(data.note._id);
      }
    } catch (err: any) {
      setUploadStatus({ type: "error", msg: err.message || "Failed to upload file." });
    } finally {
      setUploading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileUpload(file);
    e.target.value = "";
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFileUpload(file);
  };

  const startNotesChat = async (noteId?: string) => {
    try {
      const { data } = await api.post("/chats", {
        assistantType: "NotesExplainer",
        title: "Notes Explainer Session",
        ...(noteId && { noteId })
      });
      router.push(`/dashboard/chat/${data._id}`);
    } catch (err) {
      console.error("Failed to start notes chat", err);
    }
  };

  const handleDeleteDocument = async (id: string) => {
    if (!confirm("Are you sure you want to delete this document? All associated chats will also be deleted.")) return;
    try {
      await api.delete(`/documents/${id}`);
      setDocuments(docs => docs.filter(doc => doc._id !== id));
    } catch (err) {
      console.error("Failed to delete document", err);
      alert("Failed to delete document");
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight mb-1">My Documents</h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm">
          Upload your PDF study notes to power the AI Notes Explainer with RAG (Retrieval-Augmented Generation).
        </p>
      </div>

      {/* Upload Zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => !uploading && fileInputRef.current?.click()}
        className={`relative rounded-2xl border-2 border-dashed p-10 text-center cursor-pointer transition-all ${
          dragOver
            ? "border-violet-500 bg-violet-500/10"
            : "border-slate-300 dark:border-slate-700 hover:border-violet-500/60 hover:bg-violet-500/5"
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf"
          className="hidden"
          onChange={handleInputChange}
          disabled={uploading}
        />

        {uploading ? (
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-10 h-10 text-violet-400 animate-spin" />
            <p className="font-semibold text-sm text-slate-400">Processing PDF — extracting and embedding chunks...</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <div className="w-14 h-14 bg-violet-500/10 rounded-2xl flex items-center justify-center">
              <Upload className="w-7 h-7 text-violet-400" />
            </div>
            <div>
              <p className="font-bold text-base">Drop your PDF here or click to browse</p>
              <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Supports PDF files up to 10MB</p>
            </div>
          </div>
        )}
      </div>

      {/* Upload Status */}
      {uploadStatus && (
        <div className={`flex items-center gap-3 p-4 rounded-xl text-sm font-medium ${
          uploadStatus.type === "success"
            ? "bg-emerald-500/10 border border-emerald-500/30 text-emerald-400"
            : "bg-red-500/10 border border-red-500/30 text-red-400"
        }`}>
          {uploadStatus.type === "success"
            ? <CheckCircle2 className="w-5 h-5 shrink-0" />
            : <AlertCircle className="w-5 h-5 shrink-0" />}
          {uploadStatus.msg}
        </div>
      )}

      {/* Start Chat with Notes CTA */}
      {documents.length > 0 && (
        <div className="glass-card border border-blue-500/20 bg-blue-500/5 rounded-2xl p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-500/10 rounded-xl">
              <MessageSquare className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <p className="font-bold text-sm">Ready to chat with your notes?</p>
              <p className="text-xs text-slate-400 mt-0.5">Your uploaded documents are indexed and ready for RAG queries.</p>
            </div>
          </div>
          <button
            onClick={() => startNotesChat()}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl text-sm transition-all shrink-0"
          >
            Start Chat <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Document list */}
      <div>
        <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
          <FileText className="w-5 h-5 text-blue-400" />
          Uploaded Notes
          <span className="text-xs font-semibold px-2 py-0.5 bg-slate-200 dark:bg-slate-800 text-slate-500 rounded-full">
            {documents.length}
          </span>
        </h2>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
          </div>
        ) : documents.length === 0 ? (
          <div className="glass-panel rounded-2xl p-10 text-center border border-slate-200/50 dark:border-slate-800/50">
            <File className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
            <p className="font-semibold text-slate-500 dark:text-slate-400">No documents yet</p>
            <p className="text-sm text-slate-400 mt-1">Upload your first PDF to get started with AI-powered notes queries</p>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white font-semibold rounded-xl text-sm transition-all"
            >
              <Plus className="w-4 h-4" /> Upload PDF
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {documents.map((doc) => (
              <div
                key={doc._id}
                className="glass-card border border-slate-200/80 dark:border-slate-800/80 rounded-xl p-4 flex items-center gap-4"
              >
                <div className="p-3 bg-red-500/10 rounded-xl shrink-0">
                  <FileText className="w-5 h-5 text-red-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate">{doc.fileName}</p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {formatBytes(doc.fileSize)} · Uploaded {new Date(doc.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="hidden sm:inline-flex items-center gap-1 text-[11px] px-2 py-1 bg-emerald-500/10 text-emerald-400 rounded-lg font-semibold border border-emerald-500/20">
                    <CheckCircle2 className="w-3 h-3" /> Indexed
                  </span>
                  <button 
                    onClick={() => startNotesChat(doc._id)}
                    className="p-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-500 rounded-lg transition-colors"
                    title="Chat with this document"
                  >
                    <MessageSquare className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => handleDeleteDocument(doc._id)}
                    className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-lg transition-colors"
                    title="Delete document"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
