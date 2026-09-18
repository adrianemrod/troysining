"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input, Label, FieldGroup } from "@/components/ui/Field";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [link, setLink] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    setLink(null);
    const res = await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const data = await res.json();
    setMessage(data.message);
    if (data.resetLink) setLink(data.resetLink);
    setLoading(false);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas px-4 py-12">
      <div className="w-full max-w-sm animate-fade-in">
        <div className="flex flex-col items-center">
          <Image src="/logo.png" alt="Troysining Printing Services" width={72} height={72} className="rounded-full shadow-md" />
          <h1 className="mt-4 text-center text-lg font-bold text-primary">Reset your password</h1>
          <p className="mt-1 text-center text-sm text-muted">We&apos;ll help you get back in.</p>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-4 rounded-2xl border border-border bg-surface p-6 shadow-sm">
          {message && (
            <div className="rounded-lg bg-primary-soft px-3 py-2 text-sm text-primary">
              {message}
              {link && (
                <>
                  <br />
                  <Link href={link} className="font-medium underline">
                    Open reset link
                  </Link>
                  <span className="block text-xs text-muted mt-1">
                    (Shown here because no email provider is configured in this demo environment.)
                  </span>
                </>
              )}
            </div>
          )}
          <FieldGroup>
            <Label htmlFor="email" required>Email</Label>
            <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@troysining.ph" />
          </FieldGroup>
          <Button type="submit" size="lg" className="w-full" disabled={loading}>
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            Send reset link
          </Button>
        </form>

        <Link href="/login" className="mt-6 flex items-center justify-center gap-1.5 text-sm font-medium text-muted hover:text-primary">
          <ArrowLeft className="h-4 w-4" /> Back to sign in
        </Link>
      </div>
    </div>
  );
}
