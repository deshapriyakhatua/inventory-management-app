import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongoose";
import Vertical from "@/models/Vertical";
import { decrypt } from "@/lib/session";
import { cookies } from "next/headers";

export async function POST(request) {
  try {
    await connectToDatabase();

    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("session")?.value;
    if (!sessionCookie) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const session = await decrypt(sessionCookie);
    if (!session || (session.role !== 'admin' && session.role !== 'superadmin')) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { name, shortName } = await request.json();

    if (!name || !shortName) {
      return NextResponse.json({ error: "Name and Short Name are required" }, { status: 400 });
    }

    const newVertical = await Vertical.create({
      name,
      shortName: shortName.toUpperCase(),
      addedBy: session.id
    });

    return NextResponse.json({ 
      success: true, 
      message: "Vertical added successfully",
      data: newVertical 
    }, { status: 201 });

  } catch (error) {
    if (error.code === 11000) {
        return NextResponse.json({ error: "Vertical name or Short Name already exists" }, { status: 400 });
    }
    console.error("Add Vertical API Error:", error);
    return NextResponse.json({ error: "Failed to add vertical" }, { status: 500 });
  }
}

export async function GET() {
  try {
    await connectToDatabase();
    // No strict admin check for GET, as it might be needed for Add Inventory page
    const verticals = await Vertical.find({}).sort({ name: 1 });
    return NextResponse.json({ success: true, data: verticals }, { status: 200 });
  } catch (error) {
    console.error("Get Verticals API Error:", error);
    return NextResponse.json({ error: "Failed to fetch verticals" }, { status: 500 });
  }
}
