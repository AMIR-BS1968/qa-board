import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export default async function IndexPage() {
  const session = await auth();
  if (!session || !session.user || !session.user.id) {
    redirect("/login");
  }

  const membership = await prisma.projectMember.findFirst({
    where: { userId: session.user.id },
    include: { project: true },
    orderBy: { createdAt: "desc" },
  });

  if (membership) {
    redirect(`/p/${membership.project.slug}`);
  } else {
    redirect("/projects");
  }
}

