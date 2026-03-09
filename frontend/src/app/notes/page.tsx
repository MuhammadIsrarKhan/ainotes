"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api, ApiError } from "@/lib/api";
import type { Note, NotesListResponse } from "@/types";

export default function NotesPage() {
  const [data, setData] = useState<NotesListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const limit = 10;

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    api.notes
      .list({ search: search || undefined, page, limit })
      .then((res) => {
        if (!cancelled) setData(res);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof ApiError ? err.message : "Failed to load notes");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [page, search]);

  const handleSearchSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const input = e.currentTarget.elements.namedItem("query") as HTMLInputElement | null;
    setSearch(input?.value ?? "");
    setPage(1);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-semibold">Notes</h1>
        <Link
          href="/notes/new"
          className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 transition"
        >
          New note
        </Link>
      </div>

      <form onSubmit={handleSearchSubmit} className="flex gap-2">
        <input
          name="query"
          type="search"
          placeholder="Search notes..."
          defaultValue={search}
          className="flex-1 rounded-lg bg-zinc-800/50 border border-zinc-700 px-3 py-2 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          type="submit"
          className="rounded-lg bg-zinc-700 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-600 transition"
        >
          Search
        </button>
      </form>

      {error && (
        <div className="rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3">
          {error}
        </div>
      )}

      {loading ? (
        <div className="py-12 text-center text-zinc-500">Loading notes...</div>
      ) : data && data.notes.length === 0 ? (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-12 text-center text-zinc-500">
          {search ? "No notes match your search." : "No notes yet. Create your first note."}
          {!search && (
            <Link href="/notes/new" className="mt-4 inline-block text-blue-400 hover:underline">
              New note
            </Link>
          )}
        </div>
      ) : data ? (
        <>
          <ul className="space-y-3">
            {data.notes.map((note) => (
              <NoteCard key={note.id} note={note} />
            ))}
          </ul>
          {data.pagination.totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-4">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="rounded-lg bg-zinc-800 px-3 py-1.5 text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-zinc-700"
              >
                Previous
              </button>
              <span className="text-sm text-zinc-500">
                Page {page} of {data.pagination.totalPages}
              </span>
              <button
                type="button"
                onClick={() => setPage((p) => p + 1)}
                disabled={page >= data.pagination.totalPages}
                className="rounded-lg bg-zinc-800 px-3 py-1.5 text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-zinc-700"
              >
                Next
              </button>
            </div>
          )}
        </>
      ) : null}
    </div>
  );
}

function NoteCard({ note }: { note: Note }) {
  return (
    <li>
      <Link
        href={`/notes/${note.id}`}
        className="block rounded-xl border border-zinc-800 bg-zinc-900/30 p-4 hover:bg-zinc-800/50 transition"
      >
        <h2 className="font-medium text-white truncate">{note.title}</h2>
        <p className="mt-1 text-sm text-zinc-400 line-clamp-2">{note.content}</p>
        {note.tags.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {note.tags.slice(0, 5).map((tag) => (
              <span
                key={tag}
                className="rounded-md bg-zinc-700/50 px-2 py-0.5 text-xs text-zinc-300"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </Link>
    </li>
  );
}
