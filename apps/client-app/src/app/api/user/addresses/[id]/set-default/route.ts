import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@repo/db/client";

type Params = { params: Promise<{ id: string }> };

export async function POST(_req: Request, { params }: Params) {
	const session = await getServerSession(authOptions);
	if (!session?.user?.id)
		return NextResponse.json(
			{ ok: false, error: "Unauthenticated" },
			{ status: 401 }
		);

	const { id } = await params;

	const target = await prisma.address.findUnique({ where: { id } });
	if (!target || target.userId !== session.user.id) {
		return NextResponse.json(
			{ ok: false, error: "Not found" },
			{ status: 404 }
		);
	}

	await prisma.$transaction([
		prisma.address.updateMany({
			where: { userId: session.user.id as string, isDefault: true },
			data: { isDefault: false },
		}),
		prisma.address.update({ where: { id }, data: { isDefault: true } }),
	]);

	return NextResponse.json({ ok: true });
}
