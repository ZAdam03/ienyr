import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const brands = await prisma.model.findMany({
    distinct: ["brand"],
    select: { brand: true },
  });
  console.log("Types fetched:", brands);

  // átalakítjuk a válaszformátumot az AutoComplete-hez
  const formatted = brands
    .filter((t: { brand: string | null }) => t.brand !== null) //kizárjuk a null értékeket
    .map((t: { brand: any; }) => ({ label: t.brand, value: t.brand })); // AutoComplete formátum

    console.log("Formatted types for AutoComplete:", formatted);
  return NextResponse.json(formatted);
}
