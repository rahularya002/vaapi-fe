"use client";

import AccountMenu from "@/components/AccountMenu";

interface TopBarProps {
  sectionName: string;
}

export function TopBar({ sectionName }: TopBarProps) {
  return (
    <div className="h-16 border-b bg-card flex items-center justify-between px-6">
      <h1 className="text-xl font-semibold">{sectionName}</h1>
      <AccountMenu />
    </div>
  );
}

