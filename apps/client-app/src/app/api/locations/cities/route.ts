import { NextResponse } from "next/server";
import prisma from "@repo/db/client";

export async function GET(req: Request) {
	const { searchParams } = new URL(req.url);
	const stateId = searchParams.get("stateId");
	if (!stateId) {
		return NextResponse.json(
			{ ok: false, error: "stateId is required" },
			{ status: 400 }
		);
	}
	const cities = await prisma.city.findMany({
		where: { stateId },
		orderBy: { name: "asc" },
		select: { id: true, name: true },
	});
	return NextResponse.json({ ok: true, data: cities });
}
