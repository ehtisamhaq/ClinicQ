"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  IconBook,
  IconPlus,
  IconEdit,
  IconTrash,
  IconSearch,
  IconSparkles,
  IconCheck,
  IconLoader,
  IconAlertTriangle,
} from "@tabler/icons-react";
import { toast } from "sonner";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { KnowledgeDocument } from "@/lib/admin/types";
import {
  createKnowledgeDocAction,
  updateKnowledgeDocAction,
  deleteKnowledgeDocAction,
} from "@/lib/admin/actions";

const CATEGORIES = ["ALL", "Services", "Timings", "Fees", "Policies", "FAQs"];

interface KnowledgeManagerProps {
  initialDocs: KnowledgeDocument[];
}

export function KnowledgeManager({ initialDocs }: KnowledgeManagerProps) {
  const router = useRouter();

  const [docs, setDocs] = React.useState<KnowledgeDocument[]>(initialDocs);
  const [selectedCategory, setSelectedCategory] = React.useState<string>("ALL");
  const [searchQuery, setSearchQuery] = React.useState<string>("");

  // Create / Edit modal state
  const [isCreateOpen, setIsCreateOpen] = React.useState(false);
  const [editingDoc, setEditingDoc] = React.useState<KnowledgeDocument | null>(null);
  const [deletingDocId, setDeletingDocId] = React.useState<string | null>(null);

  // Form fields
  const [title, setTitle] = React.useState("");
  const [body, setBody] = React.useState("");
  const [category, setCategory] = React.useState("Services");
  const [isPending, startTransition] = React.useTransition();

  // Instant vector search test
  const [searchTestQuery, setSearchTestQuery] = React.useState("");
  const [searchTestResults, setSearchTestResults] = React.useState<Array<{ title: string; content: string; score?: number }>>([]);
  const [isSearchingVector, setIsSearchingVector] = React.useState(false);

  const filteredDocs = React.useMemo(() => {
    return docs.filter((d) => {
      if (selectedCategory !== "ALL" && d.category.toLowerCase() !== selectedCategory.toLowerCase()) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return d.title.toLowerCase().includes(q) || d.body.toLowerCase().includes(q);
      }
      return true;
    });
  }, [docs, selectedCategory, searchQuery]);

  const openCreateModal = () => {
    setTitle("");
    setBody("");
    setCategory("Services");
    setIsCreateOpen(true);
  };

  const openEditModal = (doc: KnowledgeDocument) => {
    setEditingDoc(doc);
    setTitle(doc.title);
    setBody(doc.body);
    setCategory(doc.category);
  };

  const handleSaveDoc = (e: React.FormEvent) => {
    e.preventDefault();

    startTransition(async () => {
      if (editingDoc) {
        const res = await updateKnowledgeDocAction({
          id: editingDoc.id,
          title,
          body,
          category,
        });

        if (!res.success) {
          toast.error(res.error || "Failed to update document");
          return;
        }

        toast.success("Document updated successfully!");
        setEditingDoc(null);
      } else {
        const res = await createKnowledgeDocAction({
          title,
          body,
          category,
        });

        if (!res.success) {
          toast.error(res.error || "Failed to create document");
          return;
        }

        toast.success("Knowledge document added!");
        setIsCreateOpen(false);
      }

      router.refresh();
    });
  };

  const handleDelete = (id: string) => {
    startTransition(async () => {
      const res = await deleteKnowledgeDocAction(id);
      if (!res.success) {
        toast.error(res.error || "Failed to delete document");
        return;
      }

      toast.success("Document removed from knowledge base.");
      setDeletingDocId(null);
      setDocs((prev) => prev.filter((d) => d.id !== id));
      router.refresh();
    });
  };

  const handleRunVectorTest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchTestQuery.trim()) return;

    setIsSearchingVector(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/api/v1";
      const res = await fetch(`${apiUrl}/knowledge/search`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: searchTestQuery }),
      });

      if (res.ok) {
        const json = await res.json();
        setSearchTestResults(json.data?.results || []);
      }
    } catch {
      toast.error("Vector search test failed");
    } finally {
      setIsSearchingVector(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        {/* Category Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                selectedCategory === cat
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "bg-muted text-muted-foreground hover:text-foreground"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <div className="relative w-full sm:w-64">
            <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search knowledge docs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 text-xs"
            />
          </div>

          <Button onClick={openCreateModal} size="sm" className="gap-1.5 text-xs shrink-0">
            <IconPlus className="h-4 w-4" />
            Add Document
          </Button>
        </div>
      </div>

      {/* RAG Vector Search Preview Bar */}
      <Card className="border-primary/30 bg-primary/5 shadow-xs">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-primary flex items-center gap-1.5 uppercase tracking-wider">
              <IconSparkles className="h-4 w-4" />
              Live RAG Vector Search Tester
            </span>
            <span className="text-[11px] text-muted-foreground">
              Verifies embeddings used by the AI assistant
            </span>
          </div>

          <form onSubmit={handleRunVectorTest} className="flex items-center gap-2">
            <Input
              placeholder="Test a question: e.g. What are Friday visiting hours and fees?"
              value={searchTestQuery}
              onChange={(e) => setSearchTestQuery(e.target.value)}
              className="text-xs bg-background"
            />
            <Button type="submit" size="sm" disabled={isSearchingVector} className="text-xs shrink-0">
              {isSearchingVector ? "Searching..." : "Test Vector Match"}
            </Button>
          </form>

          {searchTestResults.length > 0 && (
            <div className="space-y-1.5 pt-2">
              <span className="text-[11px] font-semibold text-muted-foreground uppercase">
                Vector Matches ({searchTestResults.length}):
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {searchTestResults.map((r, i) => (
                  <div key={i} className="rounded-lg border border-border/80 bg-background p-2.5 text-xs space-y-1">
                    <div className="font-semibold text-foreground">{r.title}</div>
                    <p className="text-[11px] text-muted-foreground line-clamp-2">{r.content}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Documents Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Clinic Content Documents ({filteredDocs.length})
          </span>
        </div>

        {filteredDocs.length === 0 ? (
          <Card className="border-border/80 border-dashed bg-muted/20">
            <CardContent className="p-12 text-center text-xs text-muted-foreground space-y-2">
              <IconBook className="h-8 w-8 mx-auto text-muted-foreground opacity-60" />
              <p>No knowledge base documents found.</p>
              <Button onClick={openCreateModal} variant="outline" size="sm" className="text-xs">
                Create First Document
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredDocs.map((doc) => (
              <Card key={doc.id} className="border-border/80 shadow-xs flex flex-col justify-between">
                <CardHeader className="p-4 pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <Badge variant="outline" className="text-[10px] uppercase font-semibold">
                      {doc.category}
                    </Badge>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        onClick={() => openEditModal(doc)}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <IconEdit className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        onClick={() => setDeletingDocId(doc.id)}
                        className="text-muted-foreground hover:text-destructive"
                      >
                        <IconTrash className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                  <CardTitle className="text-sm font-bold text-foreground line-clamp-1 mt-1">
                    {doc.title}
                  </CardTitle>
                </CardHeader>

                <CardContent className="p-4 pt-0">
                  <p className="text-xs text-muted-foreground line-clamp-4 leading-relaxed bg-muted/30 p-2.5 rounded-lg">
                    {doc.body}
                  </p>
                </CardContent>

                <CardFooter className="p-4 pt-2 text-[10px] text-muted-foreground border-t border-border/50">
                  Updated: {new Date(doc.updatedAt || doc.createdAt).toLocaleDateString()}
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Create / Edit Document Dialog */}
      <Dialog
        open={isCreateOpen || !!editingDoc}
        onOpenChange={(open) => {
          if (!open) {
            setIsCreateOpen(false);
            setEditingDoc(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <IconBook className="h-5 w-5 text-primary" />
              {editingDoc ? "Edit Knowledge Document" : "Add Knowledge Document"}
            </DialogTitle>
            <DialogDescription>
              Content will be embedded with pgvector to provide factual context for the AI assistant.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveDoc} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="docTitle" className="text-xs">Document Title *</Label>
              <Input
                id="docTitle"
                required
                minLength={3}
                placeholder="e.g., Cardiology Consultation Fees & Timings"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="docCategory" className="text-xs">Category *</Label>
              <select
                id="docCategory"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-xs shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="Services" className="bg-background text-foreground">Services</option>
                <option value="Timings" className="bg-background text-foreground">Timings</option>
                <option value="Fees" className="bg-background text-foreground">Fees</option>
                <option value="Policies" className="bg-background text-foreground">Policies</option>
                <option value="FAQs" className="bg-background text-foreground">FAQs</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="docBody" className="text-xs">Document Body (Content) *</Label>
              <textarea
                id="docBody"
                required
                minLength={10}
                rows={6}
                placeholder="Detailed clinic facts, rules, pricing or instructions..."
                value={body}
                onChange={(e) => setBody(e.target.value)}
                className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-xs shadow-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
            </div>

            <DialogFooter className="gap-2 sm:gap-0 pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setIsCreateOpen(false);
                  setEditingDoc(null);
                }}
                disabled={isPending}
              >
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={isPending} className="font-semibold">
                {isPending ? "Saving..." : editingDoc ? "Save Changes" : "Create Document"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deletingDocId} onOpenChange={(open) => !open && setDeletingDocId(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <IconAlertTriangle className="h-5 w-5" />
              Delete Document
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to permanently delete this knowledge document? The AI assistant will no longer reference it.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setDeletingDocId(null)}
              disabled={isPending}
            >
              Keep
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => deletingDocId && handleDelete(deletingDocId)}
              disabled={isPending}
            >
              {isPending ? "Deleting..." : "Delete Permanently"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
