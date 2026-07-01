import Link from "next/link";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";

export default function NotFound() {
  return (
    <>
      <Header />
      <main className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
        <h1 className="mb-2 text-6xl font-bold text-neon">404</h1>
        <p className="mb-6 text-lg text-muted">This tool could not be found.</p>
        <Link
          href="/"
          className="rounded-full bg-neon px-6 py-2.5 text-sm font-semibold text-ink transition-all hover:bg-neon-dim"
        >
          Back to search
        </Link>
      </main>
      <Footer />
    </>
  );
}
