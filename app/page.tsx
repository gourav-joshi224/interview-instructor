import Link from "next/link";
import { InterviewSetup } from "@/components/InterviewSetup";

export default function Home() {
  return (
    <main className="page-shell">
      <div className="mx-auto flex w-full max-w-6xl justify-end px-6 pt-6 sm:px-8 lg:px-12">
        <Link
          href="/dashboard"
          className="inline-flex h-10 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03] px-4 text-sm text-zinc-200 transition hover:border-blue-400/30 hover:bg-blue-500/[0.08]"
        >
          View dashboard
        </Link>
      </div>
      <InterviewSetup />
    </main>
  );
}
