import { IssuesPageClient } from "./IssuesPageClient";
import { checkProjectAccess } from "@/lib/projectAuth";
import { redirect } from "next/navigation";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function ProjectIssuesPage({ params }: PageProps) {
  const { slug } = await params;
  const { project } = await checkProjectAccess(slug);

  if (!project.finalized) {
    redirect(`/p/${slug}/setup`);
  }

  return <IssuesPageClient slug={slug} />;
}
