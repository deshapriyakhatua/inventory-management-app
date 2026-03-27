import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongoose";
import User from "@/models/User";
import bcrypt from "bcrypt";

export async function POST(req) {
  try {
    await connectToDatabase();
    const body = await req.json();
    const { name, phone, pin } = body;

    if (!name || !phone || !pin) {
      return NextResponse.json({ error: "All fields are required" }, { status: 400 });
    }

    console.log("DEBUG: Registering User", { name, phone, pinReceived: !!pin });

    if (!/^\d{4}$/.test(pin)) {
      return NextResponse.json({ error: "PIN must be exactly 4 digits" }, { status: 400 });
    }

    const existingUser = await User.findOne({ 
      phone: phone
    });

    if (existingUser) {
      return NextResponse.json({ error: "User already exists with that phone number" }, { status: 409 });
    }

    const hashedPin = await bcrypt.hash(pin, 10);
    
    // Determine role: if first user, make them superadmin
    const userCount = await User.countDocuments();
    const role = userCount === 0 ? "superadmin" : "employee";

    const newUser = await User.create({
      name,
      phone,
      pin: hashedPin,
      role
    });

    return NextResponse.json({ 
      message: "User registered successfully", 
      user: { id: newUser._id, name: newUser.name, phone: newUser.phone, role: newUser.role } 
    }, { status: 201 });

  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
