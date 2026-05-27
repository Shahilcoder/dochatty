import Link from "next/link";
import { Button } from "@/components/ui/Button";

export default function NotFound() {
  return (
    <main className="relative min-h-screen grid place-items-center px-6 overflow-hidden">
      <div aria-hidden className="scanlines absolute inset-0 opacity-40 pointer-events-none" />
      <div className="relative z-10 text-center">
        <div className="text-display-pixel text-neon-blue text-[28px] mb-4">404</div>
        <h1 className="text-headline-lg text-pure-white mb-3">Not found</h1>
        <p className="text-on-surface-variant text-[15px] max-w-sm mx-auto mb-8">
          This page doesn&apos;t exist, or the document/conversation was deleted.
        </p>
        <Link href="/">
          <Button variant="primary" glow>
            Back to library
          </Button>
        </Link>
      </div>
    </main>
  );
}
