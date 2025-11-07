import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// Campaign interface
export interface Campaign {
  id?: number;
  name: string;
  industry: string;
  goal: string;
  openingScript: string;
  localizeTone: boolean;
  complianceCheck: boolean;
  cadence: boolean;
  quality: boolean;
  created_at?: string;
  updated_at?: string;
}

// Fallback storage for when Supabase is not configured
let fallbackCampaigns: Campaign[] = [];

export async function GET(request: NextRequest) {
  try {
    if (!supabase) {
      return NextResponse.json({
        success: true,
        campaigns: fallbackCampaigns,
      });
    }

    const { data, error } = await supabase
      .from('campaigns')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error("Error fetching campaigns:", error);
      // Fallback to memory storage if Supabase query fails
      return NextResponse.json({
        success: true,
        campaigns: fallbackCampaigns,
      });
    }

    return NextResponse.json({
      success: true,
      campaigns: data || [],
    });
  } catch (error) {
    console.error("Error in campaigns GET:", error);
    return NextResponse.json(
      { error: "Failed to fetch campaigns" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      name,
      industry,
      goal,
      openingScript,
      localizeTone,
      complianceCheck,
      cadence,
      quality,
    } = body;

    // Validate required fields
    const errors: Record<string, string> = {};
    if (!name || !name.trim()) {
      errors.name = "Campaign name is required";
    }
    if (!industry) {
      errors.industry = "Industry is required";
    }
    if (!goal) {
      errors.goal = "Goal is required";
    }
    if (!openingScript || !openingScript.trim()) {
      errors.openingScript = "Opening script is required";
    }

    if (Object.keys(errors).length > 0) {
      return NextResponse.json(
        { error: "Validation failed", errors },
        { status: 422 }
      );
    }

    const campaign: Omit<Campaign, 'id' | 'created_at' | 'updated_at'> = {
      name,
      industry,
      goal,
      openingScript,
      localizeTone: localizeTone || false,
      complianceCheck: complianceCheck !== undefined ? complianceCheck : true,
      cadence: cadence || false,
      quality: quality !== undefined ? quality : true,
    };

    // Check for duplicate name (in memory or DB)
    if (!supabase) {
      const duplicate = fallbackCampaigns.find(
        (c) => c.name.toLowerCase().trim() === name.toLowerCase().trim()
      );
      if (duplicate) {
        return NextResponse.json(
          { error: `Campaign with name "${name}" already exists` },
          { status: 409 }
        );
      }
    } else {
      // Check for duplicate in Supabase
      try {
        const { data: existing } = await supabase
          .from('campaigns')
          .select('id, name')
          .eq('name', name.trim())
          .limit(1);
        
        if (existing && existing.length > 0) {
          return NextResponse.json(
            { error: `Campaign with name "${name}" already exists` },
            { status: 409 }
          );
        }
      } catch (error) {
        // If check fails, continue with creation
        console.error("Error checking for duplicate:", error);
      }
    }

    if (!supabase) {
      // Fallback to memory storage
      const newCampaign: Campaign = {
        ...campaign,
        id: fallbackCampaigns.length + 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      fallbackCampaigns.push(newCampaign);
      return NextResponse.json({
        success: true,
        campaign: newCampaign,
        message: "Campaign created successfully",
      });
    }

    // Try to insert into Supabase
    try {
      const { data, error } = await supabase
        .from('campaigns')
        .insert([{
          name: campaign.name,
          industry: campaign.industry,
          goal: campaign.goal,
          opening_script: campaign.openingScript,
          localize_tone: campaign.localizeTone,
          compliance_check: campaign.complianceCheck,
          cadence: campaign.cadence,
          quality: campaign.quality,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }])
        .select()
        .single();

      if (error) {
        console.error("Error inserting campaign:", error);
        // Fallback to memory storage if Supabase insert fails
        const newCampaign: Campaign = {
          ...campaign,
          id: fallbackCampaigns.length + 1,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        fallbackCampaigns.push(newCampaign);
        return NextResponse.json({
          success: true,
          campaign: newCampaign,
          message: "Campaign created successfully (stored locally)",
        });
      }

      // Map Supabase response back to our interface
      const mappedCampaign: Campaign = {
        id: data.id,
        name: data.name,
        industry: data.industry,
        goal: data.goal,
        openingScript: data.opening_script,
        localizeTone: data.localize_tone,
        complianceCheck: data.compliance_check,
        cadence: data.cadence,
        quality: data.quality,
        created_at: data.created_at,
        updated_at: data.updated_at,
      };

      return NextResponse.json({
        success: true,
        campaign: mappedCampaign,
        message: "Campaign created successfully",
      });
    } catch (error) {
      console.error("Error in Supabase insert:", error);
      // Fallback to memory storage
      const newCampaign: Campaign = {
        ...campaign,
        id: fallbackCampaigns.length + 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      fallbackCampaigns.push(newCampaign);
      return NextResponse.json({
        success: true,
        campaign: newCampaign,
        message: "Campaign created successfully (stored locally)",
      });
    }
  } catch (error) {
    console.error("Error in campaigns POST:", error);
    return NextResponse.json(
      { error: "Failed to create campaign" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { campaignIds } = body;

    if (!campaignIds || !Array.isArray(campaignIds) || campaignIds.length === 0) {
      return NextResponse.json(
        { error: "Campaign IDs are required" },
        { status: 400 }
      );
    }

    if (!supabase) {
      // Fallback to memory storage
      fallbackCampaigns = fallbackCampaigns.filter(
        (c) => !campaignIds.includes(c.id)
      );
      return NextResponse.json({
        success: true,
        message: `${campaignIds.length} campaign(s) deleted successfully`,
      });
    }

    // Delete from Supabase
    const { error } = await supabase
      .from('campaigns')
      .delete()
      .in('id', campaignIds);

    if (error) {
      console.error("Error deleting campaigns:", error);
      return NextResponse.json(
        { error: "Failed to delete campaigns" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `${campaignIds.length} campaign(s) deleted successfully`,
    });
  } catch (error) {
    console.error("Error in campaigns DELETE:", error);
    return NextResponse.json(
      { error: "Failed to delete campaigns" },
      { status: 500 }
    );
  }
}

