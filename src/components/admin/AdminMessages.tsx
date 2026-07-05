"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { SessionUser } from "@/lib/auth";
import { TeamChatPanel } from "@/components/admin/TeamChatPanel";

export function AdminMessages({ user }: { user: SessionUser }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const withUser = searchParams.get("with");
  const [unreadTotal, setUnreadTotal] = useState(0);

  const description =
    unreadTotal > 0
      ? `${unreadTotal} unread message${unreadTotal === 1 ? "" : "s"} across your team`
      : "Chat with teammates — pick someone to start or continue a conversation.";

  function handleSelectUser(userId: string | null) {
    const params = new URLSearchParams(searchParams.toString());
    if (userId) params.set("with", userId);
    else params.delete("with");
    router.replace(`/admin/messages?${params.toString()}`, { scroll: false });
  }

  return (
    <div className="flex min-h-[calc(100dvh-7.5rem)] flex-col gap-4 sm:min-h-[calc(100dvh-8.5rem)]">
      <AdminPageHeader hideTitle title="Messages" description={description} />

      <div className="admin-card flex min-h-0 flex-1 flex-col overflow-hidden">
        <TeamChatPanel
          currentUserId={user.id}
          variant="page"
          initialWithUserId={withUser}
          onSelectUser={handleSelectUser}
          onUnreadChange={setUnreadTotal}
        />
      </div>
    </div>
  );
}
