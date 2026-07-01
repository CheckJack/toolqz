"use client";

import { useSearchParams } from "next/navigation";
import { SessionUser } from "@/lib/auth";
import { TeamChatPanel } from "@/components/admin/TeamChatPanel";

export function AdminMessages({ user }: { user: SessionUser }) {
  const searchParams = useSearchParams();
  const withUser = searchParams.get("with");

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Messages</h1>
        <p className="mt-1 text-sm text-muted">
          Chat with teammates — pick someone on the left to start or continue a conversation.
        </p>
      </div>
      <TeamChatPanel
        currentUserId={user.id}
        variant="page"
        initialWithUserId={withUser}
      />
    </div>
  );
}
