import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { prisma } from "@/lib/prisma";
import { getAppUrl } from "@/lib/env";

// No transactional email provider is configured for this local/demo system,
// so the reset link is returned directly in the response and logged to the
// server console instead of being emailed. Swap this for a real mailer in production.
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";

  const genericResponse = NextResponse.json({
    message: "If an account exists for that email, a reset link has been generated.",
  });

  if (!email) return genericResponse;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return genericResponse;

  const token = randomBytes(32).toString("hex");
  await prisma.passwordResetToken.create({
    data: {
      token,
      userId: user.id,
      expiresAt: new Date(Date.now() + 1000 * 60 * 60),
    },
  });

  const resetLink = `${getAppUrl(req)}/reset-password/${token}`;
  console.log(`[password reset] ${email} -> ${resetLink}`);

  return NextResponse.json({
    message: "Reset link generated (no email provider configured in this demo).",
    resetLink,
  });
}
