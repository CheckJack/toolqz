import { NextRequest, NextResponse } from "next/server";
import { handleAuthError } from "@/lib/api-errors";
import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import {
  getOrCreateConversation,
  otherParticipant,
} from "@/lib/team-chat";

async function unreadForConversation(
  conversationId: string,
  userId: string,
  lastReadAt: Date
) {
  return prisma.teamMessage.count({
    where: {
      conversationId,
      senderId: { not: userId },
      createdAt: { gt: lastReadAt },
    },
  });
}

export async function GET(request: NextRequest) {
  try {
    const session = await requireSession();
    const withUserId = request.nextUrl.searchParams.get("withUserId");

    if (withUserId) {
      if (withUserId === session.id) {
        return NextResponse.json({ error: "Cannot message yourself" }, { status: 400 });
      }

      const other = await prisma.user.findUnique({
        where: { id: withUserId },
        select: { id: true, name: true, email: true, role: true },
      });
      if (!other) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }

      const conversation = await getOrCreateConversation(session.id, withUserId);
      const messages = await prisma.teamMessage.findMany({
        where: { conversationId: conversation.id },
        orderBy: { createdAt: "asc" },
        take: 200,
        include: { sender: { select: { id: true, name: true } } },
      });

      await prisma.teamConversationRead.upsert({
        where: {
          conversationId_userId: {
            conversationId: conversation.id,
            userId: session.id,
          },
        },
        create: {
          conversationId: conversation.id,
          userId: session.id,
          lastReadAt: new Date(),
        },
        update: { lastReadAt: new Date() },
      });

      return NextResponse.json({
        conversation: {
          id: conversation.id,
          otherUser: other,
        },
        messages,
      });
    }

    const [users, conversations] = await Promise.all([
      prisma.user.findMany({
        where: { id: { not: session.id } },
        select: { id: true, name: true, email: true, role: true },
        orderBy: { name: "asc" },
      }),
      prisma.teamConversation.findMany({
        where: { OR: [{ userAId: session.id }, { userBId: session.id }] },
        include: {
          messages: {
            orderBy: { createdAt: "desc" },
            take: 1,
            select: { body: true, createdAt: true, senderId: true },
          },
          reads: { where: { userId: session.id }, take: 1 },
          userA: { select: { id: true, name: true, email: true, role: true } },
          userB: { select: { id: true, name: true, email: true, role: true } },
        },
        orderBy: { updatedAt: "desc" },
      }),
    ]);

    const convByUser = new Map<
      string,
      {
        conversationId: string;
        lastMessage: { body: string; createdAt: Date; senderId: string } | null;
        unreadCount: number;
        updatedAt: Date;
      }
    >();

    let unreadTotal = 0;
    for (const conv of conversations) {
      const otherId = otherParticipant(conv, session.id);
      const lastReadAt = conv.reads[0]?.lastReadAt ?? new Date(0);
      const unreadCount = await unreadForConversation(conv.id, session.id, lastReadAt);
      unreadTotal += unreadCount;
      convByUser.set(otherId, {
        conversationId: conv.id,
        lastMessage: conv.messages[0] ?? null,
        unreadCount,
        updatedAt: conv.updatedAt,
      });
    }

    const members = users
      .map((u) => {
        const meta = convByUser.get(u.id);
        return {
          ...u,
          conversationId: meta?.conversationId ?? null,
          lastMessage: meta?.lastMessage ?? null,
          unreadCount: meta?.unreadCount ?? 0,
          lastActivityAt: meta?.updatedAt ?? null,
        };
      })
      .sort((a, b) => {
        const aTime = a.lastActivityAt ? new Date(a.lastActivityAt).getTime() : 0;
        const bTime = b.lastActivityAt ? new Date(b.lastActivityAt).getTime() : 0;
        if (aTime !== bTime) return bTime - aTime;
        return a.name.localeCompare(b.name);
      });

    return NextResponse.json({ members, unreadTotal });
  } catch (error) {
    return handleAuthError(error, "Failed to load messages");
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireSession();
    const body = await request.json();
    const text = typeof body.body === "string" ? body.body.trim() : "";
    if (!text) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    let conversationId = typeof body.conversationId === "string" ? body.conversationId : null;
    const toUserId = typeof body.toUserId === "string" ? body.toUserId : null;

    if (!conversationId && toUserId) {
      if (toUserId === session.id) {
        return NextResponse.json({ error: "Cannot message yourself" }, { status: 400 });
      }
      const other = await prisma.user.findUnique({ where: { id: toUserId } });
      if (!other) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }
      const conv = await getOrCreateConversation(session.id, toUserId);
      conversationId = conv.id;
    }

    if (!conversationId) {
      return NextResponse.json({ error: "conversationId or toUserId required" }, { status: 400 });
    }

    const conversation = await prisma.teamConversation.findUnique({
      where: { id: conversationId },
    });
    if (!conversation) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
    }
    if (conversation.userAId !== session.id && conversation.userBId !== session.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const message = await prisma.teamMessage.create({
      data: {
        conversationId,
        senderId: session.id,
        body: text,
      },
      include: { sender: { select: { id: true, name: true } } },
    });

    await prisma.teamConversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() },
    });

    return NextResponse.json({ message, conversationId });
  } catch (error) {
    return handleAuthError(error, "Failed to send message");
  }
}
