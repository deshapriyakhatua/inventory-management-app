import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongoose";
import User from "@/models/User";
import bcrypt from "bcrypt";
import { createSession } from "@/lib/session";

export async function POST(req) {
  try {
    await connectToDatabase();
    const body = await req.json();
    const { phone, pin } = body;

    if (!phone || !pin) {
      return NextResponse.json({ error: "Phone and 4-digit PIN are required" }, { status: 400 });
    }

    // Find by phone
    const user = await User.findOne({ 
      phone: phone
    });

    if (!user) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    console.log("DEBUG: Login User Object Keys", { 
      keys: Object.keys(user.toObject ? user.toObject() : user),
      receivedPin: pin,
      userId: user._id 
    });

    const isMatch = await bcrypt.compare(pin, user.pin || user.password || "");

    if (!isMatch) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    // Create session
    const payload = {
        id: user._id.toString(),
        role: user.role,
        name: user.name,
        phone: user.phone,
    };

    await createSession(payload);

    return NextResponse.json({ 
      message: "Login successful", 
      user: payload
    }, { status: 200 });

  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
