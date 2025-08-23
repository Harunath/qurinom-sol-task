import { NextResponse } from "next/server";
import prisma from "@repo/db/client";

export async function GET(req: Request) {
	const { searchParams } = new URL(req.url);
	const cityId = searchParams.get("cityId");
	if (!cityId) {
		return NextResponse.json({ error: "cityId required" }, { status: 400 });
	}

	const areas = await prisma.area.findMany({
		where: { cityId },
		orderBy: { name: "asc" },
		select: { id: true, name: true, pincode: true, cityId: true },
	});
	return NextResponse.json({ areas });
}
