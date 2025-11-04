import { NextRequest, NextResponse } from "next/server";
import { usersApi, creditsApi } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, name } = body;

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
    }

    // Check if user already exists
    const existingUser = await usersApi.getByEmail(email);
    if (existingUser) {
      return NextResponse.json({ error: "User with this email already exists" }, { status: 409 });
    }

    // Hash password (simple SHA256 for demo - use bcrypt in production)
    const crypto = await import('crypto');
    const passwordHash = crypto.createHash('sha256').update(password).digest('hex');

    // Create user
    const user = await usersApi.create({
      email,
      password_hash: passwordHash,
      name: name || email.split("@")[0]
    });

    // Initialize credits for new user
    try {
      await creditsApi.getOrInit(email);
    } catch (e) {
      console.error("Failed to initialize credits:", e);
    }

    return NextResponse.json({ 
      success: true, 
      user: { 
        id: user.id, 
        email: user.email, 
        name: user.name 
      },
      message: "User registered successfully" 
    });
  } catch (error: any) {
    console.error("Registration error:", error);
    return NextResponse.json({ error: error?.message || "Registration failed" }, { status: 500 });
  }
}

