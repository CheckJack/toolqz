import { randomBytes } from "crypto";
import { hashPassword } from "@/lib/auth";
import { logAudit } from "@/lib/audit-log";
import { adminPasswordResetEmail } from "@/lib/email-templates";
import { sendEmail } from "@/lib/email";
import { prisma } from "@/lib/db";

const RESET_TTL_MS = 60 * 60 * 1000;

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export async function requestPasswordReset(email: string) {
  const normalized = normalizeEmail(email);
  if (!normalized) {
    return { ok: true as const };
  }

  const user = await prisma.user.findUnique({
    where: { email: normalized },
    select: { id: true, name: true, email: true },
  });

  if (!user) {
    return { ok: true as const };
  }

  await prisma.passwordResetToken.deleteMany({
    where: { userId: user.id, usedAt: null },
  });

  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + RESET_TTL_MS);

  await prisma.passwordResetToken.create({
    data: {
      token,
      userId: user.id,
      expiresAt,
    },
  });

  const { subject, text, html, resetUrl } = adminPasswordResetEmail(user.name, token);
  const result = await sendEmail({
    to: user.email,
    toName: user.name,
    subject,
    text,
    html,
  });

  if (result.dev) {
    console.log("[password-reset:dev]", resetUrl);
  }

  return { ok: true as const };
}

export async function validatePasswordResetToken(token: string) {
  const trimmed = token.trim();
  if (!trimmed) return null;

  const record = await prisma.passwordResetToken.findUnique({
    where: { token: trimmed },
    include: { user: { select: { id: true, email: true, name: true } } },
  });

  if (!record || record.usedAt || record.expiresAt < new Date()) {
    return null;
  }

  return {
    email: record.user.email,
    name: record.user.name,
  };
}

export async function resetPasswordWithToken(token: string, newPassword: string) {
  const trimmed = token.trim();
  if (!trimmed || newPassword.length < 6) {
    return { ok: false as const, error: "Invalid request." };
  }

  const record = await prisma.passwordResetToken.findUnique({
    where: { token: trimmed },
    include: { user: { select: { id: true, name: true, email: true } } },
  });

  if (!record || record.usedAt || record.expiresAt < new Date()) {
    return { ok: false as const, error: "This reset link is invalid or has expired." };
  }

  const passwordHash = await hashPassword(newPassword);

  await prisma.$transaction([
    prisma.user.update({
      where: { id: record.userId },
      data: { passwordHash },
    }),
    prisma.passwordResetToken.update({
      where: { id: record.id },
      data: { usedAt: new Date() },
    }),
    prisma.passwordResetToken.deleteMany({
      where: { userId: record.userId, usedAt: null, id: { not: record.id } },
    }),
  ]);

  await logAudit("update", "user", `${record.user.name}: password reset via email`, {
    userId: record.userId,
    entityId: record.userId,
  });

  return { ok: true as const };
}
