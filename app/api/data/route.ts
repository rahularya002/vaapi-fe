import { NextRequest, NextResponse } from "next/server";
import { dataApi, candidatesApi } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action") || "export";

    if (action === "export") {
      const data = await dataApi.exportData();
      return NextResponse.json({
        success: true,
        data,
        message: "Data exported successfully"
      });
    }

    if (action === "candidates") {
      const candidates = await candidatesApi.getAll();
      return NextResponse.json({
        success: true,
        candidates,
        message: "Candidates retrieved successfully"
      });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });

  } catch (error) {
    console.error("Error in data management:", error);
    return NextResponse.json(
      { error: "Failed to process data request" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, data, candidates } = body;

    switch (action) {
      case "import":
        if (!data) {
          return NextResponse.json(
            { error: "Data is required for import" },
            { status: 400 }
          );
        }
        
        await dataApi.importData(data);
        return NextResponse.json({
          success: true,
          message: "Data imported successfully"
        });

      case "create_candidate":
        const { candidate } = body;
        if (!candidate) {
          return NextResponse.json(
            { error: "Candidate data is required" },
            { status: 400 }
          );
        }
        
        const newCandidate = await candidatesApi.create(candidate);
        return NextResponse.json({
          success: true,
          candidate: newCandidate,
          message: "Candidate created successfully"
        });

      case "save_candidates":
        if (!candidates) {
          return NextResponse.json(
            { error: "Candidates data is required" },
            { status: 400 }
          );
        }
        
        await candidatesApi.createMany(candidates);
        return NextResponse.json({
          success: true,
          message: "Candidates saved successfully"
        });

      case "clear_all":
        await dataApi.clearAllData();
        return NextResponse.json({
          success: true,
          message: "All data cleared successfully"
        });

      case "delete_candidates":
        const { candidateIds } = body;
        if (!candidateIds || !Array.isArray(candidateIds) || candidateIds.length === 0) {
          return NextResponse.json(
            { error: "Candidate IDs are required" },
            { status: 400 }
          );
        }
        
        await candidatesApi.deleteMany(candidateIds);
        return NextResponse.json({
          success: true,
          message: `${candidateIds.length} candidate(s) deleted successfully`
        });

      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

  } catch (error) {
    console.error("Error in data management:", error);
    return NextResponse.json(
      { error: "Failed to process data request" },
      { status: 500 }
    );
  }
}
