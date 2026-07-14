import { auth, signOut } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { createProject } from "@/app/actions/project";
import { Bug, Plus, Folder, LogOut, ArrowRight, ExternalLink } from "lucide-react";
import Link from "next/link";

export default async function ProjectsPage() {
  const session = await auth();
  if (!session || !session.user || !session.user.id) {
    redirect("/login");
  }

  const userId = session.user.id;

  // Retrieve user memberships
  const memberships = await prisma.projectMember.findMany({
    where: { userId },
    include: {
      project: {
        include: {
          sheetConfigs: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  async function handleLogout() {
    "use server";
    await signOut({ redirectTo: "/login" });
  }

  async function handleCreateProjectForm(formData: FormData) {
    "use server";
    const result = await createProject(formData);
    if (result.success && result.slug) {
      redirect(`/p/${result.slug}`);
    }
  }

  return (
    <div className="relative min-h-screen bg-zinc-950 flex flex-col selection:bg-primary/20 selection:text-primary">
      {/* Visual Background Grid & Gradients */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-[50vw] h-[30vw] rounded-full bg-blue-500/5 blur-[120px]" />
        <div className="absolute top-[20%] left-0 w-[40vw] h-[40vw] rounded-full bg-violet-500/5 blur-[120px]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#09090b_1px,transparent_1px),linear-gradient(to_bottom,#09090b_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-40" />
      </div>

      {/* Top Navbar */}
      <header className="relative z-10 w-full border-b border-zinc-800/40 bg-zinc-950/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2.5">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 text-blue-500 shadow-inner">
              <Bug className="h-4 w-4" />
            </div>
            <div>
              <h1 className="text-sm font-black tracking-tight text-white sm:text-base">
                QA Board
              </h1>
              <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider hidden sm:block">
                Workspace Selector
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2.5">
              {session.user.image && (
                <img
                  src={session.user.image}
                  alt={session.user.name || "Profile"}
                  className="w-7 h-7 rounded-full border border-zinc-800 shadow"
                />
              )}
              <span className="text-xs text-zinc-400 font-semibold hidden sm:inline-block">
                {session.user.name || session.user.email}
              </span>
            </div>
            <form action={handleLogout}>
              <button
                type="submit"
                className="h-8 w-8 flex items-center justify-center rounded-lg border border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:text-white hover:bg-zinc-800/80 hover:border-zinc-700 transition cursor-pointer"
                title="Log out"
              >
                <LogOut className="h-3.5 w-3.5" />
              </button>
            </form>
          </div>
        </div>
      </header>

      {/* Main Layout Area */}
      <main className="relative z-10 flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10 grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Create Project Form */}
        <section className="lg:col-span-1 space-y-6">
          <div className="bg-zinc-900/50 border border-zinc-800/60 rounded-2xl p-6 shadow-xl backdrop-blur-xl">
            <div className="flex items-center gap-2.5 mb-6">
              <div className="w-7 h-7 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                <Plus className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                  New Project
                </h2>
                <p className="text-[11px] text-zinc-500">
                  Connect a Google Sheet to instantiate a new board.
                </p>
              </div>
            </div>

            <form action={handleCreateProjectForm} className="space-y-4">
              <div className="space-y-1.5">
                <label htmlFor="name" className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                  Project Name
                </label>
                <input
                  type="text"
                  name="name"
                  id="name"
                  required
                  placeholder="e.g. Acme Mobile App"
                  className="w-full bg-zinc-950 border border-zinc-800/80 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-700 focus:ring-1 focus:ring-zinc-700 transition"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label htmlFor="slug" className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                    Slug URL
                  </label>
                  <span className="text-[10px] text-zinc-500 font-mono">(optional)</span>
                </div>
                <input
                  type="text"
                  name="slug"
                  id="slug"
                  placeholder="e.g. acme-app"
                  className="w-full bg-zinc-950 border border-zinc-800/80 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-700 focus:ring-1 focus:ring-zinc-700 transition"
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="sheetUrl" className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                  Google Sheet URL
                </label>
                <input
                  type="url"
                  name="sheetUrl"
                  id="sheetUrl"
                  required
                  placeholder="https://docs.google.com/spreadsheets/d/..."
                  className="w-full bg-zinc-950 border border-zinc-800/80 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-zinc-700 focus:ring-1 focus:ring-zinc-700 transition"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-white hover:bg-zinc-100 text-zinc-950 font-semibold text-xs py-3 px-4 rounded-xl active:scale-[0.98] transition cursor-pointer mt-2"
              >
                Create Project Board
              </button>
            </form>
          </div>
        </section>

        {/* Right Column: Existing Projects List */}
        <section className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-zinc-500 uppercase tracking-wider">
                My Projects
              </h2>
              <p className="text-xs text-zinc-600 mt-0.5">
                Select a board below to access your issue management dashboard.
              </p>
            </div>
            <span className="text-xs text-zinc-500 font-mono font-medium">
              {memberships.length} found
            </span>
          </div>

          {memberships.length === 0 ? (
            <div className="bg-zinc-900/20 border border-dashed border-zinc-800/60 rounded-2xl p-12 text-center flex flex-col items-center justify-center">
              <div className="w-12 h-12 rounded-full bg-zinc-900/50 border border-zinc-800 flex items-center justify-center text-zinc-600 mb-4">
                <Folder className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-zinc-400">No projects yet</h3>
              <p className="text-xs text-zinc-600 mt-1 max-w-[280px]">
                Create your first project dashboard using the form on the left to start importing and analyzing QA issues.
              </p>
            </div>
          ) : (
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
          )}
        </section>
      </main>
    </div>
  );
}
