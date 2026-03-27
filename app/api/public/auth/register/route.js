import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongoose";
import User from "@/models/User";
import bcrypt from "bcrypt";

export async function POST(req) {
  try {
    await connectToDatabase();
    const body = await req.json();
    const { name, username, email, password } = body;

    if (!name || !username || !email || !password) {
      return NextResponse.json({ error: "All fields are required" }, { status: 400 });
    }

    const existingUser = await User.findOne({ 
      $or: [{ email }, { username }] 
    });

    if (existingUser) {
      return NextResponse.json({ error: "User already exists with that email or username" }, { status: 409 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Determine role: if first user, make them superadmin
    const userCount = await User.countDocuments();
    const role = userCount === 0 ? "superadmin" : "employee";

    const newUser = await User.create({
      name,
      username,
      email,
      password: hashedPassword,
      role
    });

    return NextResponse.json({ 
      message: "User registered successfully", 
      user: { id: newUser._id, name: newUser.name, email: newUser.email, role: newUser.role } 
    }, { status: 201 });

  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
