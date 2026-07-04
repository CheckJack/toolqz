import { prisma } from "@/lib/db";
import type { AssistantCard } from "./assistant-cards";

export async function loadChatSession(userId: string, sessionId: string) {
  return prisma.adminChatSession.findFirst({
    where: { id: sessionId, userId },
    include: {
      messages: { orderBy: { createdAt: "asc" }, take: 50 },
    },
  });
}

export async function listChatSessions(userId: string, limit = 10) {
  return prisma.adminChatSession.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
    take: limit,
    select: { id: true, title: true, updatedAt: true },
  });
}

export async function saveChatTurn(
  userId: string,
  sessionId: string | null,
  userContent: string,
  assistant: {
    reply: string;
    links?: { label: string; href: string }[];
    cards?: AssistantCard[];
  }
): Promise<string> {
  const title =
    userContent.length > 60 ? `${userContent.slice(0, 57)}…` : userContent;

  const session =
    sessionId
      ? await prisma.adminChatSession.findFirst({ where: { id: sessionId, userId } })
      : null;

  const sid =
    session?.id ??
    (
      await prisma.adminChatSession.create({
        data: { userId, title },
      })
    ).id;

  if (session && !session.title) {
    await prisma.adminChatSession.update({
      where: { id: sid },
      data: { title },
    });
  }

  const meta = JSON.stringify({
    links: assistant.links,
    cards: assistant.cards,
  });

  await prisma.adminChatMessage.createMany({
    data: [
      { sessionId: sid, role: "user", content: userContent },
      { sessionId: sid, role: "assistant", content: assistant.reply, metadata: meta },
    ],
  });

  await prisma.adminChatSession.update({
    where: { id: sid },
    data: { updatedAt: new Date() },
  });

  return sid;
}
