import { Plus } from "lucide-react";

interface CreateProjectCardProps {
  action: (formData: FormData) => Promise<void>;
}

export function CreateProjectCard({ action }: CreateProjectCardProps) {
  return (
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

      <form action={action} className="space-y-4">
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
  );
}
