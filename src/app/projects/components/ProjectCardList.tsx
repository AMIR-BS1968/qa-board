import { Folder, ExternalLink, ArrowRight } from "lucide-react";
import Link from "next/link";

interface SheetConfig {
  sheetUrl: string;
  sheetId: string;
}

interface Project {
  id: string;
  name: string;
  slug: string;
  createdAt: string | Date;
  sheetConfigs: SheetConfig[];
}

interface Membership {
  role: string;
  project: Project;
}

interface ProjectCardListProps {
  memberships: Membership[];
}

export function ProjectCardList({ memberships }: ProjectCardListProps) {
  if (memberships.length === 0) {
    return (
      <div className="bg-zinc-900/20 border border-dashed border-zinc-800/60 rounded-2xl p-12 text-center flex flex-col items-center justify-center">
        <div className="w-12 h-12 rounded-full bg-zinc-900/50 border border-zinc-800 flex items-center justify-center text-zinc-600 mb-4">
          <Folder className="w-5 h-5" />
        </div>
        <h3 className="text-sm font-bold text-zinc-400">No projects yet</h3>
        <p className="text-xs text-zinc-600 mt-1 max-w-[280px]">
          Create your first project dashboard using the form on the left to start importing and analyzing QA issues.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {memberships.map(({ project, role }) => {
        const sheetConfig = project.sheetConfigs[0];
        return (
          <div
            key={project.id}
            className="group bg-zinc-900/30 hover:bg-zinc-900/60 border border-zinc-850/80 hover:border-zinc-800 hover:shadow-lg rounded-2xl p-5 flex flex-col justify-between transition duration-200"
          >
            <div>
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Folder className="w-4 h-4 text-blue-500/80" />
                  <h3 className="text-sm font-black text-white group-hover:text-blue-400 transition">
                    {project.name}
                  </h3>
                </div>
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[9px] font-bold tracking-wider uppercase bg-zinc-800 border border-zinc-700/60 text-zinc-400">
                  {role}
                </span>
              </div>

              {sheetConfig && (
                <div className="flex items-center gap-1.5 mb-6 text-[11px] text-zinc-500 font-medium">
                  <span>Google Sheet:</span>
                  <a
                    href={sheetConfig.sheetUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-0.5 text-zinc-400 hover:text-blue-400 underline transition"
                    title={sheetConfig.sheetUrl}
                  >
                    <span className="truncate max-w-[140px]">{sheetConfig.sheetId}</span>
                    <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-zinc-800/40">
              <span className="text-[10px] text-zinc-600 font-mono">
                {new Date(project.createdAt).toLocaleDateString()}
              </span>
              <Link
                href={`/p/${project.slug}`}
                className="inline-flex items-center gap-1 text-xs text-zinc-300 font-bold group-hover:text-blue-400 transition"
              >
                <span>Open Dashboard</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>
          </div>
        );
      })}
    </div>
  );
}
