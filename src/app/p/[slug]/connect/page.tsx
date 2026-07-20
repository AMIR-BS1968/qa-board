import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Bug, Database } from "lucide-react";
import { ConnectButton } from "./ConnectButton";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function ConnectPage({ params }: PageProps) {
  const { slug } = await params;

  const session = await auth();
  if (!session || !session.user || !session.user.id) {
    redirect("/login");
  }

  // Retrieve project
  const project = await prisma.project.findUnique({
    where: { slug },
    include: {
      members: {
        where: { userId: session.user.id },
      },
    },
  });

  if (!project) {
    redirect("/projects");
  }

  const member = project.members[0];
  if (!member || !member.roles.includes("OWNER")) {
    // Non-owners shouldn't see this connection page
    redirect(`/p/${slug}`);
  }

  // Check if already connected
  const sheetsAccount = await prisma.account.findFirst({
    where: {
      userId: session.user.id,
      provider: "google",
      scope: {
        contains: "spreadsheets",
      },
    },
  });

  if (sheetsAccount) {
    redirect(`/p/${slug}`);
  }

  return (
    <div className="relative min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-4 selection:bg-primary/20 selection:text-primary">
      {/* Visual Background Grid & Gradients */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[20%] right-0 w-[55vw] h-[35vw] rounded-full bg-blue-500/5 blur-[120px]" />
        <div className="absolute bottom-[20%] left-0 w-[45vw] h-[45vw] rounded-full bg-violet-500/5 blur-[120px]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#09090b_1px,transparent_1px),linear-gradient(to_bottom,#09090b_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-40" />
      </div>

      <div className="relative z-10 w-full max-w-md bg-zinc-900/20 border border-zinc-900 rounded-3xl p-8 shadow-2xl flex flex-col items-center text-center space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-blue-500 shadow-inner">
          <Database className="w-8 h-8 animate-pulse" />
        </div>

        <div className="space-y-2">
          <h2 className="text-xl font-black text-white uppercase tracking-wider">
            Connect Google Sheet
          </h2>
          <p className="text-xs text-zinc-500 leading-relaxed">
            As the <strong className="text-zinc-300">Project Owner</strong> of{" "}
            <span className="text-blue-400 font-bold">{project.name}</span>, you need to connect your
            Google account with Sheets access so the board can sync and log issue updates.
          </p>
        </div>

        <div className="w-full p-4 bg-zinc-950/40 border border-zinc-900 rounded-2xl text-left space-y-2.5 text-xs text-zinc-400">
          <div className="font-bold text-zinc-300">Why is this required?</div>
          <div className="leading-relaxed">
            To prevent hitting Google's OAuth caps for team members, all spreadsheet writes (from developers,
            QA, and managers) are tunneled through the Owner's authenticated connection.
          </div>
        </div>

        <div className="w-full pt-2">
          <ConnectButton slug={slug} />
        </div>
      </div>
    </div>
  );
}
