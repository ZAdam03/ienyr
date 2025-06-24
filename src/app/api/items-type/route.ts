import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const types = await prisma.item.findMany({
    distinct: ["type"],
    select: { type: true },
  });
  console.log("Types fetched:", types);

  // átalakítjuk a válaszformátumot az AutoComplete-hez
  const formatted = types
    .filter((t: { type: string | null }) => t.type !== null)
    .map((t: { type: any; }) => ({ label: t.type, value: t.type }));

  return NextResponse.json(formatted);
}
