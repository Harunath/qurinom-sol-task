import { NextResponse } from "next/server";
import prisma from "@repo/db/client";

export async function GET() {
	const cities = await prisma.city.findMany({
		orderBy: { name: "asc" },
		select: { id: true, name: true, stateId: true },
	});
	return NextResponse.json({ cities });
}
