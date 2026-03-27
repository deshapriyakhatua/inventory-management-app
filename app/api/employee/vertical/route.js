import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongoose";
import Vertical from "@/models/Vertical";
import { decrypt } from "@/lib/session";
import { cookies } from "next/headers";

export async function GET() {
  try {
    await connectToDatabase();
    
    // Basic session check (proxy handles employee/admin roles for /api/employee)
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("session")?.value;
    if (!sessionCookie) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const session = await decrypt(sessionCookie);
    if (!session) return NextResponse.json({ error: "Invalid session" }, { status: 401 });

    const verticals = await Vertical.find({}).sort({ name: 1 });
    
    return NextResponse.json({ 
      success: true, 
      data: verticals.map(v => ({
        ...v.toObject(),
        verticalName: v.name,
        verticalShort: v.shortName
      }))
    }, { status: 200 });

  } catch (error) {
    console.error("Get Verticals API Error:", error);
    return NextResponse.json({ error: "Failed to fetch verticals" }, { status: 500 });
  }
}
