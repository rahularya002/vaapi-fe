import { NextRequest, NextResponse } from "next/server";
import { creditsApi } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const email = searchParams.get("email") || "";
  if (!email) return NextResponse.json({ error: "email required" }, { status: 400 });
  
  try {
    const credits = await creditsApi.getOrInit(email);
    return NextResponse.json({ success: true, credits: credits.credits });
  } catch (e: any) {
    console.error("Credits GET error:", e);
    return NextResponse.json({ 
      error: e?.message || 'failed', 
      details: process.env.NODE_ENV === 'development' ? String(e) : undefined 
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const action = body?.action as string;
    const email = (body?.email as string) || "";
    const amount = Number(body?.amount ?? 1);
    if (!email) return NextResponse.json({ error: "email required" }, { status: 400 });

    if (action === 'consume') {
      try {
        const credits = await creditsApi.consume(email, amount);
        return NextResponse.json({ success: true, credits: credits.credits });
      } catch (e: any) {
        if (e?.message === 'INSUFFICIENT_CREDITS') {
          return NextResponse.json({ success: false, error: 'INSUFFICIENT_CREDITS' }, { status: 402 });
        }
        throw e;
      }
    }

    return NextResponse.json({ error: 'invalid action' }, { status: 400 });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'failed' }, { status: 500 });
  }
}


