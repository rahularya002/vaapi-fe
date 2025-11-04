'use client'
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { useSession } from "next-auth/react";

export default function CreditsBadge() {
  const { data } = useSession();
  const email = data?.user?.email as string | undefined;
  const [credits, setCredits] = useState<number | null>(null);

  useEffect(() => {
    if (!email) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/credits?email=${encodeURIComponent(email)}`);
        const json = await res.json();
        if (!cancelled && res.ok) setCredits(json.credits);
      } catch {}
    })();
    return () => {
      cancelled = true;
    };
  }, [email]);

  if (!email) return null;

  return (
    <Badge variant={credits && credits > 0 ? 'default' : 'destructive'} title="Available call credits">
      {credits === null ? 'Credits: …' : `Credits: ${credits}`}
    </Badge>
  );
}


