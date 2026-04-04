"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Clock, CheckCircle2 } from "lucide-react";

interface DashboardStatsProps {
  stats: {
    totalReports: number;
    avgScore: number;
    lastAnalysis?: string;
    completedAnalyses: number;
  };
}

function formatLastAnalysis(value?: string): string {
  if (!value) return "None";
  const date = new Date(value);
  if (isNaN(date.getTime())) return value;
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const isYesterday = date.toDateString() === yesterday.toDateString();
  if (isToday) return "Today";
  if (isYesterday) return "Yesterday";
  return date.toLocaleDateString('en-US', { month: "short", day: "numeric" });
}

export function DashboardStats({ stats }: DashboardStatsProps) {
  const statCards = [
    {
      title: "Total Reports",
      value: stats.totalReports.toString(),
      icon: FileText,
      color: "text-slate-900 bg-white border-2 border-slate-900"
    },
    {
      title: "Last Analysis",
      value: formatLastAnalysis(stats.lastAnalysis),
      icon: Clock,
      color: "text-slate-900 bg-white border-2 border-slate-900"
    },
    {
      title: "Completed",
      value: stats.completedAnalyses.toString(),
      icon: CheckCircle2,
      color: "text-slate-900 bg-white border-2 border-slate-900"
    },
  ];

  return (
    <div className="grid gap-6 md:grid-cols-3 mb-8">
      {statCards.map((stat) => {
        const IconComponent = stat.icon;
        return (
          <Card key={stat.title} className="bg-white border-slate-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">
                {stat.title}
              </CardTitle>
              <div className={`p-2 rounded-lg ${stat.color}`}>
                <IconComponent className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">{stat.value}</div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}