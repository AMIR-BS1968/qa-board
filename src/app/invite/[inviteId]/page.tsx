import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect, notFound } from "next/navigation";
import { Bug, CheckCircle2, ChevronRight, UserCheck } from "lucide-react";
import Link from "next/link";

interface PageProps {
  params: Promise<{ inviteId: string }>;
}

export default async function InviteRedemptionPage({ params }: PageProps) {
  const { inviteId } = await params;

  // Retrieve invite details
  const invite = await prisma.projectInvite.findUnique({
    where: { token: inviteId },
    include: {
      project: true,
    },
  });

  if (!invite) {
    notFound();
  }

  // Check expiration
  if (invite.expiresAt < new Date()) {
    return (
      <div className="relative min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full bg-zinc-900/30 border border-zinc-900 rounded-3xl p-8 text-center space-y-4">
          <h2 className="text-lg font-black text-rose-400 uppercase">Invite Expired</h2>
          <p className="text-xs text-zinc-500">
            This invite link is no longer valid or has expired. Please request a new invite link from the project owner.
          </p>
          <Link
            href="/projects"
            className="inline-flex h-9 items-center justify-center bg-zinc-900 border border-zinc-800 rounded-xl px-4 text-xs font-bold text-white hover:bg-zinc-800/80 transition"
          >
            Go to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  // Get session
  const session = await auth();
  if (!session || !session.user || !session.user.id) {
    // Redirect to login, passing the invite link as callback url
    redirect(`/login?callbackUrl=/invite/${inviteId}`);
  }

  const userId = session.user.id;

  // Check if user is already a member
  const existingMember = await prisma.projectMember.findUnique({
    where: {
      projectId_userId: {
        projectId: invite.projectId,
        userId,
      },
    },
  });

  if (existingMember) {
    // If already in the project, redirect them to it
    redirect(`/p/${invite.project.slug}`);
  }

  // Otherwise, redeem invite and add user
  await prisma.projectMember.create({
    data: {
      projectId: invite.projectId,
      userId,
      roles: [invite.role],
    },
  });

  // Redirect to project workspace
  redirect(`/p/${invite.project.slug}`);
}
