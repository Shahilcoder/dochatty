"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Lock, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Chip } from "@/components/ui/Chip";

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
    <main className="relative min-h-screen grid place-items-center px-6 overflow-hidden">
      <div
        aria-hidden
        className="scanlines absolute inset-0 opacity-40 pointer-events-none"
      />
      <div
        aria-hidden
        className="absolute -top-24 -right-24 w-[420px] h-[420px] rounded-full pointer-events-none"
        style={{
          background:
            "radial-gradient(closest-side, color-mix(in oklab, var(--neon-blue) 30%, transparent), transparent)",
        }}
      />

      <div className="relative z-10 w-full max-w-md">
        <div className="flex items-center justify-center mb-8">
          <div className="size-12 grid place-items-center bg-neon-blue text-pure-white rounded-sm font-[var(--font-pixel-display)] text-[14px] shadow-glow-primary-soft">
            DC
          </div>
        </div>

        <div className="bg-surface-container-low/80 backdrop-blur-md border border-outline-variant/60 rounded-lg p-7">
          <div className="flex items-center justify-between mb-6">
            <div>
              <div className="text-display-pixel text-pure-white text-[14px]">
                DOCHATTY
              </div>
              <div className="text-[11px] tracking-[0.2em] text-on-surface-variant uppercase mt-2 font-[var(--font-pixel)]">
                Authentication required
              </div>
            </div>
            <Chip tone="neon">
              <Lock className="size-3" />
              Gated
            </Chip>
          </div>

          <form onSubmit={onSubmit} className="space-y-5">
            <div>
              <label
                htmlFor="password"
                className="block text-[11px] tracking-[0.2em] uppercase text-on-surface-variant font-[var(--font-pixel)] mb-2"
              >
                Password
              </label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoFocus
                required
                invalid={!!error}
              />
            </div>

            {error ? (
              <div className="flex items-center gap-2 text-error text-[13.5px] border-l-2 border-error pl-3 py-1">
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
              glow
            >
              {isPending ? "Verifying" : "Enter"}
            </Button>
          </form>
        </div>

        <p className="text-center text-[11px] tracking-[0.18em] uppercase text-on-surface-variant font-[var(--font-pixel)] mt-6">
          single-user gate · sessions valid 30 days
        </p>
      </div>
    </main>
  );
}
