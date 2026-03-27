import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongoose";
import User from "@/models/User";
import bcrypt from "bcrypt";
import { createSession } from "@/lib/session";

export async function POST(req) {
  try {
    await connectToDatabase();
    const body = await req.json();
    const { email, username, password } = body;

    if ((!email && !username) || !password) {
      return NextResponse.json({ error: "Username/Email and password are required" }, { status: 400 });
    }

    // Find by email or username
    const user = await User.findOne({ 
      $or: [{ email }, { username: email || username }] 
    });

    if (!user) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    // Create session
    const payload = {
        id: user._id.toString(),
        role: user.role,
        name: user.name,
        email: user.email,
        username: user.username
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
