import { useEffect, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import toast from "react-hot-toast";
import { Check, Clipboard, Send, SkipForward } from "lucide-react";
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
      const res = await fetch(`${API_BASE}/telegram/approvals/${id}/action`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (res.ok) {
        const approval = approvals.find((a) => a.id === id);
        if (action === "approve") {
          toast.success(approval?.platform === "linkedin" ? "Approved. Copy and paste on LinkedIn manually." : "Approved and queued.");
        } else {
          toast.success("Skipped.");
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
      toast.success("Copied to clipboard.");
      setTimeout(() => setCopiedId(null), 3000);
    } catch (e) {
      toast.error("Failed to copy. Select and copy manually.");
    }
  };

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6">
      <div>
        <p className="text-[13px] font-medium text-primary">Telegram Control</p>
        <h1 className="mt-1 text-[28px] font-semibold tracking-tight text-foreground">Approval queue</h1>
        <p className="mt-2 max-w-2xl text-[14px] leading-6 text-muted-foreground">
          Review pending social drafts and approve, skip, or copy LinkedIn content for manual posting.
        </p>
      </div>

      <section className="rounded-xl border border-border bg-card p-5 shadow-[var(--shadow-card)]">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-[15px] font-semibold text-foreground">Bot commands</h2>
            <p className="mt-1 text-[13px] text-muted-foreground">Use these commands in Telegram to control the workflow.</p>
          </div>
          <Send className="h-5 w-5 text-primary" />
        </div>
        <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
          {["/today", "/pending", "/status", "/generate_linkedin", "/pause", "/report"].map((command) => (
            <div key={command} className="rounded-lg border border-border bg-secondary px-3 py-2 font-mono text-[12px] text-foreground">
              {command}
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-xl border border-border bg-card p-5 shadow-[var(--shadow-card)] sm:p-6">
        <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-[15px] font-semibold text-foreground">Pending approvals</h2>
            <p className="text-[13px] text-muted-foreground">Queue refreshes automatically every few seconds.</p>
          </div>
          <span className="rounded-full border border-border bg-secondary px-3 py-1 text-[12px] font-medium text-muted-foreground">
            {approvals.length} pending
          </span>
        </div>

        {loading ? (
          <p className="text-[13px] text-muted-foreground">Loading approvals...</p>
        ) : approvals.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-secondary py-12 text-center">
            <p className="text-[14px] font-medium text-foreground">All caught up</p>
            <p className="mt-1 text-[13px] text-muted-foreground">No approvals are waiting right now.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {approvals.map((a) => {
              const content = a.edit_improved_text || a.draft_content;
              const isLinkedIn = a.platform === "linkedin";

              return (
                <article key={a.id} className="rounded-xl border border-border bg-white p-5 shadow-sm">
                  <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-[14px] font-semibold capitalize text-foreground">{a.platform} post</h3>
                        {isLinkedIn && (
                          <span className="rounded-full border border-success/20 bg-success/10 px-2 py-0.5 text-[11px] font-medium text-success">
                            Manual post
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-[12px] text-muted-foreground">
                        {content.length} chars · {formatDistanceToNow(new Date(a.created_at), { addSuffix: true })}
                      </p>
                    </div>
                  </div>

                  <div className="mb-4 max-h-60 overflow-y-auto whitespace-pre-wrap rounded-lg border border-border bg-secondary p-4 text-[13px] leading-6 text-foreground">
                    {content}
                  </div>

                  {a.status === "edit_requested" && (
                    <div className="mb-4 rounded-lg border border-primary/15 bg-accent p-3">
                      <p className="mb-1 text-[12px] font-medium text-primary">Last user instruction</p>
                      <p className="text-[13px] text-foreground">{a.edit_requested_text}</p>
                    </div>
                  )}

                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      onClick={() => handleAction(a.id, "approve")}
                      className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-[13px] font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
                    >
                      <Check className="h-4 w-4" />
                      {isLinkedIn ? "Approve" : "Approve and post"}
                    </button>

                    {isLinkedIn && (
                      <button
                        onClick={() => handleCopy(content, a.id)}
                        className="inline-flex items-center gap-2 rounded-md border border-border bg-white px-4 py-2 text-[13px] font-medium text-foreground shadow-sm transition-colors hover:border-primary/40 hover:text-primary"
                      >
                        <Clipboard className="h-4 w-4" />
                        {copiedId === a.id ? "Copied" : "Copy post"}
                      </button>
                    )}

                    <button
                      onClick={() => handleAction(a.id, "skip")}
                      className="inline-flex items-center gap-2 rounded-md border border-border bg-white px-4 py-2 text-[13px] font-medium text-muted-foreground shadow-sm transition-colors hover:border-destructive/30 hover:text-destructive"
                    >
                      <SkipForward className="h-4 w-4" />
                      Skip
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
