import { NextRequest, NextResponse } from "next/server";
import prisma from "@repo/db/client";

export async function GET(req: NextRequest) {
	const { searchParams } = new URL(req.url);
	const categoryId = searchParams.get("categoryId");
	if (!categoryId) return NextResponse.json({ items: [] });

	const items = await prisma.category.findMany({
		where: { parentId: categoryId },
		orderBy: { name: "asc" },
		select: { id: true, name: true },
	});
	return NextResponse.json({ items });
}
