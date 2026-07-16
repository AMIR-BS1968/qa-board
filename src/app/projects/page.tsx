import { auth, signOut } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { createProject } from "@/app/actions/project";
import { Bug, LogOut } from "lucide-react";
import { CreateProjectCard } from "./components/CreateProjectCard";
import { ProjectCardList } from "./components/ProjectCardList";

export default async function ProjectsPage() {
  const session = await auth();
  if (!session || !session.user || !session.user.id) {
    redirect("/login");
  }

  const userId = session.user.id;

  // Retrieve user memberships
  const memberships = (await prisma.projectMember.findMany({
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
  })) as any[];

  async function handleLogout() {
    "use server";
    await signOut({ redirectTo: "/login" });
  }

  async function handleCreateProjectForm(formData: FormData) {
    "use server";
    const result = await createProject(formData);
    if (result.success && result.slug) {
      redirect(`/p/${result.slug}/setup`);
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
          <CreateProjectCard action={handleCreateProjectForm} />
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

          <ProjectCardList memberships={memberships} />
        </section>
      </main>
    </div>
  );
}
