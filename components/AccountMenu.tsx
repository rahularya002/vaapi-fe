'use client'
import { useEffect, useMemo, useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { User as UserIcon } from "lucide-react";

export default function AccountMenu() {
  const { data } = useSession();
  const [open, setOpen] = useState(false);
  const name = data?.user?.name || undefined;
  const email = data?.user?.email || undefined;
  const [credits, setCredits] = useState<number | null>(null);

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

  const initials = useMemo(() => {
    const n = name || email || "?";
    const parts = n.replace(/@.+$/, "").split(/\s+/).filter(Boolean);
    const first = parts[0]?.[0] || "?";
    const second = parts.length > 1 ? parts[1][0] : "";
    return (first + second).toUpperCase();
  }, [name, email]);

  if (!email) {
    return (
      <a
        href="/login"
        className="inline-flex items-center px-3 py-2 text-sm rounded-md border hover:bg-accent"
        title="Sign in"
      >
        Sign in
      </a>
    );
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="inline-flex items-center justify-center h-10 w-10 rounded-full border hover:bg-accent"
        aria-label="Profile menu"
        aria-haspopup="true"
        aria-expanded={open}
      >
        <UserIcon className="h-5 w-5" />
      </button>
      {open && (
        <div className="fixed right-4 top-16 w-72 z-9999 rounded-md border bg-popover text-popover-foreground shadow-lg p-4 space-y-3">
          <div className="flex items-center gap-3">
            <div className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm">
              {initials}
            </div>
            <div className="text-sm">
              <div className="font-semibold">{name || "Signed in"}</div>
              {email && <div className="opacity-70">{email}</div>}
            </div>
          </div>
          <div className="text-sm opacity-80">{credits === null ? 'Credits: …' : `Credits: ${credits}`}</div>
          <div className="flex gap-2">
            <a href="/dashboard" className="text-sm underline">Dashboard</a>
            <button onClick={() => signOut({ callbackUrl: '/' })} className="ml-auto text-sm text-red-600 hover:underline">Sign out</button>
          </div>
        </div>
      )}
    </div>
  );
}


