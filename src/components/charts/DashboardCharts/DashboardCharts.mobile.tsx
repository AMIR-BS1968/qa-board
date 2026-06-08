"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { STATUS_META_MAP } from "@/features/dashboard/constants";
import { DashboardChartsProps } from "./DashboardCharts.types";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";

export function DashboardChartsMobile({ metrics, loading = false }: DashboardChartsProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    let active = true;
    Promise.resolve().then(() => {
      if (active) {
        setMounted(true);
      }
    });
    return () => {
      active = false;
    };
  }, []);

  if (loading || !mounted) {
    return (
      <Card className="border border-border/30 bg-zinc-950/20">
        <CardContent className="h-[220px] flex items-center justify-center">
          <span className="text-xs text-zinc-500">Loading charts...</span>
        </CardContent>
      </Card>
    );
  }

  const statusData = metrics.issuesPerStatus.filter((s) => s.count > 0);
  const moduleData = metrics.moduleDistribution.slice(0, 4);
  const assigneeData = metrics.issuesPerAssignee.slice(0, 4); // Limit to top 4 on mobile

  return (
    <Card className="border border-border/30 bg-zinc-950/20">
      <CardHeader className="p-4 pb-2">
        <CardTitle className="text-sm font-semibold text-white">Visual Analytics</CardTitle>
        <CardDescription className="text-[10px] text-zinc-500">Issues breakdown and workload</CardDescription>
      </CardHeader>
      
      <CardContent className="p-2 pt-0">
        <Tabs defaultValue="status" className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-zinc-900/50 p-1 border border-border/20">
            <TabsTrigger value="status" className="text-xs py-1.5 data-[state=active]:bg-zinc-800">Status</TabsTrigger>
            <TabsTrigger value="workload" className="text-xs py-1.5 data-[state=active]:bg-zinc-800">Assignees</TabsTrigger>
            <TabsTrigger value="modules" className="text-xs py-1.5 data-[state=active]:bg-zinc-800">Modules</TabsTrigger>
          </TabsList>

          {/* TAB 1: Status Donut */}
          <TabsContent value="status" className="outline-none pt-2">
            <div className="h-[180px] w-full">
              {statusData.length === 0 ? (
                <div className="h-full flex items-center justify-center text-xs text-zinc-500">No data</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={65}
                      paddingAngle={3}
                      dataKey="count"
                    >
                      {statusData.map((entry, index) => {
                        const meta = STATUS_META_MAP[entry.status];
                        return (
                          <Cell
                            key={`cell-${index}`}
                            fill={meta?.chartColor || "#ccc"}
                            stroke="#18181b"
                            strokeWidth={1.5}
                          />
                        );
                      })}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
            
            {/* Custom status list representation on mobile for perfect readability */}
            <div className="grid grid-cols-2 gap-1.5 px-2 pb-2">
              {statusData.map((entry) => {
                const meta = STATUS_META_MAP[entry.status];
                return (
                  <div key={entry.status} className="flex items-center text-[10px] text-zinc-400 gap-1.5 truncate">
                    <span className="h-1.5 w-1.5 rounded-full shrink-0" style={{ backgroundColor: meta?.chartColor }} />
                    <span className="truncate">{meta?.label || entry.status}:</span>
                    <span className="font-bold text-white ml-auto">{entry.count}</span>
                  </div>
                );
              })}
            </div>
          </TabsContent>

          {/* TAB 2: Assignee Stacked Bar */}
          <TabsContent value="workload" className="outline-none pt-2">
            <div className="h-[200px] w-full">
              {assigneeData.length === 0 ? (
                <div className="h-full flex items-center justify-center text-xs text-zinc-500">No data</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={assigneeData}
                    margin={{ top: 10, right: 10, left: -30, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" vertical={false} />
                    <XAxis
                      dataKey="assignee"
                      stroke="#71717a"
                      fontSize={9}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      stroke="#71717a"
                      fontSize={9}
                      tickLine={false}
                      axisLine={false}
                      allowDecimals={false}
                    />
                    <Bar dataKey="todo" stackId="status" fill={STATUS_META_MAP["TODO"].chartColor} />
                    <Bar dataKey="inProgress" stackId="status" fill={STATUS_META_MAP["IN PROGRESS"].chartColor} />
                    <Bar dataKey="inQa" stackId="status" fill={STATUS_META_MAP["IN QA"].chartColor} />
                    <Bar dataKey="fixed" stackId="status" fill={STATUS_META_MAP["FIXED"].chartColor} />
                    <Bar dataKey="resolved" stackId="status" fill={STATUS_META_MAP["RESOLVED"].chartColor} />
                    <Bar dataKey="notResolved" stackId="status" fill={STATUS_META_MAP["NOT RESOLVED"].chartColor} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </TabsContent>

          {/* TAB 3: Modules list */}
          <TabsContent value="modules" className="outline-none pt-2">
            <div className="space-y-1.5 px-3 py-2">
              {moduleData.length === 0 ? (
                <div className="text-center text-xs text-zinc-500 py-4">No data</div>
              ) : (
                moduleData.map((entry) => {
                  const maxCount = moduleData[0]?.count || 1;
                  const percent = Math.round((entry.count / maxCount) * 100);
                  return (
                    <div key={entry.module} className="space-y-1">
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="font-semibold text-zinc-300">{entry.module}</span>
                        <span className="text-zinc-500 font-bold">{entry.count} issues</span>
                      </div>
                      <div className="h-1.5 w-full bg-zinc-900 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-violet-500 to-indigo-500 rounded-full"
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
