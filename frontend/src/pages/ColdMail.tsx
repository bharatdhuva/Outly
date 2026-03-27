import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useMutation } from "@tanstack/react-query";
import { api, type Company } from "@/lib/api";
import { toast } from "sonner";

export default function ColdMailPage() {
  const [isAdding, setIsAdding] = useState(false);
  const [newCompany, setNewCompany] = useState<Partial<Company>>({
    company_name: "",
    website_url: "",
    hr_email: "",
  });
  const createMutation = useMutation({
    mutationFn: (data: Partial<Company>) => api.coldmail.create(data as any),
    onSuccess: () => {
      toast.success("Lead created");
      setNewCompany({ company_name: "", website_url: "", hr_email: "" });
    },
    onError: (e) => toast.error(String(e)),
  });

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Cold Mail Manager</h1>
      <Dialog open={isAdding} onOpenChange={setIsAdding}>
        <DialogTrigger asChild>
          <Button onClick={() => setIsAdding(true)}>Add New Lead</Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Lead</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              createMutation.mutate(newCompany);
              setIsAdding(false);
            }}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label>Company Name</Label>
              <Input
                required
                placeholder="Acme Corp"
                value={newCompany.company_name}
                onChange={(e) =>
                  setNewCompany({ ...newCompany, company_name: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Website</Label>
              <Input
                required
                placeholder="https://acme.com"
                value={newCompany.website_url}
                onChange={(e) =>
                  setNewCompany({ ...newCompany, website_url: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Target Email</Label>
              <Input
                required
                type="email"
                placeholder="hr@acme.com"
                value={newCompany.hr_email}
                onChange={(e) =>
                  setNewCompany({ ...newCompany, hr_email: e.target.value })
                }
              />
            </div>
            <DialogFooter>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? "Adding..." : "Add Lead"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
              {deleteTarget
                ? `This will permanently remove ${deleteTarget.company_name} from your cold mail pipeline.`
                : "This will permanently remove this lead from your cold mail pipeline."}
            </AlertDialogDescription>
          return (
            <div className="p-8">
              <h1 className="text-2xl font-bold mb-4">Cold Mail Manager</h1>
              <Dialog open={isAdding} onOpenChange={setIsAdding}>
                <DialogTrigger asChild>
                  <Button onClick={() => setIsAdding(true)}>Add New Lead</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add New Lead</DialogTitle>
                  </DialogHeader>
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleCreateClick();
                      setIsAdding(false);
                    }}
                    className="space-y-4"
                  >
                    <div className="space-y-2">
                      <Label>Company Name</Label>
                      <Input
                        required
                        placeholder="Acme Corp"
                        value={newCompany.company_name}
                        onChange={(e) =>
                          setNewCompany({ ...newCompany, company_name: e.target.value })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Website</Label>
                      <Input
                        required
                        placeholder="https://acme.com"
                        value={newCompany.website_url}
                        onChange={(e) =>
                          setNewCompany({ ...newCompany, website_url: e.target.value })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Target Email</Label>
                      <Input
                        required
                        type="email"
                        placeholder="hr@acme.com"
                        value={newCompany.hr_email}
                        onChange={(e) =>
                          setNewCompany({ ...newCompany, hr_email: e.target.value })
                        }
                      />
                    </div>
                    <DialogFooter>
                      <Button type="submit" disabled={createMutation.isPending}>
                        {createMutation.isPending ? "Adding..." : "Add Lead"}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          );
        }
                  onClick={() => sendApprovedMutation.mutate()}
                  disabled={
                    counts.approved === 0 || sendApprovedMutation.isPending
                  }
                >
                  <Send className="h-3 w-3" /> Send Approved
                </Button>
              </div>
            </div>
          </div>
          <div className="divide-y divide-border max-h-[500px] overflow-auto custom-scrollbar">
            {companies.length === 0 ? (
              <div className="p-12 text-center text-muted-foreground">
                <Building2 className="mx-auto mb-3 h-10 w-10 opacity-20" />
                <p>No leads found</p>
                <p className="mt-1 text-xs opacity-60">
                  Upload a CSV or add a company manually to start
                </p>
              </div>
            ) : (
              companies.map((company: Company) => {
                const stepIdx = getCurrentStepIndex(company.status);
                return (
                  <button
                    key={company.id}
                    onClick={() => {
                      setSelected(company.id);
                    }}
                    className={`flex w-full flex-wrap items-center gap-3 px-4 py-3 text-left transition-all hover:bg-accent/50 sm:flex-nowrap sm:gap-4 ${
                      selected === company.id
                        ? "bg-accent border-l-2 border-l-primary"
                        : ""
                    }`}
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted font-mono text-xs font-bold text-muted-foreground shrink-0 overflow-hidden border border-border">
                      {company.company_name.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-foreground truncate">
                          {company.company_name}
                        </p>
                        {company.website_url && (
                           <ExternalLink className="h-3 w-3 text-muted-foreground/40" />
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground truncate">
                        {company.hr_email}
                      </p>
                    </div>
                    <div className="order-4 flex items-center gap-0.5 sm:order-none">
                      {pipelineOrder.map((_, si) => (
                        <div
                          key={si}
                          className={`h-1 w-3 rounded-full ${si <= stepIdx ? "bg-primary" : "bg-border"}`}
                        />
                      ))}
                    </div>
                    <div className="order-3 sm:order-none">
                      <StatusBadge status={company.status} />
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="order-5 h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive sm:order-none"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteTarget(company);
                      }}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </button>
                );
              })
            )}
          </div>
        </div>

        <div className="lg:col-span-2 space-y-4">
          {selectedCompany ? (
            <div className="space-y-6 rounded-xl border border-border bg-card p-4 animate-slide-in sm:p-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h3 className="text-lg font-bold text-foreground">
                    {selectedCompany.company_name}
                  </h3>
                  <div className="mt-1 flex flex-wrap items-center gap-2">
                    <StatusBadge status={selectedCompany.status} />
                    <span className="text-[10px] text-muted-foreground uppercase font-medium tracking-tight">
                      Since {new Date(selectedCompany.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                {selectedCompany.website_url && (
                  <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                    <a href={selectedCompany.website_url} target="_blank" rel="noreferrer">
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </Button>
                )}
              </div>

              <div className="grid gap-4 border-y border-border py-4 sm:grid-cols-2">
                <div className="space-y-1">
                   <p className="text-[10px] font-bold uppercase text-muted-foreground/60 flex items-center gap-1">
                    <User className="h-3 w-3" /> Target
                   </p>
                   <p className="text-xs font-medium">
                     {selectedCompany.target_person_name || "Hiring Team"}
                   </p>
                   <p className="text-[10px] text-muted-foreground truncate">
                     {selectedCompany.target_person_role || "Recruiter"}
                   </p>
                </div>
                <div className="space-y-1">
                   <p className="text-[10px] font-bold uppercase text-muted-foreground/60 flex items-center gap-1">
                    <Mail className="h-3 w-3" /> Email
                   </p>
                   <p className="text-xs font-medium truncate">
                     {selectedCompany.hr_email}
                   </p>
                   <p className="text-[10px] text-muted-foreground">
                     Direct Outreach
                   </p>
                </div>
              </div>

              <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-2 opacity-10">
                  <Sparkles className="h-12 w-12 text-primary" />
                </div>
                <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-primary/70">
                  🎯 Personalization Hook
                </p>
                <p className="text-sm text-primary leading-relaxed font-medium">
                  {selectedCompany.personalization_hook || "Waiting for generation..."}
                </p>
              </div>

              {selectedCompany.error_message && (
                <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4">
                  <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-destructive/80">
                    Generation Error
                  </p>
                  <p className="text-xs leading-relaxed text-destructive/90 break-words">
                    {selectedCompany.error_message}
                  </p>
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-bold uppercase text-muted-foreground/60 mb-2 block">
                    AI Draft Content
                  </label>
                  <div className="rounded-xl border border-border bg-muted/30 p-4">
                    <p className="text-xs font-bold text-foreground mb-3 border-b border-border pb-2">
                       {selectedCompany.generated_subject || "Subject will appear here"}
                    </p>
                    <div className="font-mono text-[11px] leading-relaxed text-secondary-foreground whitespace-pre-wrap">
                      {selectedCompany.generated_mail || "No draft generated yet."}
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 pt-2">
                    {["pending", "scraped", "mail_generated", "approved"].includes(selectedCompany.status) && (
                      <div className="flex w-full flex-col gap-2 sm:flex-1 sm:flex-row">
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1 gap-2 h-10 shadow-lg shadow-primary/10"
                          disabled={loadingId === selectedCompany.id}
                          onClick={() => {
                            setLoadingId(selectedCompany.id);
                            api.coldmail.scrape(selectedCompany.id).then(() => {
                              api.coldmail.generate(selectedCompany.id, "gemini").then(() => {
                                queryClient.invalidateQueries({ queryKey: ["coldmail"] });
                                toast.success("Mail generated with Gemini");
                                setLoadingId(null);
                              }).catch((e) => {
                                toast.error(String(e));
                                queryClient.invalidateQueries({ queryKey: ["coldmail"] });
                                setLoadingId(null);
                              });
                            }).catch((e) => {
                              toast.error(String(e));
                              setLoadingId(null);
                            });
                          }}
                        >
                          {loadingId === selectedCompany.id ? (
                            <RefreshCw className="h-4 w-4 animate-spin" />
                          ) : (
                            <Sparkles className="h-4 w-4" />
                          )}
                          Gemini
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1 gap-2 h-10 shadow-lg shadow-info/10"
                          disabled={loadingId === selectedCompany.id}
                          onClick={() => {
                            setLoadingId(selectedCompany.id);
                            api.coldmail.scrape(selectedCompany.id).then(() => {
                              api.coldmail.generate(selectedCompany.id, "grok").then(() => {
                                queryClient.invalidateQueries({ queryKey: ["coldmail"] });
                                toast.success("Mail generated with Grok");
                                setLoadingId(null);
                              }).catch((e) => {
                                toast.error(String(e));
                                queryClient.invalidateQueries({ queryKey: ["coldmail"] });
                                setLoadingId(null);
                              });
                            }).catch((e) => {
                              toast.error(String(e));
                              setLoadingId(null);
                            });
                          }}
                        >
                          {loadingId === selectedCompany.id ? (
                            <RefreshCw className="h-4 w-4 animate-spin" />
                          ) : (
                            <Sparkles className="h-4 w-4" />
                          )}
                          Groq
                        </Button>
                      </div>
                    )}
                  {["mail_generated", "approved"].includes(selectedCompany.status) && (
                     <Button
                      size="sm"
                      variant={selectedCompany.status === "approved" ? "default" : "outline"}
                      className={`flex-1 gap-2 h-10 ${selectedCompany.status === "approved" ? "bg-primary shadow-lg shadow-primary/20" : ""}`}
                      onClick={() => {
                        if (selectedCompany.status === "approved") {
                          sendApprovedMutation.mutate();
                        } else {
                          api.coldmail.approve(selectedCompany.id).then(() =>
                            queryClient.invalidateQueries({ queryKey: ["coldmail"] })
                          );
                        }
                      }}
                    >
                      {selectedCompany.status === "approved" ? <Send className="h-4 w-4" /> : <Check className="h-4 w-4" />}
                      {selectedCompany.status === "approved" ? "Send Now" : "Approve"}
                    </Button>
                  )}
                  <Dialog open={isEditing} onOpenChange={setIsEditing}>
                    <DialogTrigger asChild>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-10 px-3"
                        onClick={() => {
                          setEditData({
                            company_name: selectedCompany.company_name,
                            generated_subject: selectedCompany.generated_subject || "",
                            generated_mail: selectedCompany.generated_mail || "",
                            personalization_hook: selectedCompany.personalization_hook || "",
                          });
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[700px]">
                      <DialogHeader>
                        <DialogTitle>Edit Mail & Details</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4 py-2">
                        <div className="space-y-2">
                          <Label>Company Name</Label>
                          <Input
                            value={editData.company_name || ""}
                            onChange={(e) => setEditData({ ...editData, company_name: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Generated Subject</Label>
                          <Input
                            value={editData.generated_subject || ""}
                            onChange={(e) => setEditData({ ...editData, generated_subject: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Generated Email Body</Label>
                          <Textarea
                            className="min-h-[300px] font-mono text-[13px]"
                            value={editData.generated_mail || ""}
                            onChange={(e) => setEditData({ ...editData, generated_mail: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Personalization Hook (Preview)</Label>
                          <Input
                            value={editData.personalization_hook || ""}
                            onChange={(e) => setEditData({ ...editData, personalization_hook: e.target.value })}
                          />
                        </div>
                      </div>
                      <DialogFooter className="flex-col gap-2 sm:flex-row">
                        <Button
                          onClick={() => {
                            updateMutation.mutate({ id: selectedCompany.id, data: editData });
                            setIsEditing(false);
                          }}
                          disabled={updateMutation.isPending}
                        >
                          {updateMutation.isPending ? "Saving..." : "Save Changes"}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-10 px-3 hover:bg-destructive hover:text-destructive-foreground"
                    onClick={() => {
                      setDeleteTarget(selectedCompany);
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-10 px-3"
                    onClick={() => {
                      api.coldmail.skip(selectedCompany.id).then(() =>
                        queryClient.invalidateQueries({ queryKey: ["coldmail"] })
                      );
                    }}
                  >
                    <SkipForward className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Advanced info section */}
              <div className="pt-4 border-t border-border mt-4">
                 <button className="flex items-center justify-between w-full group">
                   <p className="text-[10px] font-bold uppercase text-muted-foreground/40 group-hover:text-muted-foreground transition-colors">
                     Sender Profile Details
                   </p>
                   <ChevronRight className="h-3 w-3 text-muted-foreground/30" />
                 </button>
                 <div className="mt-3 grid gap-4 sm:grid-cols-2">
                   <div className="space-y-1">
                      <p className="text-[9px] text-muted-foreground flex items-center gap-1">
                        <MapPin className="h-2.5 w-2.5" /> From
                      </p>
                      <p className="text-[10px] font-medium">{selectedCompany.sender_location}</p>
                   </div>
                   <div className="space-y-1">
                      <p className="text-[9px] text-muted-foreground flex items-center gap-1">
                        <User className="h-2.5 w-2.5" /> Identity
                      </p>
                      <p className="text-[10px] font-medium">{selectedCompany.sender_name}</p>
                   </div>

                 </div>
              </div>
            </div>
          ) : (
            <div className="flex h-72 items-center justify-center rounded-xl border border-dashed border-border bg-muted/20 text-sm text-muted-foreground sm:h-96">
              <div className="text-center">
                <div className="relative mx-auto mb-4">
                  <Mail className="h-12 w-12 text-muted-foreground/20" />
                  <div className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full bg-background flex items-center justify-center border border-border">
                    <Eye className="h-3 w-3 text-muted-foreground/40" />
                  </div>
                </div>
                <p className="font-medium">Selection Required</p>
                <p className="mt-1 text-xs text-muted-foreground/50 max-w-[180px]">
                  Pick a lead from the list to preview their AI generation
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
      </div>
    </div>

