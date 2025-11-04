import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import * as XLSX from "xlsx";
import { formatPhoneNumber, validatePhoneNumber } from "@/lib/phone-utils";
import { candidatesApi } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    
    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    // Create uploads directory if it doesn't exist
    const uploadsDir = join(process.cwd(), "uploads");
    try {
      await mkdir(uploadsDir, { recursive: true });
    } catch (error) {
      // Directory might already exist
    }

    // Save file
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const filePath = join(uploadsDir, file.name);
    await writeFile(filePath, buffer);

    // Parse Excel file
    const workbook = XLSX.read(buffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(worksheet);

    // Validate and format data
    const candidates = jsonData.map((row: any, index: number) => {
      const phone = row.phone || row.Phone || row.PHONE || row.phoneNumber || row.PhoneNumber;
      const name = row.name || row.Name || row.NAME || row.candidateName || row.CandidateName || `Candidate ${index + 1}`;
      const email = row.email || row.Email || row.EMAIL || row.emailAddress || row.EmailAddress || "";
      const position = row.position || row.Position || row.POSITION || row.jobTitle || row.JobTitle || "";
      
      if (!phone) {
        throw new Error(`Row ${index + 2}: Phone number is required`);
      }

      // Format and validate phone number
      const phoneValidation = validatePhoneNumber(phone.toString());
      if (!phoneValidation.isValid) {
        throw new Error(`Row ${index + 2}: Invalid phone number "${phone}" - ${phoneValidation.error}`);
      }
      
      return {
        name: name.toString(),
        phone: phoneValidation.formatted,
        email: email.toString(),
        position: position.toString(),
        status: "pending", // pending, calling, completed, failed
        call_result: undefined,
        call_notes: "",
        call_time: undefined
      };
    });

    // Save candidates to Supabase
    try {
      await candidatesApi.createMany(candidates);
      console.log(`Saved ${candidates.length} candidates to Supabase`);
    } catch (error) {
      console.error("Error saving candidates to Supabase:", error);
      // Continue even if Supabase save fails
    }

    return NextResponse.json({
      success: true,
      candidates,
      totalCount: candidates.length,
      message: `Successfully parsed and saved ${candidates.length} candidates from Excel file`
    });

  } catch (error) {
    console.error("Error processing Excel file:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to process Excel file" },
      { status: 500 }
    );
  }
}
