import { NextResponse } from "next/server";
import { getPublishedCategories } from "@/lib/categories";

export async function GET() {
  try {
    const categories = await getPublishedCategories();
    return NextResponse.json({ categories });
  } catch (error) {
    console.error("[categories] Failed to load:", error);
    return NextResponse.json({ categories: [{ id: "all", label: "All" }] });
  }
}
