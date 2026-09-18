"use client";

import { use, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input, Label, FieldGroup } from "@/components/ui/Field";

export default function AcceptInvitePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  const router = useRouter();
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const res = await fetch("/api/auth/accept-invite", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, name, password }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error ?? "Something went wrong.");
      return;
    }
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas px-4 py-12">
      <div className="w-full max-w-sm animate-fade-in">
        <div className="flex flex-col items-center">
          <Image src="/logo.png" alt="Troysining Printing Services" width={72} height={72} className="rounded-full shadow-md" />
          <h1 className="mt-4 text-center text-lg font-bold text-primary">Join your team on Troysining</h1>
          <p className="mt-1 text-center text-sm text-muted">Set your name and password to activate your account.</p>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-4 rounded-2xl border border-border bg-surface p-6 shadow-sm">
          {error && <div className="rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger">{error}</div>}
          <FieldGroup>
            <Label htmlFor="name" required>Full name</Label>
            <Input id="name" required value={name} onChange={(e) => setName(e.target.value)} placeholder="Juan Dela Cruz" />
          </FieldGroup>
          <FieldGroup>
            <Label htmlFor="password" required>Password</Label>
            <Input id="password" type="password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} />
          </FieldGroup>
          <Button type="submit" size="lg" className="w-full" disabled={loading}>
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            Activate account
          </Button>
        </form>
      </div>
    </div>
  );
}
