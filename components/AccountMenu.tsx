'use client'
import { useEffect, useMemo, useState, useRef } from "react";
import { createPortal } from "react-dom";
import { useSession, signOut } from "next-auth/react";
import { LogOut, LayoutDashboard, Coins } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

export default function AccountMenu() {
  const { data, status } = useSession();
  const [open, setOpen] = useState(false);
  const [credits, setCredits] = useState<number | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [dropdownPosition, setDropdownPosition] = useState<{ top: number; right: number } | null>(null);
  const name = data?.user?.name || undefined;
  const email = data?.user?.email || undefined;

  useEffect(() => {
    if (!email || !open) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/credits?email=${encodeURIComponent(email)}`);
        const json = await res.json();
        if (!cancelled && res.ok) setCredits(json.credits);
      } catch {}
    })();
    return () => { cancelled = true; };
  }, [email, open]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        dropdownRef.current && 
        buttonRef.current &&
        !dropdownRef.current.contains(target) &&
        !buttonRef.current.contains(target)
      ) {
        setOpen(false);
      }
    };

    if (open) {
      // Calculate dropdown position based on button position
      if (buttonRef.current) {
        const rect = buttonRef.current.getBoundingClientRect();
        setDropdownPosition({
          top: rect.bottom + 8,
          right: window.innerWidth - rect.right,
        });
      }
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      setDropdownPosition(null);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [open]);

  const initials = useMemo(() => {
    const n = name || email || "?";
    const parts = n.replace(/@.+$/, "").split(/\s+/).filter(Boolean);
    const first = parts[0]?.[0] || "?";
    const second = parts.length > 1 ? parts[1][0] : "";
    return (first + second).toUpperCase();
  }, [name, email]);

  // Show loading state while session is being fetched
  if (status === "loading") {
    return (
      <div className="inline-flex items-center justify-center h-9 rounded-md border border-input bg-background px-3 text-sm font-medium">
        <span className="animate-pulse">...</span>
      </div>
    );
  }

  if (!email) {
    return (
      <a
        href="/login"
        className="inline-flex items-center justify-center h-9 rounded-md border border-input bg-background px-3 text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors"
      >
        Sign in
      </a>
    );
  }

  const dropdownContent = open && dropdownPosition && (
    <div
      ref={dropdownRef}
      className="fixed w-80 rounded-lg border bg-popover text-popover-foreground shadow-lg z-[100] animate-in fade-in-0 zoom-in-95 slide-in-from-top-2"
      style={{
        top: `${dropdownPosition.top}px`,
        right: `${dropdownPosition.right}px`,
      }}
    >
          <div className="p-4 space-y-4">
            {/* User Info Section */}
            <div className="flex items-center gap-3">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground text-base font-semibold">
                {initials}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-sm truncate">{name || "Signed in"}</div>
                <div className="text-xs text-muted-foreground truncate">{email}</div>
              </div>
            </div>

            <Separator />

            {/* Credits Section */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <div className="flex items-center gap-2">
                <Coins className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Credits</span>
              </div>
              <span className="text-sm font-semibold">
                {credits === null ? '…' : credits}
              </span>
            </div>

            <Separator />

            {/* Actions Section */}
            <div className="space-y-1">
              <a
                href="/dashboard"
                onClick={() => setOpen(false)}
                className="flex items-center w-full h-9 px-3 rounded-md text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors"
              >
                <LayoutDashboard className="h-4 w-4 mr-2" />
                Dashboard
              </a>
              <button
                className="flex items-center w-full h-9 px-3 rounded-md text-sm font-medium text-destructive hover:text-destructive hover:bg-destructive/10 transition-colors"
                onClick={() => {
                  signOut({ callbackUrl: '/' });
                  setOpen(false);
                }}
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sign out
              </button>
            </div>
          </div>
        </div>
  );

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen(v => !v)}
        className={cn(
          "inline-flex items-center justify-center h-10 w-10 rounded-full border bg-background hover:bg-accent transition-colors",
          open && "bg-accent"
        )}
        aria-label="Profile menu"
        aria-haspopup="true"
        aria-expanded={open}
      >
        <div className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-medium">
          {initials}
        </div>
      </button>
      
      {typeof window !== 'undefined' && dropdownContent && createPortal(dropdownContent, document.body)}
    </div>
  );
}
