import { prisma } from "@/lib/db";

export function canonicalPair(userId1: string, userId2: string): [string, string] {
  return userId1 < userId2 ? [userId1, userId2] : [userId2, userId1];
}

export function otherParticipant(
  conversation: { userAId: string; userBId: string },
  userId: string
) {
  return conversation.userAId === userId ? conversation.userBId : conversation.userAId;
}

export async function getOrCreateConversation(userId1: string, userId2: string) {
  const [userAId, userBId] = canonicalPair(userId1, userId2);
  const existing = await prisma.teamConversation.findUnique({
    where: { userAId_userBId: { userAId, userBId } },
  });
  if (existing) return existing;
  return prisma.teamConversation.create({ data: { userAId, userBId } });
}

export async function countUnreadMessages(userId: string) {
  const conversations = await prisma.teamConversation.findMany({
    where: { OR: [{ userAId: userId }, { userBId: userId }] },
    include: {
      reads: { where: { userId }, take: 1 },
      messages: {
        where: { senderId: { not: userId } },
        orderBy: { createdAt: "desc" },
        take: 1,
        select: { createdAt: true },
      },
    },
  });

  let total = 0;
  for (const conv of conversations) {
    const lastReadAt = conv.reads[0]?.lastReadAt ?? new Date(0);
    const unread = await prisma.teamMessage.count({
      where: {
        conversationId: conv.id,
        senderId: { not: userId },
        createdAt: { gt: lastReadAt },
      },
    });
    total += unread;
  }
  return total;
}
