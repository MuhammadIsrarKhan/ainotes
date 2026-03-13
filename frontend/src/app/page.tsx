import { redirect } from "next/navigation";
import Link from "next/link";
import { AuthGuard } from "@/components/auth-guard";

export default function HomePage() {
  return (
    <AuthGuard fallback={<Landing />}>
      <RedirectToNotes />
    </AuthGuard>
  );
}

function Landing() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-8 px-4">
      <h1 className="text-4xl font-bold tracking-tight">AI Notes</h1>
      <p className="text-zinc-400 text-center max-w-md">
        Notes with AI-powered summarization and tag generation. Sign in or create an account.
      </p>
      <div className="flex gap-4">
        <Link
          href="/login"
          className="px-5 py-2.5 rounded-lg bg-zinc-800 text-white hover:bg-zinc-700 transition"
        >
          Log in
        </Link>
        <Link
          href="/register"
          className="px-5 py-2.5 rounded-lg bg-blue-600 text-white hover:bg-blue-500 transition"
        >
          Sign up
        </Link>
      </div>
    </div>
  );
}

function RedirectToNotes() {
  redirect("/notes");
  return null;
}
