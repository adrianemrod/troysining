"use client";

import { use, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input, Label, FieldGroup } from "@/components/ui/Field";

export default function ResetPasswordPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    setLoading(true);
    const res = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, password }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error ?? "Something went wrong.");
      return;
    }
    setSuccess(true);
    setTimeout(() => router.push("/login"), 1800);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas px-4 py-12">
      <div className="w-full max-w-sm animate-fade-in">
        <div className="flex flex-col items-center">
          <Image src="/logo.png" alt="Troysining Printing Services" width={72} height={72} className="rounded-full shadow-md" />
          <h1 className="mt-4 text-center text-lg font-bold text-primary">Choose a new password</h1>
        </div>

        {success ? (
          <div className="mt-8 flex flex-col items-center gap-2 rounded-2xl border border-border bg-surface p-6 text-center shadow-sm">
            <CheckCircle2 className="h-8 w-8 text-success" />
            <p className="text-sm font-medium">Password updated. Redirecting to sign in&hellip;</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-8 space-y-4 rounded-2xl border border-border bg-surface p-6 shadow-sm">
            {error && <div className="rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger">{error}</div>}
            <FieldGroup>
              <Label htmlFor="password" required>New password</Label>
              <Input id="password" type="password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} />
            </FieldGroup>
            <FieldGroup>
              <Label htmlFor="confirm" required>Confirm password</Label>
              <Input id="confirm" type="password" required minLength={8} value={confirm} onChange={(e) => setConfirm(e.target.value)} />
            </FieldGroup>
            <Button type="submit" size="lg" className="w-full" disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              Update password
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
