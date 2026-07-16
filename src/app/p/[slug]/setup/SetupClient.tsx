"use client";

import { useState, useTransition } from "react";
import { Bug, Save, AlertTriangle, HelpCircle, Check, Info } from "lucide-react";
import { useRouter } from "next/navigation";
import { finalizeProjectSetup } from "@/app/actions/project";

interface SetupClientProps {
  project: {
    id: string;
    name: string;
    slug: string;
    sheetUrl: string;
  };
  tabs: string[];
  fetchError: string | null;
  initialHeaderRow: number;
  initialDataStartRow: number;
}

export function SetupClient({
  project,
  tabs,
  fetchError,
  initialHeaderRow,
  initialDataStartRow,
}: SetupClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [errorMsg, setErrorMsg] = useState<string | null>(fetchError);

  // States for finalization settings
  const [selectedTabs, setSelectedTabs] = useState<string[]>(() => {
    // Default select all tabs except settings/validation rules tab if names match
    return tabs.filter((t) => !/settings|validation|rules|config/i.test(t));
  });
  const [validationTabName, setValidationTabName] = useState<string>(() => {
    // Attempt to guess validation rules tab
    const guessed = tabs.find((t) => /settings|validation|rules/i.test(t));
    return guessed || "";
  });
  const [headerRow, setHeaderRow] = useState(initialHeaderRow);
  const [dataStartRow, setDataStartRow] = useState(initialDataStartRow);

  const toggleTab = (tab: string) => {
    setSelectedTabs((prev) =>
      prev.includes(tab) ? prev.filter((t) => t !== tab) : [...prev, tab]
    );
  };

  const handleFinalize = () => {
    setErrorMsg(null);

    if (selectedTabs.length === 0) {
      setErrorMsg("You must select at least one dashboard tab containing QA issues.");
      return;
    }

    startTransition(async () => {
      const result = await finalizeProjectSetup(project.id, {
        selectedTabs,
        validationTabName: validationTabName || null,
        headerRow,
        dataStartRow,
      });

      if (result.error) {
        setErrorMsg(result.error);
      } else {
        router.push(`/p/${project.slug}`);
        router.refresh();
      }
    });
  };

  return (
    <div className="relative min-h-screen bg-zinc-950 flex flex-col text-zinc-300">
      {/* Background Glows */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-[50vw] h-[30vw] rounded-full bg-blue-500/5 blur-[120px]" />
        <div className="absolute top-[20%] left-0 w-[40vw] h-[40vw] rounded-full bg-violet-500/5 blur-[120px]" />
      </div>

      {/* Top Navbar */}
      <header className="relative z-10 w-full border-b border-zinc-800/40 bg-zinc-950/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto flex h-16 items-center px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2.5">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 text-blue-500 shadow-inner">
              <Bug className="h-4 w-4" />
            </div>
            <div>
              <h1 className="text-sm font-black tracking-tight text-white sm:text-base">
                QA Board Setup Wizard
              </h1>
            </div>
          </div>
        </div>
      </header>

      {/* Setup Form Container */}
      <main className="relative z-10 flex-1 max-w-2xl w-full mx-auto px-4 py-12 flex flex-col justify-center">
        <div className="bg-zinc-900/50 border border-zinc-800/60 rounded-2xl p-6 md:p-8 shadow-xl backdrop-blur-xl space-y-6">
          
          {/* Header Description */}
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] bg-blue-500/10 text-blue-400 border border-blue-500/20 font-bold uppercase mb-3">
              Step 2: Onboarding Setup
            </div>
            <h2 className="text-lg font-black text-white uppercase tracking-wider">
              Configure {project.name}
            </h2>
            <p className="text-xs text-zinc-500 mt-1">
              Confirm which Google Sheet tabs to load in the dashboard and map validation options to optimize filter performance.
            </p>
          </div>

          {errorMsg && (
            <div className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl text-xs font-semibold flex gap-2 items-start">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {tabs.length === 0 && !errorMsg ? (
            <div className="p-6 bg-zinc-950/60 border border-zinc-900 rounded-xl text-center space-y-2">
              <p className="text-xs text-zinc-500">
                Could not fetch spreadsheet tabs. Ensure the sheet exists and is accessible.
              </p>
            </div>
          ) : (
            <div className="space-y-5">
              
              {/* Selector 1: Dashboard Target Tabs */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1">
                  <span>Dashboard Tab Selection</span>
                  <HelpCircle className="w-3.5 h-3.5 text-zinc-600" title="Select all sheets containing bug report tables" />
                </label>
                <p className="text-[10px] text-zinc-500 leading-tight">
                  Check all sheets you want to import ticket issues from. (Uncheck validation/rules sheets).
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                  {tabs.map((tab) => {
                    const checked = selectedTabs.includes(tab);
                    return (
                      <div
                        key={tab}
                        onClick={() => toggleTab(tab)}
                        className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer select-none transition ${
                          checked
                            ? "bg-blue-500/5 border-blue-500/30 text-white"
                            : "bg-zinc-950/40 border-zinc-900 text-zinc-500 hover:border-zinc-800"
                        }`}
                      >
                        <span className="text-xs font-bold truncate pr-2">{tab}</span>
                        <div className={`w-4 h-4 rounded border flex items-center justify-center transition ${
                          checked ? "bg-blue-500 border-blue-500 text-zinc-950" : "border-zinc-800"
                        }`}>
                          {checked && <Check className="w-3 h-3 stroke-[3]" />}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Row Offsets */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label htmlFor="headerRow" className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                    Header Row
                  </label>
                  <input
                    type="number"
                    id="headerRow"
                    min={1}
                    value={headerRow}
                    onChange={(e) => setHeaderRow(parseInt(e.target.value) || 1)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-zinc-700 transition"
                  />
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="dataStartRow" className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                    Data Start Row
                  </label>
                  <input
                    type="number"
                    id="dataStartRow"
                    min={1}
                    value={dataStartRow}
                    onChange={(e) => setDataStartRow(parseInt(e.target.value) || 1)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-zinc-700 transition"
                  />
                </div>
              </div>


              {/* Selector 2: Settings Validation Tab */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1">
                  <span>Settings / Validation Tab</span>
                  <HelpCircle className="w-3.5 h-3.5 text-zinc-600" title="Select the tab holding dropdown values list options" />
                </label>
                <p className="text-[10px] text-zinc-500 leading-tight">
                  Select the tab containing list values (e.g. lists of Assignees, Reporters) used to compile dropdown filters.
                </p>
                <select
                  value={validationTabName}
                  onChange={(e) => setValidationTabName(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-zinc-700 transition"
                >
                  <option value="">-- No Settings Tab (Fetch dynamically from active issues) --</option>
                  {tabs.map((tab) => (
                    <option key={tab} value={tab}>
                      {tab}
                    </option>
                  ))}
                </select>
              </div>

              
              {/* Informative tips card */}
              <div className="p-3 bg-zinc-950/60 border border-zinc-850 rounded-xl flex items-start gap-2.5 text-[10px] text-zinc-500">
                <Info className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-zinc-400 block mb-0.5">Finalizing Action Details</span>
                  Finalizing will scan headers inside selected sheets to match column configurations, compile status badges, and cache validation rules locally on the browser.
                </div>
              </div>

              {/* Action Submit buttons */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleFinalize}
                  disabled={isPending}
                  className="w-full h-11 bg-white hover:bg-zinc-100 text-zinc-950 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow active:scale-[0.98] transition cursor-pointer disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  <span>{isPending ? "Finalizing Setup..." : "Finalize Project & Open Dashboard"}</span>
                </button>
              </div>

            </div>
          )}

        </div>
      </main>
    </div>
  );
}
