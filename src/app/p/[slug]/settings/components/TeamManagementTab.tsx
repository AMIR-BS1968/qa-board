"use client";

import { useState, useEffect } from "react";
import { Copy, Plus, RefreshCw, ShieldAlert, UserCheck, Users } from "lucide-react";

interface TeamMember {
  id: string;
  name: string | null;
  email: string | null;
  roles: string[];
}

interface TeamManagementTabProps {
  projectId: string;
}

export function TeamManagementTab({ projectId }: TeamManagementTabProps) {
  const [role, setRole] = useState<string>("DEVELOPER");
  const [inviteUrl, setInviteUrl] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loadingMembers, setLoadingMembers] = useState<boolean>(true);

  const fetchMembers = async () => {
    try {
      const res = await fetch(`/api/project/members/mapping?projectId=${projectId}`);
      const data = await res.json();
      if (data.success) {
        setMembers(data.members || []);
      }
    } catch (err) {
      console.error("Error loading team members:", err);
    } finally {
      setLoadingMembers(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, [projectId]);

  const handleGenerateInvite = async () => {
    setLoading(true);
    setInviteUrl("");
    setCopied(false);
    try {
      const res = await fetch("/api/project/invites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, role }),
      });
      const data = await res.json();
      if (data.success && data.inviteUrl) {
        setInviteUrl(data.inviteUrl);
      }
    } catch (err) {
      console.error("Failed to generate invite:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (inviteUrl) {
      navigator.clipboard.writeText(inviteUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Invite Generation Box */}
      <div className="p-5 bg-zinc-950/40 border border-zinc-850/60 rounded-2xl space-y-4">
        <div>
          <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
            <Plus className="w-3.5 h-3.5 text-blue-500" />
            Invite Project Members
          </h3>
          <p className="text-[11px] text-zinc-500 mt-0.5">
            Create a secure invite link to add managers, QA inspectors, or developers to your workspace.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="h-10 bg-zinc-950 border border-zinc-850 text-xs font-bold text-white px-3 rounded-xl focus:outline-none cursor-pointer sm:w-48 transition"
          >
            <option value="DEVELOPER">Developer (Issues Only)</option>
            <option value="QA">QA </option>
            <option value="MANAGER">Project Manager</option>
          </select>

          <button
            onClick={handleGenerateInvite}
            disabled={loading}
            className="h-10 px-5 bg-blue-500 hover:bg-blue-600 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 cursor-pointer transition select-none active:scale-[0.98] disabled:opacity-50"
          >
            {loading ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Plus className="w-3.5 h-3.5" />
            )}
            <span>Generate Invite Link</span>
          </button>
        </div>

        {inviteUrl && (
          <div className="mt-4 p-4 bg-zinc-950 border border-zinc-900 rounded-xl flex items-center justify-between gap-3">
            <span className="text-[11px] text-zinc-400 truncate select-all font-mono">
              {inviteUrl}
            </span>
            <button
              onClick={handleCopy}
              className="flex items-center gap-1 px-3 py-1.5 bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 rounded-lg text-[10px] font-bold text-white cursor-pointer active:scale-95 transition"
            >
              <Copy className="w-3 h-3 text-zinc-400" />
              <span>{copied ? "Copied!" : "Copy"}</span>
            </button>
          </div>
        )}
      </div>

      {/* Team Member List */}
      <div className="space-y-4">
        <div>
          <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-blue-500" />
            Active Team Members ({members.length})
          </h3>
          <p className="text-[11px] text-zinc-500 mt-0.5">
            List of users currently registered in this project.
          </p>
        </div>

        {loadingMembers ? (
          <div className="py-12 flex items-center justify-center text-xs text-zinc-500">
            <RefreshCw className="w-4 h-4 animate-spin mr-2" />
            Loading project team...
          </div>
        ) : members.length === 0 ? (
          <div className="py-12 border border-dashed border-zinc-800/60 rounded-2xl text-center text-xs text-zinc-500">
            No team members joined yet. Invite someone using the form above.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {members.map((m) => (
              <div
                key={m.id}
                className="p-4 bg-zinc-900/10 border border-zinc-900 hover:border-zinc-850 rounded-xl flex items-center justify-between gap-3 transition"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-850 flex items-center justify-center text-blue-400 font-black text-xs uppercase shadow-inner">
                    {m.name ? m.name[0] : (m.email ? m.email[0] : "?")}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white leading-none">
                      {m.name || "Pending User"}
                    </div>
                    <div className="text-[10px] text-zinc-500 mt-1">
                      {m.email}
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1">
                  {m.roles.map((r) => (
                    <span
                      key={r}
                      className={`px-1.5 py-0.5 rounded text-[8px] font-black tracking-wider uppercase border ${
                        r === "OWNER"
                          ? "bg-rose-500/10 border-rose-500/20 text-rose-400"
                          : r === "MANAGER"
                          ? "bg-amber-500/10 border-amber-500/20 text-amber-400"
                          : r === "QA"
                          ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                          : "bg-blue-500/10 border-blue-500/20 text-blue-400"
                      }`}
                    >
                      {r}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
