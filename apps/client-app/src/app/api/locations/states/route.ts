import { NextResponse } from "next/server";
import prisma from "@repo/db/client";

export async function GET() {
	const states = await prisma.state.findMany({
		orderBy: { name: "asc" },
		select: { id: true, name: true },
	});
	return NextResponse.json({ ok: true, data: states });
}
