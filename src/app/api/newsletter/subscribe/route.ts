import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { isValidEmail, normalizeEmail } from "@/lib/subscribers";

export async function POST(request: NextRequest) {
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

    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (error) {
    console.error("POST /api/newsletter/subscribe:", error);
    return NextResponse.json(
      { error: "Could not subscribe right now. Please try again later." },
      { status: 500 }
    );
  }
}
