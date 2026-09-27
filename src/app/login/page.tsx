"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, MessagesSquare } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export default function LoginPage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    startTransition(async () => {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as {
          error?: string;
        };
        setError(body.error ?? "Sign-in failed");
        return;
      }
      router.replace("/");
      router.refresh();
    });
  }

  return (
    <main className="min-h-screen grid place-items-center px-6 bg-background">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center text-center mb-8">
          <span className="size-12 grid place-items-center bg-primary text-on-primary rounded-xl shadow-sm mb-4">
            <MessagesSquare className="size-6" />
          </span>
          <h1 className="text-headline-lg text-on-surface">Dochatty</h1>
          <p className="text-body-md text-on-surface-variant mt-1">
            Sign in to ask your documents.
          </p>
        </div>

        <div className="bg-surface border border-outline rounded-xl shadow-md p-7">
          <form onSubmit={onSubmit} className="space-y-5">
            <div>
              <label
                htmlFor="password"
                className="block text-body-sm font-medium text-on-surface mb-1.5"
              >
                Password
              </label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                autoFocus
                required
                invalid={!!error}
              />
            </div>

            {error ? (
              <div className="flex items-center gap-2 text-on-error-container bg-error-container text-[13.5px] rounded-md px-3 py-2">
                <AlertCircle className="size-4 shrink-0" />
                {error}
              </div>
            ) : null}

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full"
              loading={isPending}
            >
              {isPending ? "Verifying" : "Sign in"}
            </Button>
          </form>
        </div>

        <p className="text-center text-[12px] text-on-surface-variant mt-6">
          Single-user access · sessions valid 30 days
        </p>
      </div>
    </main>
  );
}
