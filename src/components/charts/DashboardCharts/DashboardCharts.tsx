"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
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
  Tooltip as ChartTooltip,
  Legend,
  TooltipContentProps,
  LegendPayload,
} from "recharts";

// Custom tooltips for premium aesthetics
const CustomPieTooltip = ({ active, payload }: Partial<TooltipContentProps<number, string>>) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const meta = STATUS_META_MAP[data.status as keyof typeof STATUS_META_MAP];
    return (
      <div className="rounded-lg border border-border bg-zinc-950/95 p-3 shadow-xl backdrop-blur-md">
        <p className="flex items-center text-sm font-semibold gap-2" style={{ color: meta?.chartColor }}>
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: meta?.chartColor }} />
          {meta?.label || data.status}
        </p>
        <p className="text-xs text-zinc-400 mt-1">
          Issues: <span className="font-bold text-white">{data.count}</span> ({data.percentage}%)
        </p>
      </div>
    );
  }
  return null;
};

const CustomBarTooltip = ({ active, payload, label }: Partial<TooltipContentProps<number, string>>) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-lg border border-border bg-zinc-950/95 p-3 shadow-xl backdrop-blur-md">
        <p className="text-sm font-bold text-white mb-2">{label}</p>
        <div className="space-y-1">
          {payload.map((p) => {
            const statusKey = p.name ? String(p.name).toUpperCase() : "";
            const meta = STATUS_META_MAP[statusKey as keyof typeof STATUS_META_MAP];
            if (p.value === 0) return null;
            return (
              <p key={p.name} className="text-xs flex items-center justify-between gap-6" style={{ color: p.color }}>
                <span className="flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: p.color }} />
                  {meta?.label || p.name}
                </span>
                <span className="font-semibold text-white">{p.value}</span>
              </p>
            );
          })}
        </div>
      </div>
    );
  }
  return null;
};

const CustomModuleTooltip = ({ active, payload }: Partial<TooltipContentProps<number, string>>) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-lg border border-border bg-zinc-950/95 p-3 shadow-xl backdrop-blur-md">
        <p className="text-xs font-semibold text-zinc-400">
          Module: <span className="font-bold text-white text-sm">{payload[0].payload.module}</span>
        </p>
        <p className="text-xs text-zinc-400 mt-1">
          Logged Issues: <span className="font-bold text-white text-sm">{payload[0].value}</span>
        </p>
      </div>
    );
  }
  return null;
};

export function DashboardCharts({ metrics, loading = false }: DashboardChartsProps) {
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
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="border border-border/40 bg-zinc-950/20">
          <CardHeader>
            <Skeleton className="h-6 w-48 bg-zinc-800" />
            <Skeleton className="mt-2 h-4 w-72 bg-zinc-800" />
          </CardHeader>
          <CardContent className="h-[300px] flex items-center justify-center">
            <Skeleton className="h-48 w-48 rounded-full bg-zinc-800" />
          </CardContent>
        </Card>
        <Card className="border border-border/40 bg-zinc-950/20">
          <CardHeader>
            <Skeleton className="h-6 w-48 bg-zinc-800" />
            <Skeleton className="mt-2 h-4 w-72 bg-zinc-800" />
          </CardHeader>
          <CardContent className="h-[300px] flex items-center justify-center">
            <Skeleton className="h-48 w-[80%] bg-zinc-800" />
          </CardContent>
        </Card>
      </div>
    );
  }

  // Filter out status counts of 0 for pie chart to look cleaner
  const statusData = metrics.issuesPerStatus.filter((s) => s.count > 0);

  // Map module distribution for recharts
  const moduleData = metrics.moduleDistribution.slice(0, 5); // Show top 5 problematic modules

  // Map assignee data for stacked bar chart
  const assigneeData = metrics.issuesPerAssignee;

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
      {/* Chart 1: Status Distribution */}
      <Card className="border border-border/40 bg-zinc-950/20 backdrop-blur-md">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-white">Issues by Status</CardTitle>
          <CardDescription className="text-zinc-400">Proportional breakdown of issue states</CardDescription>
        </CardHeader>
        <CardContent className="h-[300px]">
          {statusData.length === 0 ? (
            <div className="h-full flex items-center justify-center text-zinc-500 text-sm">
              No issue data to visualize.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={65}
                  outerRadius={95}
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
                        strokeWidth={2}
                      />
                    );
                  })}
                </Pie>
                <ChartTooltip content={<CustomPieTooltip />} />
                <Legend
                  verticalAlign="bottom"
                  height={36}
                  iconType="circle"
                  iconSize={8}
                  formatter={(value: unknown, entry: LegendPayload) => {
                    const data = entry.payload as { status: string; count: number } | undefined;
                    if (!data) return null;
                    const meta = STATUS_META_MAP[data.status as keyof typeof STATUS_META_MAP];
                    return (
                      <span className="text-xs font-medium text-zinc-400 px-1">
                        {meta?.label || data.status} ({data.count})
                      </span>
                    );
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Chart 2: Developer Workload Distribution */}
      <Card className="border border-border/40 bg-zinc-950/20 backdrop-blur-md">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-white">Issues by Assignee</CardTitle>
          <CardDescription className="text-zinc-400">Workload and status breakdown per developer</CardDescription>
        </CardHeader>
        <CardContent className="h-[300px]">
          {assigneeData.length === 0 ? (
            <div className="h-full flex items-center justify-center text-zinc-500 text-sm">
              No assignee data found.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={assigneeData}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" vertical={false} />
                <XAxis
                  dataKey="assignee"
                  stroke="#71717a"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="#71717a"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  allowDecimals={false}
                />
                <ChartTooltip content={<CustomBarTooltip />} />
                <Bar
                  dataKey="todo"
                  name="Todo"
                  stackId="status"
                  fill={STATUS_META_MAP["TODO"].chartColor}
                  radius={[0, 0, 0, 0]}
                />
                <Bar
                  dataKey="inProgress"
                  name="In Progress"
                  stackId="status"
                  fill={STATUS_META_MAP["IN PROGRESS"].chartColor}
                  radius={[0, 0, 0, 0]}
                />
                <Bar
                  dataKey="inQa"
                  name="In QA"
                  stackId="status"
                  fill={STATUS_META_MAP["IN QA"].chartColor}
                  radius={[0, 0, 0, 0]}
                />
                <Bar
                  dataKey="fixed"
                  name="Fixed"
                  stackId="status"
                  fill={STATUS_META_MAP["FIXED"].chartColor}
                  radius={[0, 0, 0, 0]}
                />
                <Bar
                  dataKey="resolved"
                  name="Resolved"
                  stackId="status"
                  fill={STATUS_META_MAP["RESOLVED"].chartColor}
                  radius={[4, 4, 0, 0]} // Round the top of the stacked bar
                />
                <Bar
                  dataKey="notResolved"
                  name="Not Resolved"
                  stackId="status"
                  fill={STATUS_META_MAP["NOT RESOLVED"].chartColor}
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Chart 3: Module-wise Issue Distribution */}
      <Card className="border border-border/40 bg-zinc-950/20 backdrop-blur-md xl:col-span-2">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-white">Problem Areas by Module</CardTitle>
          <CardDescription className="text-zinc-400">Total issues logged across top modules</CardDescription>
        </CardHeader>
        <CardContent className="h-[250px]">
          {moduleData.length === 0 ? (
            <div className="h-full flex items-center justify-center text-zinc-500 text-sm">
              No module distribution data.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={moduleData}
                layout="vertical"
                margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" horizontal={false} />
                <XAxis type="number" stroke="#71717a" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis
                  dataKey="module"
                  type="category"
                  stroke="#71717a"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                />
                <ChartTooltip
                  cursor={{ fill: "#ffffff05" }}
                  content={<CustomModuleTooltip />}
                />
                <Bar dataKey="count" fill="url(#colorModule)" radius={[0, 4, 4, 0]}>
                  {/* Decorative Gradient */}
                  <defs>
                    <linearGradient id="colorModule" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.6} />
                    </linearGradient>
                  </defs>
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
