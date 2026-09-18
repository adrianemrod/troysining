"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Loader2, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input, Label, FieldGroup } from "@/components/ui/Field";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") || "/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong. Please try again.");
        setLoading(false);
        return;
      }
      router.push(next);
      router.refresh();
    } catch {
      setError("Could not reach the server. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas px-4 py-12">
      <div className="w-full max-w-sm animate-fade-in">
        <div className="flex flex-col items-center">
          <Image src="/logo.png" alt="Troysining Printing Services" width={96} height={96} priority className="rounded-full shadow-md" />
          <h1 className="mt-5 text-center text-xl font-bold text-primary">Troysining Printing Management System</h1>
          <p className="mt-1 text-center text-sm text-muted">Sign in to your internal workspace</p>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-4 rounded-2xl border border-border bg-surface p-6 shadow-sm">
          {error && (
            <div className="rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger" role="alert">
              {error}
            </div>
          )}
          <FieldGroup>
            <Label htmlFor="email" required>Email</Label>
            <Input
              id="email"
              type="email"
              autoComplete="username"
              placeholder="you@troysining.ph"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </FieldGroup>
          <FieldGroup>
            <div className="flex items-center justify-between">
              <Label htmlFor="password" required>Password</Label>
              <Link href="/forgot-password" className="text-xs font-medium text-accent hover:text-accent-hover">
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-foreground"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </FieldGroup>

          <Button type="submit" size="lg" className="w-full" disabled={loading}>
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            Sign in
          </Button>
        </form>

        <p className="mt-6 text-center text-xs text-muted-light">
          Troysining Printing Services &middot; Internal use only
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
