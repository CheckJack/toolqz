import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { sendEmail } from "@/lib/email";

const PRODUCT_TYPES = new Set(["saas", "digital", "service", "app", "other"]);

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (typeof body.website_url === "string" && body.website_url.trim()) {
      return NextResponse.json({ ok: true });
    }

    const companyName =
      typeof body.companyName === "string" ? body.companyName.trim() : "";
    const contactName =
      typeof body.contactName === "string" ? body.contactName.trim() : "";
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const website =
      typeof body.website === "string" ? body.website.trim() || null : null;
    const productType =
      typeof body.productType === "string" ? body.productType.trim() : "";
    const message = typeof body.message === "string" ? body.message.trim() : "";

    if (!companyName || !contactName || !email || !productType || !message) {
      return NextResponse.json({ error: "Please fill in all required fields." }, { status: 400 });
    }

    if (!isValidEmail(email)) {
      return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
    }

    if (!PRODUCT_TYPES.has(productType)) {
      return NextResponse.json({ error: "Please select a product type." }, { status: 400 });
    }

    if (message.length < 20) {
      return NextResponse.json(
        { error: "Please share a bit more detail about your product (at least 20 characters)." },
        { status: 400 }
      );
    }

    const inquiry = await prisma.partnerInquiry.create({
      data: {
        companyName,
        contactName,
        email,
        website,
        productType,
        message,
      },
    });

    const notifyTo =
      process.env.PARTNER_INQUIRY_EMAIL ??
      process.env.ADMIN_EMAIL ??
      "admin@toolqz.com";

    const productLabel =
      productType === "saas"
        ? "SaaS / software"
        : productType === "digital"
          ? "Digital product"
          : productType === "service"
            ? "Online service"
            : productType === "app"
              ? "Mobile or web app"
              : "Other";

    await sendEmail({
      to: notifyTo,
      subject: `Partner inquiry: ${companyName}`,
      text: [
        `New work-with-us inquiry (${inquiry.id})`,
        "",
        `Company: ${companyName}`,
        `Contact: ${contactName}`,
        `Email: ${email}`,
        `Website: ${website ?? "—"}`,
        `Type: ${productLabel}`,
        "",
        message,
      ].join("\n"),
    });

    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (error) {
    console.error("POST /api/partner-inquiry:", error);
    return NextResponse.json(
      { error: "Could not send your inquiry. Please try again later." },
      { status: 500 }
    );
  }
}
