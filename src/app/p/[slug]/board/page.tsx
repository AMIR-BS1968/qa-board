import { KanbanBoardClient } from "./KanbanBoardClient";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function KanbanBoardPage({ params }: PageProps) {
  const { slug } = await params;

  // Validate project exists
  const project = await prisma.project.findUnique({
    where: { slug },
  });

  if (!project) {
    notFound();
  }

  return <KanbanBoardClient slug={slug} />;
}
