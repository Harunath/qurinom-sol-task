// file: app/api/products/[id]/route.ts (PATCH update, GET single)
import { NextRequest, NextResponse } from "next/server";
import prisma from "@repo/db/client";

export async function GET(
	_: NextRequest,
	{ params }: { params: Promise<{ id: string }> }
) {
	const { id } = await params;
	const item = await prisma.product.findUnique({ where: { id } });
	if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });
	return NextResponse.json(item);
}
