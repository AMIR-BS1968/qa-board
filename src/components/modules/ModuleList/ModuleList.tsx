"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { DashboardMetrics } from "@/features/dashboard/types";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as ChartTooltip,
  ResponsiveContainer,
  TooltipContentProps,
} from "recharts";

interface ModuleChartsProps {
  metrics: DashboardMetrics;
  loading?: boolean;
}

// Tooltip for App chart
const AppTooltip = ({ active, payload, label }: Partial<TooltipContentProps<number, string>>) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-lg border border-indigo-500/20 bg-zinc-950/95 px-3 py-2 shadow-xl backdrop-blur-md">
        <p className="text-xs font-semibold text-white mb-1">{label}</p>
        <p className="text-xs text-indigo-400">
          App Issues: <span className="font-bold text-white">{payload[0].value}</span>
        </p>
      </div>
    );
  }
  return null;
};

// Tooltip for Admin chart
const AdminTooltip = ({ active, payload, label }: Partial<TooltipContentProps<number, string>>) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-lg border border-teal-500/20 bg-zinc-950/95 px-3 py-2 shadow-xl backdrop-blur-md">
        <p className="text-xs font-semibold text-white mb-1">{label}</p>
        <p className="text-xs text-teal-400">
          Admin Issues: <span className="font-bold text-white">{payload[0].value}</span>
        </p>
      </div>
    );
  }
  return null;
};

function ModuleBarChart({
  data,
  dataKey,
  color,
  title,
  subtitle,
}: {
  data: { module: string; app: number; admin: number }[];
  dataKey: "app" | "admin";
  color: string;
  title: string;
  subtitle: string;
}) {
  // Each bar = 64px wide, plus padding
  const BAR_WIDTH = 64;
  const MIN_CHART_WIDTH = Math.max(data.length * BAR_WIDTH, 400);

  return (
    <Card className="border border-border/30 bg-zinc-900/30 flex-1 min-w-0">
      <CardHeader className="pb-2 px-4 pt-4">
        <CardTitle className="text-sm font-semibold text-white flex items-center gap-2">
          <span
            className="h-2.5 w-2.5 rounded-full shrink-0"
            style={{ backgroundColor: color }}
          />
          {title}
        </CardTitle>
        <p className="text-xs text-zinc-500">{subtitle}</p>
      </CardHeader>
      <CardContent className="px-4 pb-4 pt-0">
        {data.length === 0 ? (
          <div className="flex h-[220px] items-center justify-center text-xs text-zinc-500">
            No data
          </div>
        ) : (
          <div className="overflow-x-auto">
            <div style={{ width: MIN_CHART_WIDTH, minWidth: "100%" }}>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart
                  data={data}
                  margin={{ top: 12, right: 16, left: -28, bottom: 40 }}
                  barCategoryGap="35%"
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#ffffff08"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="module"
                    stroke="#52525b"
                    fontSize={10}
                    tickLine={false}
                    axisLine={false}
                    angle={-35}
                    textAnchor="end"
                    interval={0}
                  />
                  <YAxis
                    stroke="#52525b"
                    fontSize={10}
                    tickLine={false}
                    axisLine={false}
                    allowDecimals={false}
                    width={36}
                  />
                  <ChartTooltip
                    content={dataKey === "app" ? <AppTooltip /> : <AdminTooltip />}
                    cursor={{ fill: "rgba(255,255,255,0.03)" }}
                  />
                  <Bar
                    dataKey={dataKey}
                    fill={color}
                    radius={[4, 4, 0, 0]}
                    maxBarSize={48}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function ModuleCharts({ metrics, loading = false }: ModuleChartsProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    let active = true;
    Promise.resolve().then(() => {
      if (active) setMounted(true);
    });
    return () => { active = false; };
  }, []);

  if (loading || !mounted) {
    return (
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <Skeleton className="h-64 w-full bg-zinc-800/60 rounded-xl" />
        <Skeleton className="h-64 w-full bg-zinc-800/60 rounded-xl" />
      </div>
    );
  }

  // Sort by count per source for better readability
  const appData = [...metrics.moduleDistribution]
    .filter((m) => m.app > 0)
    .sort((a, b) => b.app - a.app);

  const adminData = [...metrics.moduleDistribution]
    .filter((m) => m.admin > 0)
    .sort((a, b) => b.admin - a.admin);

  return (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
      <ModuleBarChart
        data={appData}
        dataKey="app"
        color="#818cf8"
        title="App — Issues by Module"
        subtitle="Issue count per module from the App sheet"
      />
      <ModuleBarChart
        data={adminData}
        dataKey="admin"
        color="#2dd4bf"
        title="Admin — Issues by Module"
        subtitle="Issue count per module from the Admin sheet"
      />
    </div>
  );
}
