import { ReactNode } from "react";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { BatchUpdateFABContainer } from "./components/BatchUpdateFABContainer";

interface LayoutProps {
  children: ReactNode;
  params: Promise<{ slug: string }>;
}

export default async function ProjectLayout({ children, params }: LayoutProps) {
  const { slug } = await params;

  // Validate project exists
  const project = await prisma.project.findUnique({
    where: { slug },
  });

  if (!project) {
    notFound();
  }

  return (
    <div className="relative min-h-screen flex flex-col bg-zinc-950">
      {/* Page Content */}
      <div className="flex-1 flex flex-col">{children}</div>

      {/* Persistent Client-side FAB & Dialog */}
      <BatchUpdateFABContainer slug={slug} />
    </div>
  );
}
