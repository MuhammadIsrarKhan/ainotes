"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { api, ApiError } from "@/lib/api";
import type { Note } from "@/types";

export default function NoteDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [note, setNote] = useState<Note | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [saving, setSaving] = useState(false);
  const [aiLoading, setAiLoading] = useState<"summary" | "tags" | null>(null);

  useEffect(() => {
    api.notes
      .get(id)
      .then(setNote)
      .catch((err) =>
        setError(err instanceof ApiError ? err.message : "Failed to load note"),
      )
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (note) {
      setEditTitle(note.title);
      setEditContent(note.content);
    }
  }, [note]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!note) return;
    setSaving(true);
    setError(null);
    try {
      const updated = await api.notes.update(note.id, {
        title: editTitle,
        content: editContent,
      });
      setNote(updated);
      setEditMode(false);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to update");
    } finally {
      setSaving(false);
    }
  }

  async function handleSummarize() {
    if (!note) return;
    setAiLoading("summary");
    setError(null);
    try {
      const updated = await api.notes.summarize(note.id);
      setNote(updated);
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Failed to generate summary",
      );
    } finally {
      setAiLoading(null);
    }
  }

  async function handleGenerateTags() {
    if (!note) return;
    setAiLoading("tags");
    setError(null);
    try {
      const updated = await api.notes.generateTags(note.id);
      setNote(updated);
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Failed to generate tags",
      );
    } finally {
      setAiLoading(null);
    }
  }

  async function handleDelete() {
    if (!note || !confirm("Delete this note?")) return;
    try {
      await api.notes.delete(note.id);
      router.push("/notes");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to delete");
    }
  }

  if (loading) {
    return (
      <div className="py-12 text-center text-zinc-500">Loading note...</div>
    );
  }

  if (error && !note) {
    return (
      <div className="space-y-4">
        <div className="rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3">
          {error}
        </div>
        <Link href="/notes" className="text-blue-400 hover:underline">
          ← Back to notes
        </Link>
      </div>
    );
  }

  if (!note) return null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <Link href="/notes" className="text-zinc-400 hover:text-white text-sm">
          ← Back to notes
        </Link>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setEditMode(!editMode)}
            className="rounded-lg bg-zinc-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-zinc-600"
          >
            {editMode ? "Cancel" : "Edit"}
          </button>
          <button
            type="button"
            onClick={handleSummarize}
            disabled={!!aiLoading}
            className="rounded-lg bg-blue-600/80 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-500 disabled:opacity-50"
          >
            {aiLoading === "summary" ? "Generating..." : "Summarize"}
          </button>
          <button
            type="button"
            onClick={handleGenerateTags}
            disabled={!!aiLoading}
            className="rounded-lg bg-blue-600/80 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-500 disabled:opacity-50"
          >
            {aiLoading === "tags" ? "Generating..." : "Generate tags"}
          </button>
          <button
            type="button"
            onClick={handleDelete}
            className="rounded-lg bg-red-600/20 text-red-400 px-3 py-1.5 text-sm font-medium hover:bg-red-600/30"
          >
            Delete
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3">
          {error}
        </div>
      )}

      {editMode ? (
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-1">
              Title
            </label>
            <input
              type="text"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              required
              className="w-full rounded-lg bg-zinc-800/50 border border-zinc-700 px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-1">
              Content
            </label>
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              required
              rows={12}
              className="w-full rounded-lg bg-zinc-800/50 border border-zinc-700 px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
            />
          </div>
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save"}
          </button>
        </form>
      ) : (
        <article className="space-y-6">
          <header>
            <h1 className="text-2xl font-semibold text-white">{note.title}</h1>
            <p className="mt-1 text-sm text-zinc-500">
              Updated {new Date(note.updatedAt).toLocaleString()}
            </p>
          </header>
          <div className="prose prose-invert prose-zinc max-w-none">
            <p className="whitespace-pre-wrap text-zinc-300">{note.content}</p>
          </div>
          {note.summary && (
            <section>
              <h2 className="text-lg font-medium text-zinc-300 mb-2">
                Summary
              </h2>
              <p className="whitespace-pre-wrap text-zinc-400 text-sm">
                {note.summary}
              </p>
            </section>
          )}
          {note?.tags?.length > 0 && (
            <section>
              <h2 className="text-lg font-medium text-zinc-300 mb-2">Tags</h2>
              <div className="flex flex-wrap gap-2">
                {note.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-md bg-zinc-700/50 px-2.5 py-1 text-sm text-zinc-300"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </section>
          )}
        </article>
      )}
    </div>
  );
}
