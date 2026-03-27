import React, { useState, useEffect } from "react";
import { formatDistanceToNow } from "date-fns";
import toast from "react-hot-toast";
import { API_BASE } from "@/lib/api";

interface PendingApproval {
  id: number;
  platform: string;
  post_id: number;
  draft_content: string;
  telegram_message_id: number | null;
  status: string;
  edit_requested_text: string | null;
  edit_improved_text: string | null;
  created_at: string;
  actioned_at: string | null;
}

export function TelegramControl() {
  const [approvals, setApprovals] = useState<PendingApproval[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<number | null>(null);

  const fetchApprovals = async () => {
    try {
      const res = await fetch(`${API_BASE}/telegram/approvals`);
      if (res.ok) {
        const data = await res.json();
        setApprovals(data);
      }
    } catch (e) {
      console.error(e);
      toast.error("Failed to fetch approvals");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApprovals();
    const int = setInterval(fetchApprovals, 5000);
    return () => clearInterval(int);
  }, []);

  const handleAction = async (id: number, action: "approve" | "skip") => {
    try {
      const res = await fetch(
        `${API_BASE}/telegram/approvals/${id}/action`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action }),
        },
      );
      if (res.ok) {
        const data = await res.json();
        if (action === "approve") {
          const approval = approvals.find(a => a.id === id);
          if (approval?.platform === "linkedin") {
            toast.success("Approved! Copy and paste on LinkedIn manually 🚀");
          } else {
            toast.success("Approved & queued for auto-posting!");
          }
        } else {
          toast.success("Skipped!");
        }
        fetchApprovals();
      } else {
        toast.error("Action failed");
      }
    } catch (e) {
      toast.error("Network error");
    }
  };

  const handleCopy = async (content: string, id: number) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedId(id);
      toast.success("📋 Copied to clipboard! Paste on LinkedIn.");
      setTimeout(() => setCopiedId(null), 3000);
    } catch (e) {
      toast.error("Failed to copy. Select and copy manually.");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="mb-2 text-2xl font-bold tracking-tight text-white sm:text-3xl">
          Telegram Control
        </h1>
        <p className="text-gray-400">
          Review and approve pending posts. LinkedIn posts require manual
          copy-paste for safety.
        </p>
      </div>

      {/* Telegram Commands Reference */}
      <div className="bg-blue-900/20 border border-blue-700/30 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-blue-400 mb-2">📱 Telegram Bot Commands</h3>
        <div className="grid gap-2 text-xs text-gray-300 sm:grid-cols-2 xl:grid-cols-3">
          <span><code className="text-blue-300">/today</code> — Today's summary</span>
          <span><code className="text-blue-300">/pending</code> — Pending approvals</span>
          <span><code className="text-blue-300">/status</code> — System status</span>
          <span><code className="text-blue-300">/generate_linkedin</code> — New draft</span>
          <span><code className="text-blue-300">/pause</code> — Pause/Resume</span>
          <span><code className="text-blue-300">/report</code> — Weekly report</span>
        </div>
      </div>

      <div className="rounded-lg border border-gray-800 bg-[#1C1C22] p-4 sm:p-6">
        <h2 className="mb-4 text-lg font-medium text-white">
          Pending Approvals Queue
        </h2>
        {loading ? (
          <p className="text-gray-400">Loading...</p>
        ) : approvals.length === 0 ? (
          <div className="text-center py-10 bg-[#131317] rounded-lg border border-gray-800 border-dashed">
            <p className="text-gray-400">
              ✅ All caught up! No approvals pending.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {approvals.map((a) => {
              const content = a.edit_improved_text || a.draft_content;
              const isLinkedIn = a.platform === "linkedin";
              
              return (
                <div
                  key={a.id}
                  className="bg-[#131317] border border-gray-800 rounded-lg p-5"
                >
                  <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xl">
                        {isLinkedIn
                          ? "🔵"
                          : a.platform === "twitter"
                            ? "🐦"
                            : "🟠"}
                      </span>
                      <h3 className="text-md font-semibold text-white capitalize">
                        {a.platform} Post
                      </h3>
                      {isLinkedIn && (
                        <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/30">
                          Manual Post
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs text-gray-500 font-mono">
                        {content.length} chars
                      </span>
                      <span className="text-xs text-gray-500 bg-[#1C1C22] px-2 py-1 rounded">
                        {formatDistanceToNow(new Date(a.created_at), {
                          addSuffix: true,
                        })}
                      </span>
                    </div>
                  </div>

                  <div className="mb-4">
                    <div className="p-3 bg-black/30 rounded border border-gray-800/50 text-gray-300 text-sm whitespace-pre-wrap max-h-60 overflow-y-auto w-full">
                      {content}
                    </div>
                  </div>

                  {a.status === "edit_requested" && (
                    <div className="mb-4 p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-md">
                      <p className="text-xs text-indigo-400 mb-1">
                        Last user instruction:
                      </p>
                      <p className="text-sm text-indigo-200">
                        {a.edit_requested_text}
                      </p>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-3 mt-4">
                    <button
                      onClick={() => handleAction(a.id, "approve")}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-sm font-medium transition-colors"
                    >
                      {isLinkedIn ? "✅ Approve" : "✅ Approve & Post"}
                    </button>
                    
                    {isLinkedIn && (
                      <button
                        onClick={() => handleCopy(content, a.id)}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-colors border ${
                          copiedId === a.id
                            ? "bg-emerald-600/20 border-emerald-500/30 text-emerald-400"
                            : "bg-[#1C1C22] border-gray-700 text-gray-300 hover:bg-blue-900/30 hover:border-blue-700/50 hover:text-blue-300"
                        }`}
                      >
                        {copiedId === a.id ? "✅ Copied!" : "📋 Copy Full Post"}
                      </button>
                    )}
                    
                    <button
                      onClick={() => handleAction(a.id, "skip")}
                      className="px-4 py-2 bg-[#1C1C22] hover:bg-red-900/40 text-gray-300 hover:text-red-400 rounded-md text-sm font-medium transition-colors border border-gray-700 hover:border-red-900/50"
                    >
                      ❌ Skip
                    </button>
                    
                    <span className="text-xs text-gray-500 mt-2 ml-2">
                      {isLinkedIn 
                        ? "Copy → Paste on LinkedIn → Mark as posted" 
                        : "Edit mode only available on Telegram"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
