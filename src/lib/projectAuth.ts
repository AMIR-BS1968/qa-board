import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export async function checkProjectAccess(slug: string) {
  const session = await auth();
  if (!session || !session.user || !session.user.id) {
    redirect("/login");
  }

  const project = await prisma.project.findUnique({
    where: { slug },
    include: {
      sheetConfigs: true,
      members: {
        where: { userId: session.user.id },
      },
    },
  });

  if (!project) {
    redirect("/projects");
  }

  const member = project.members[0];
  if (!member) {
    redirect("/projects?error=Unauthorized");
  }

  // Enforce access control for Developer role
  // If the project is not finalized, developers shouldn't access it (needs setup first)
  if (member.roles.includes("DEVELOPER") && !project.finalized) {
    redirect("/projects?error=NotFinalized");
  }

  // If user is OWNER, check if Google Sheets account is connected
  if (member.roles.includes("OWNER")) {
    const sheetsAccount = await prisma.account.findFirst({
      where: {
        userId: session.user.id,
        provider: "google",
        scope: {
          contains: "spreadsheets",
        },
      },
    });

    if (!sheetsAccount) {
      redirect(`/p/${slug}/connect`);
    }
  }

  return { project, member, user: session.user };
}
