"use client";

import { LayoutDashboard, Users, Phone, History, TrendingUp } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Candidate } from "@/lib/types";

interface DashboardSectionProps {
  candidates: Candidate[];
  callQueue: Candidate[];
  callHistory: Candidate[];
}

export function DashboardSection({
  candidates,
  callQueue,
  callHistory,
}: DashboardSectionProps) {
  const completedCalls = callHistory.filter(
    (c) => c.status === "completed" || c.success_evaluation === "pass"
  ).length;
  const totalCalls = callHistory.length;
  const successRate = totalCalls > 0 ? Math.round((completedCalls / totalCalls) * 100) : 0;

  const totalDuration = callHistory.reduce((sum, call) => sum + (call.call_duration || 0), 0);
  const avgDuration = totalCalls > 0 ? Math.round(totalDuration / totalCalls) : 0;

  const stats = [
    {
      title: "Total Leads",
      value: candidates.length,
      icon: Users,
      description: "All uploaded leads",
    },
    {
      title: "In Queue",
      value: callQueue.length,
      icon: Phone,
      description: "Calls pending",
    },
    {
      title: "Total Calls",
      value: totalCalls,
      icon: History,
      description: "All completed calls",
    },
    {
      title: "Success Rate",
      value: `${successRate}%`,
      icon: TrendingUp,
      description: `${completedCalls} successful`,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold mb-2">Dashboard Overview</h2>
        <p className="text-muted-foreground">
          Get a quick overview of your leads, campaigns, and call performance
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title} className="shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground mt-1">{stat.description}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Additional Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Call Performance</CardTitle>
            <CardDescription>Average call metrics</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Average Duration</span>
              <span className="text-sm font-medium">{avgDuration}s</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Total Duration</span>
              <span className="text-sm font-medium">
                {Math.floor(totalDuration / 60)}m {totalDuration % 60}s
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Quick Actions</CardTitle>
            <CardDescription>Common tasks</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground">
              Navigate to Leads to upload new contacts, or go to Campaigns to create a new campaign.
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

