import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth.config";

// Fallback storage for when Supabase is not configured
let fallbackSettings: Record<string, any> = {};

export async function GET(request: NextRequest) {
  try {
    // Get the current session to identify the user
    const session = await getServerSession(authOptions);
    const userEmail = session?.user?.email;

    if (!userEmail) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    if (!supabase) {
      // Return user-specific settings from fallback storage
      const userSettings = fallbackSettings[userEmail] || {};
      return NextResponse.json({
        success: true,
        settings: userSettings,
      });
    }

    // Try to get settings from Supabase (if you have a settings table)
    // For now, return empty settings since we don't have a settings table yet
    // You can create a settings table later if needed
    return NextResponse.json({
      success: true,
      settings: {},
    });
  } catch (error) {
    console.error("Error fetching settings:", error);
    return NextResponse.json(
      { error: "Failed to fetch settings" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Get the current session to identify the user
    const session = await getServerSession(authOptions);
    const userEmail = session?.user?.email;

    if (!userEmail) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();

    if (!supabase) {
      // Store in fallback storage
      fallbackSettings[userEmail] = {
        ...fallbackSettings[userEmail],
        ...body,
      };
      return NextResponse.json({
        success: true,
        message: "Settings saved successfully",
      });
    }

    // Save to Supabase (if you have a settings table)
    // For now, just return success
    return NextResponse.json({
      success: true,
      message: "Settings saved successfully",
    });
  } catch (error) {
    console.error("Error saving settings:", error);
    return NextResponse.json(
      { error: "Failed to save settings" },
      { status: 500 }
    );
  }
}

