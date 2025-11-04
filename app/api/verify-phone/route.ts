import { NextRequest, NextResponse } from "next/server";
import twilio from "twilio";
import { formatPhoneNumber, validatePhoneNumber } from "@/lib/phone-utils";

const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;

// Initialize Twilio client only when needed
const getTwilioClient = () => {
  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN) {
    throw new Error("Twilio credentials not configured");
  }
  return twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { phoneNumber } = body;

    if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN) {
      return NextResponse.json(
        { error: "Twilio credentials not configured" },
        { status: 500 }
      );
    }

    if (!phoneNumber) {
      return NextResponse.json(
        { error: "Phone number is required" },
        { status: 400 }
      );
    }

    // Format and validate phone number for E.164 format
    const phoneValidation = validatePhoneNumber(phoneNumber);
    if (!phoneValidation.isValid) {
      return NextResponse.json(
        { 
          error: `Invalid phone number: ${phoneValidation.error}`,
          formatted: phoneValidation.formatted,
          original: phoneNumber
        },
        { status: 400 }
      );
    }

    const formattedPhone = phoneValidation.formatted;

    // Check if the phone number is verified in Twilio
    const client = getTwilioClient();
    
    try {
      // Try to get the phone number from Twilio's verified caller IDs
      const verifiedNumbers = await client.outgoingCallerIds.list();
      const isVerified = verifiedNumbers.some(number => number.phoneNumber === formattedPhone);
      
      return NextResponse.json({
        success: true,
        phoneNumber: formattedPhone,
        isVerified,
        message: isVerified 
          ? "Phone number is verified and can receive calls"
          : "Phone number is not verified. Please verify it in your Twilio console.",
        verificationUrl: "https://console.twilio.com/us1/develop/phone-numbers/manage/verified"
      });

    } catch (twilioError: any) {
      console.error("Error checking phone verification:", twilioError);
      
      // If we can't check verification status, provide helpful information
      return NextResponse.json({
        success: false,
        phoneNumber: formattedPhone,
        isVerified: false,
        message: "Could not verify phone number status",
        error: twilioError.message,
        suggestion: "Please verify the phone number manually in your Twilio console"
      });
    }

  } catch (error: any) {
    console.error("Error verifying phone number:", error);
    return NextResponse.json(
      { error: "Failed to verify phone number" },
      { status: 500 }
    );
  }
}

// Get list of verified phone numbers
export async function GET(request: NextRequest) {
  try {
    if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN) {
      return NextResponse.json(
        { error: "Twilio credentials not configured" },
        { status: 500 }
      );
    }

    const client = getTwilioClient();
    const verifiedNumbers = await client.outgoingCallerIds.list();

    return NextResponse.json({
      success: true,
      verifiedNumbers: verifiedNumbers.map(number => ({
        phoneNumber: number.phoneNumber,
        friendlyName: number.friendlyName,
        dateCreated: number.dateCreated,
        dateUpdated: number.dateUpdated
      })),
      count: verifiedNumbers.length
    });

  } catch (error: any) {
    console.error("Error getting verified numbers:", error);
    return NextResponse.json(
      { error: "Failed to get verified numbers" },
      { status: 500 }
    );
  }
}
