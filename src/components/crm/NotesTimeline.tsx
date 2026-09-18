"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, MessageSquarePlus } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Field";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatManilaDateTime } from "@/lib/utils";

interface Note {
  id: string;
  content: string;
  createdAt: string;
  author: { name: string; avatarColor: string };
}

export function NotesTimeline({ clientId, initialNotes, canAdd }: { clientId: string; initialNotes: Note[]; canAdd: boolean }) {
  const router = useRouter();
  const [notes, setNotes] = useState(initialNotes);
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim()) return;
    setLoading(true);
    const res = await fetch(`/api/clients/${clientId}/notes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content }),
    });
    setLoading(false);
    if (res.ok) {
      const data = await res.json();
      setNotes((prev) => [data.note, ...prev]);
      setContent("");
      router.refresh();
    }
  }

  return (
    <div>
      {canAdd && (
        <form onSubmit={handleSubmit} className="mb-5 space-y-2">
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Log a FB conversation summary, call notes, or update..."
            rows={2}
          />
          <Button type="submit" size="sm" disabled={loading || !content.trim()}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <MessageSquarePlus className="h-4 w-4" />}
            Add note
          </Button>
        </form>
      )}

      {notes.length === 0 ? (
        <EmptyState title="No notes yet" description="Timeline entries from FB conversations and calls will appear here." />
      ) : (
        <ol className="space-y-4">
          {notes.map((note) => (
            <li key={note.id} className="flex gap-3">
              <Avatar name={note.author.name} color={note.author.avatarColor} size="xs" className="mt-0.5" />
              <div className="min-w-0 flex-1 rounded-lg bg-canvas p-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium text-foreground">{note.author.name}</p>
                  <p className="text-xs text-muted-light">{formatManilaDateTime(note.createdAt)}</p>
                </div>
                <p className="mt-1 text-sm text-muted whitespace-pre-wrap">{note.content}</p>
              </div>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
