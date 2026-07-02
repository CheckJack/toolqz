import { NextRequest, NextResponse } from "next/server";
import { handleAuthError } from "@/lib/api-errors";
import { logAudit } from "@/lib/audit-log";
import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import {
  DEFAULT_LINK_PAGE,
  DEFAULT_LINKS,
  ensureLinkPage,
  serializeLinkPage,
  normalizeLinkUrl,
} from "@/lib/link-page";
import type { LinkPageUpdatePayload } from "@/types/link-page";

function isValidHex(color: string) {
  return /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(color);
}

function validatePayload(body: LinkPageUpdatePayload): string | null {
  if (!body.title?.trim()) return "Title is required";
  if (!["solid", "gradient"].includes(body.backgroundType)) {
    return "Invalid background type";
  }
  if (!["rounded", "pill", "square"].includes(body.buttonStyle)) {
    return "Invalid button style";
  }
  for (const color of [
    body.backgroundColor,
    body.gradientFrom,
    body.gradientTo,
    body.buttonColor,
    body.buttonTextColor,
  ]) {
    if (!isValidHex(color)) return "Colors must be valid hex values";
  }
  if (!Array.isArray(body.links)) return "Links must be an array";
  for (const link of body.links) {
    if (!link.title?.trim()) return "Each link needs a title";
    if (!normalizeLinkUrl(link.url)) return "Each link needs a valid URL";
  }
  return null;
}

export async function GET() {
  try {
    await requireSession();
    const page = await ensureLinkPage();
    return NextResponse.json(serializeLinkPage(page));
  } catch (error) {
    return handleAuthError(error, "Failed to load link page");
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await requireSession();
    const body = (await request.json()) as LinkPageUpdatePayload;
    const validationError = validatePayload(body);
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    await ensureLinkPage();

    const links = body.links.map((link, index) => ({
      id: link.id,
      title: link.title.trim(),
      url: normalizeLinkUrl(link.url),
      icon: link.icon?.trim() || null,
      sortOrder: link.sortOrder ?? index,
      enabled: Boolean(link.enabled),
    }));

    const existingIds = (
      await prisma.linkPageItem.findMany({
        where: { linkPageId: "default" },
        select: { id: true },
      })
    ).map((item) => item.id);

    const incomingIds = links.filter((l) => l.id).map((l) => l.id as string);
    const toDelete = existingIds.filter((id) => !incomingIds.includes(id));

    await prisma.$transaction(async (tx) => {
      await tx.linkPage.update({
        where: { id: "default" },
        data: {
          title: body.title.trim(),
          bio: body.bio.trim(),
          avatarUrl: body.avatarUrl?.trim() || null,
          backgroundType: body.backgroundType,
          backgroundColor: body.backgroundColor,
          gradientFrom: body.gradientFrom,
          gradientTo: body.gradientTo,
          buttonColor: body.buttonColor,
          buttonTextColor: body.buttonTextColor,
          buttonStyle: body.buttonStyle,
          showBranding: body.showBranding,
        },
      });

      if (toDelete.length > 0) {
        await tx.linkPageItem.deleteMany({ where: { id: { in: toDelete } } });
      }

      for (const link of links) {
        if (link.id && existingIds.includes(link.id)) {
          await tx.linkPageItem.update({
            where: { id: link.id },
            data: {
              title: link.title,
              url: link.url,
              icon: link.icon,
              sortOrder: link.sortOrder,
              enabled: link.enabled,
            },
          });
        } else {
          await tx.linkPageItem.create({
            data: {
              linkPageId: "default",
              title: link.title,
              url: link.url,
              icon: link.icon,
              sortOrder: link.sortOrder,
              enabled: link.enabled,
            },
          });
        }
      }
    });

    const updated = await ensureLinkPage();
    await logAudit("UPDATE", "LinkPage", "Updated /links page", {
      userId: session.id,
      entityId: "default",
    });

    return NextResponse.json(serializeLinkPage(updated));
  } catch (error) {
    return handleAuthError(error, "Failed to save link page");
  }
}

export async function POST() {
  try {
    await requireSession();
    const page = await prisma.linkPage.create({
      data: {
        id: "default",
        ...DEFAULT_LINK_PAGE,
        links: { create: DEFAULT_LINKS },
      },
      include: { links: { orderBy: { sortOrder: "asc" } } },
    });
    return NextResponse.json(serializeLinkPage(page), { status: 201 });
  } catch {
    const page = await ensureLinkPage();
    return NextResponse.json(serializeLinkPage(page));
  }
}
