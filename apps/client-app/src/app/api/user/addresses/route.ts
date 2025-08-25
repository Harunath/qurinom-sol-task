import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth"; // your NextAuth config
import prisma from "@repo/db/client";
import { addressSchema } from "@/lib/validation/address";

export async function GET() {
	const session = await getServerSession(authOptions);
	if (!session?.user?.id)
		return NextResponse.json(
			{ ok: false, error: "Unauthenticated" },
			{ status: 401 }
		);

	const addresses = await prisma.address.findMany({
		where: { userId: session.user.id as string },
		orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
	});

	return NextResponse.json({ ok: true, data: addresses });
}

export async function POST(req: Request) {
	const session = await getServerSession(authOptions);
	if (!session?.user?.id)
		return NextResponse.json(
			{ ok: false, error: "Unauthenticated" },
			{ status: 401 }
		);

	const body = await req.json();
	const parsed = addressSchema.safeParse(body);
	if (!parsed.success) {
		return NextResponse.json(
			{ ok: false, errors: parsed.error.flatten().fieldErrors },
			{ status: 400 }
		);
	}
	const data = parsed.data;

	// If user has no addresses yet, force this one as default
	const existingCount = await prisma.address.count({
		where: { userId: session.user.id as string },
	});
	const isDefault = existingCount === 0 ? true : !!data.isDefault;

	// If setting default, unset others
	const tx = await prisma.$transaction(async (txp) => {
		if (isDefault) {
			await txp.address.updateMany({
				where: { userId: session.user.id as string, isDefault: true },
				data: { isDefault: false },
			});
		}
		const created = await txp.address.create({
			data: {
				userId: session.user.id as string,
				stateId: data.stateId,
				cityId: data.cityId,
				areaId: data.areaId,
				line1: data.addressLine1,
				line2: data.addressLine2 ?? null,
				pincode: data.pincode,
				isDefault,
			},
		});
		return created;
	});

	return NextResponse.json({ ok: true, data: tx }, { status: 201 });
}
