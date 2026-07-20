"use client";

import { useState, useEffect, useMemo } from "react";
import { UserCheck, RefreshCw, Save, Check } from "lucide-react";

interface TeamMember {
  id: string;
  name: string | null;
  email: string | null;
  roles: string[];
}

interface ExistingMapping {
  sheetName: string;
  userId: string;
}

interface AssigneeMappingTabProps {
  projectId: string;
  slug: string;
}

export function AssigneeMappingTab({ projectId, slug }: AssigneeMappingTabProps) {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [existingMappings, setExistingMappings] = useState<ExistingMapping[]>([]);
  const [uniqueSheetAssignees, setUniqueSheetAssignees] = useState<string[]>([]);
  
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [success, setSuccess] = useState<boolean>(false);

  // Mappings state: key is sheetName, value is userId
  const [mappings, setMappings] = useState<Record<string, string>>({});

  const fetchData = async () => {
    setLoading(true);
    setSuccess(false);
    try {
      // 1. Load team members and existing mappings
      const mapRes = await fetch(`/api/project/members/mapping?projectId=${projectId}`);
      const mapData = await mapRes.json();
      
      let memberList: TeamMember[] = [];
      let initialMappings: Record<string, string> = {};
      
      if (mapData.success) {
        memberList = mapData.members || [];
        setMembers(memberList);
        
        const maps: ExistingMapping[] = mapData.mappings || [];
        setExistingMappings(maps);
        maps.forEach((m) => {
          initialMappings[m.sheetName] = m.userId;
        });
      }

      // 2. Load unique assignees from sheet issues
      const issuesRes = await fetch(`/api/issues?slug=${slug}`);
      const issuesData = await issuesRes.json();
      if (issuesData.success && Array.isArray(issuesData.data)) {
        const assignees = new Set<string>();
        issuesData.data.forEach((issue: any) => {
          if (issue.assignee && typeof issue.assignee === "string" && issue.assignee.trim()) {
            assignees.add(issue.assignee.trim());
          }
        });
        const assigneeList = Array.from(assignees).sort();
        setUniqueSheetAssignees(assigneeList);

        // Prepopulate mapping state
        const updatedMappings = { ...initialMappings };
        assigneeList.forEach((a) => {
          if (!updatedMappings[a]) {
            // Check if there is an exact name match in project members
            const matchedMember = memberList.find(
              (m) => m.name && m.name.toLowerCase() === a.toLowerCase()
            );
            if (matchedMember) {
              updatedMappings[a] = matchedMember.id;
            } else {
              updatedMappings[a] = "";
            }
          }
        });
        setMappings(updatedMappings);
      }
    } catch (err) {
      console.error("Error loading mapping data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [projectId, slug]);

  const handleSelectChange = (sheetName: string, userId: string) => {
    setMappings((prev) => ({
      ...prev,
      [sheetName]: userId,
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    setSuccess(false);
    try {
      const mappingsPayload = Object.entries(mappings)
        .filter(([_, userId]) => userId !== "")
        .map(([sheetName, userId]) => ({
          sheetName,
          userId,
        }));

      const res = await fetch("/api/project/members/mapping", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          mappings: mappingsPayload,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      }
    } catch (err) {
      console.error("Failed to save assignee mapping:", err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <div>
        <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
          <UserCheck className="w-3.5 h-3.5 text-blue-500" />
          Assignee Name Mapping
        </h3>
        <p className="text-[11px] text-zinc-500 mt-0.5">
          Map assignee string names inside the Google Sheet to project users so team members can view their filtered "My Issues" boards.
        </p>
      </div>

      {loading ? (
        <div className="py-12 flex items-center justify-center text-xs text-zinc-500">
          <RefreshCw className="w-4 h-4 animate-spin mr-2" />
          Analyzing spreadsheet assignees...
        </div>
      ) : uniqueSheetAssignees.length === 0 ? (
        <div className="py-12 border border-dashed border-zinc-800/60 rounded-2xl text-center text-xs text-zinc-500">
          No assignee names found in the spreadsheet. Make sure your sheets import contains assignees.
        </div>
      ) : (
        <div className="space-y-4">
          <div className="border border-zinc-900 rounded-xl overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-950/60 text-zinc-400 border-b border-zinc-900 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="px-4 py-3">Google Sheet Name</th>
                  <th className="px-4 py-3">Maps To Project Member</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-900 bg-zinc-900/10">
                {uniqueSheetAssignees.map((assignee) => (
                  <tr key={assignee} className="hover:bg-zinc-900/25 transition">
                    <td className="px-4 py-3 font-bold text-zinc-200">
                      {assignee}
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={mappings[assignee] || ""}
                        onChange={(e) => handleSelectChange(assignee, e.target.value)}
                        className="w-full max-w-xs h-9 bg-zinc-950 border border-zinc-850 text-xs font-semibold text-white px-2.5 rounded-lg focus:outline-none cursor-pointer transition"
                      >
                        <option value="">-- Unmapped / None --</option>
                        {members.map((m) => (
                          <option key={m.id} value={m.id}>
                            {m.name || m.email} ({m.roles.join(", ")})
                          </option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={handleSave}
              disabled={saving}
              className="h-10 px-5 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-500/50 disabled:cursor-not-allowed text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 cursor-pointer transition select-none active:scale-[0.98]"
            >
              {saving ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Save className="w-3.5 h-3.5" />
              )}
              <span>{saving ? "Saving..." : "Save Mappings"}</span>
            </button>

            {success && (
              <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1.5 animate-pulse">
                <Check className="w-4 h-4" />
                Mappings updated successfully!
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
