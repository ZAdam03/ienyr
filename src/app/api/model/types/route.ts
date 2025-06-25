import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const types = await prisma.model.findMany({
    distinct: ["type"],
    select: { type: true },
  });
  console.log("Types fetched:", types);

  // átalakítjuk a válaszformátumot az AutoComplete-hez
  const formatted = types
    .filter((t: { type: string | null }) => t.type !== null) //kizárjuk a null értékeket
    .map((t: { type: any; }) => ({ label: t.type, value: t.type })); // AutoComplete formátum

    console.log("Formatted types for AutoComplete:", formatted);
  return NextResponse.json(formatted);
}
