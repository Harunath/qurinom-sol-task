import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@repo/db/client";
import { addressSchema } from "@/lib/validation/address";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, { params }: Params) {
	const { id } = await params;
	const session = await getServerSession(authOptions);
	if (!session?.user?.id)
		return NextResponse.json(
			{ ok: false, error: "Unauthenticated" },
			{ status: 401 }
		);

	const body = await req.json();
	const parsed = addressSchema.partial().safeParse(body); // partial update
	if (!parsed.success) {
		return NextResponse.json(
			{ ok: false, errors: parsed.error.flatten().fieldErrors },
			{ status: 400 }
		);
	}
	const data = parsed.data;

	// handle default switch
	if (data.isDefault) {
		await prisma.address.updateMany({
			where: { userId: session.user.id as string, isDefault: true },
			data: { isDefault: false },
		});
	}

	const updated = await prisma.address.update({
		where: { id },
		data: {
			...(data.stateId && { stateId: data.stateId }),
			...(data.cityId && { cityId: data.cityId }),
			...(data.areaId && { areaId: data.areaId }),
			...(data.addressLine1 !== undefined && {
				addressLine1: data.addressLine1,
			}),
			...(data.addressLine2 !== undefined && {
				addressLine2: data.addressLine2 ?? null,
			}),
			...(data.pincode !== undefined && { pincode: data.pincode }),
			...(data.isDefault !== undefined && { isDefault: !!data.isDefault }),
		},
	});

	return NextResponse.json({ ok: true, data: updated });
}

export async function DELETE(_req: Request, { params }: Params) {
	const { id } = await params;
	const session = await getServerSession(authOptions);
	if (!session?.user?.id)
		return NextResponse.json(
			{ ok: false, error: "Unauthenticated" },
			{ status: 401 }
		);

	// Optional: prevent deleting the only default address
	const addr = await prisma.address.findUnique({ where: { id } });
	if (!addr || addr.userId !== session.user.id) {
		return NextResponse.json(
			{ ok: false, error: "Not found" },
			{ status: 404 }
		);
	}

	await prisma.address.delete({ where: { id } });
	return NextResponse.json({ ok: true });
}
