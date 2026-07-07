import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { welcomeNewsletterEmail } from "@/lib/email-templates";
import { sendEmail } from "@/lib/email";
import { enforceRateLimit } from "@/lib/rate-limit";
import { isValidEmail, normalizeEmail } from "@/lib/subscribers";

const SUBSCRIBE_LIMIT = 10;
const SUBSCRIBE_WINDOW_MS = 60 * 60 * 1000;

async function sendWelcomeEmail(email: string, name: string | null) {
  const { subject, text, html } = welcomeNewsletterEmail(name);
  await sendEmail({ to: email, toName: name ?? undefined, subject, text, html });
}

export async function POST(request: NextRequest) {
  const limited = enforceRateLimit(request, "newsletter-subscribe", SUBSCRIBE_LIMIT, SUBSCRIBE_WINDOW_MS);
  if (limited) return limited;

  try {
    const body = await request.json();

    if (typeof body.company === "string" && body.company.trim()) {
      return NextResponse.json({ ok: true });
    }

    const email =
      typeof body.email === "string" ? normalizeEmail(body.email) : "";
    const name = typeof body.name === "string" ? body.name.trim() || null : null;
    const source =
      typeof body.source === "string" && body.source.trim()
        ? body.source.trim()
        : "popup";

    if (!email) {
      return NextResponse.json({ error: "Email is required." }, { status: 400 });
    }

    if (!isValidEmail(email)) {
      return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
    }

    const existing = await prisma.newsletterSubscriber.findUnique({
      where: { email },
    });

    if (existing) {
      if (existing.status === "ACTIVE") {
        return NextResponse.json({ ok: true }, { status: 200 });
      }

      await prisma.newsletterSubscriber.update({
        where: { email },
        data: {
          status: "ACTIVE",
          name: name ?? existing.name,
          source,
          subscribedAt: new Date(),
          unsubscribedAt: null,
        },
      });

      try {
        await sendWelcomeEmail(email, name ?? existing.name);
      } catch (error) {
        console.error("Newsletter welcome email failed:", error);
      }

      return NextResponse.json({ ok: true }, { status: 200 });
    }

    await prisma.newsletterSubscriber.create({
      data: {
        email,
        name,
        source,
        status: "ACTIVE",
      },
    });

    try {
      await sendWelcomeEmail(email, name);
    } catch (error) {
      console.error("Newsletter welcome email failed:", error);
    }

    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (error) {
    console.error("POST /api/newsletter/subscribe:", error);
    return NextResponse.json(
      { error: "Could not subscribe right now. Please try again later." },
      { status: 500 }
    );
  }
}
