import Link from "next/link";
import { Button } from "@/components/ui/Button";

export default function NotFound() {
  return (
    <main className="min-h-screen grid place-items-center px-6 bg-background">
      <div className="text-center">
        <div className="text-primary text-[28px] font-bold tracking-tight mb-3">
          404
        </div>
        <h1 className="text-headline-lg text-on-surface mb-3">Not found</h1>
        <p className="text-on-surface-variant text-body-md max-w-sm mx-auto mb-8">
          This page doesn&apos;t exist, or the document or conversation was
          deleted.
        </p>
        <Link href="/">
          <Button variant="primary">Back to library</Button>
        </Link>
      </div>
    </main>
  );
}
