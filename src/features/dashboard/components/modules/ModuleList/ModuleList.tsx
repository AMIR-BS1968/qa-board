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

// Generic Tooltip for module chart
const GenericTooltip = ({ active, payload, label, color }: any) => {
  if (active && payload && payload.length) {
    return (
      <div 
        className="rounded-xl border bg-zinc-950/95 px-3.5 py-2.5 shadow-xl backdrop-blur-md"
        style={{ borderColor: `${color}20` }}
      >
        <p className="text-xs font-bold text-white mb-1">{label}</p>
        <p className="text-xs font-semibold" style={{ color }}>
          Issues: <span className="font-extrabold text-white">{payload[0].value}</span>
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
  data: { module: string; count: number }[];
  dataKey: "count";
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
            className="h-2.5 w-2.5 rounded-full shrink-0 animate-pulse"
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
                    stroke="#d4d4d8"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    angle={-35}
                    textAnchor="end"
                    interval={0}
                  />
                  <YAxis
                    stroke="#d4d4d8"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    allowDecimals={false}
                    width={36}
                  />
                  <ChartTooltip
                    content={<GenericTooltip color={color} />}
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
  const [activeTab, setActiveTab] = useState<string>("");

  useEffect(() => {
    let active = true;
    Promise.resolve().then(() => {
      if (active) setMounted(true);
    });
    return () => { active = false; };
  }, []);

  // Get dynamic tabs list from computed metrics keys
  const tabsList = metrics.moduleDistribution.length > 0 
    ? Object.keys(metrics.moduleDistribution[0].byTab) 
    : [];

  // Sync active tab state
  useEffect(() => {
    if (tabsList.length > 0 && (!activeTab || !tabsList.includes(activeTab))) {
      setActiveTab(tabsList[0]);
    }
  }, [tabsList, activeTab]);

  if (loading || !mounted) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-48 bg-zinc-800/60 rounded-lg" />
        <Skeleton className="h-64 w-full bg-zinc-800/60 rounded-xl" />
      </div>
    );
  }

  // Filter and format data for active tab dynamically
  const activeTabData = metrics.moduleDistribution
    .map((m) => ({
      module: m.module,
      count: m.byTab[activeTab] || 0,
    }))
    .filter((m) => m.count > 0)
    .sort((a, b) => b.count - a.count);

  const activeTabIdx = tabsList.indexOf(activeTab);
  const colors = ["#818cf8", "#2dd4bf", "#f59e0b", "#a855f7", "#ec4899"];
  const color = colors[activeTabIdx !== -1 ? activeTabIdx % colors.length : 0];

  return (
    <div className="space-y-4">
      {/* Top sheet selector tabs */}
      {tabsList.length > 1 && (
        <div className="flex flex-wrap items-center gap-1.5 border-b border-zinc-900/40 pb-3">
          {tabsList.map((tab) => {
            const isActive = activeTab === tab;
            return (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer active:scale-[0.98] ${
                  isActive
                    ? "bg-blue-500/10 border border-blue-500/30 text-blue-400"
                    : "bg-zinc-950 border border-zinc-850 text-zinc-500 hover:text-zinc-300 hover:border-zinc-800"
                }`}
              >
                {tab}
              </button>
            );
          })}
        </div>
      )}

      {/* Render single chart */}
      {activeTab && (
        <ModuleBarChart
          data={activeTabData}
          dataKey="count"
          color={color}
          title={`${activeTab} — Issues by Module`}
          subtitle={`Issue count per module from the ${activeTab} sheet`}
        />
      )}
    </div>
  );
}
