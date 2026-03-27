import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongoose";
import Inventory from "@/models/Inventory";
import { decrypt } from "@/lib/session";
import { cookies } from "next/headers";

export async function GET(request) {
  try {
    await connectToDatabase();

    // Check session
    const cookieStore = await cookies();
    const token = cookieStore.get("session")?.value;
    const session = await decrypt(token);

    if (!session || !session.id) {
      return NextResponse.json({ error: "Invalid session" }, { status: 401 });
    }

    // Role check: Employee, Admin, and Superadmin can see all (non-archived) inventory
    // Employees should only see non-archived ones.
    // If they are admin, maybe they want to see archived? 
    // But the request says "When showing inventory data to 'employee' filter out archived inventory"
    
    let query = { isArchived: { $ne: true } };

    // If we want to allow admins to see archived, we could add a query param.
    const { searchParams } = new URL(request.url);
    const showArchived = searchParams.get("showArchived") === "true";
    
    if (showArchived && (session.role === "admin" || session.role === "superadmin")) {
        delete query.isArchived;
    }

    const items = await Inventory.find(query).sort({ createdAt: -1 });

    return NextResponse.json({ 
      success: true, 
      data: items 
    }, { status: 200 });

  } catch (error) {
    console.error("All Inventory GET API Error:", error);
    return NextResponse.json({ 
      error: "Failed to fetch inventory data" 
    }, { status: 500 });
  }
}
