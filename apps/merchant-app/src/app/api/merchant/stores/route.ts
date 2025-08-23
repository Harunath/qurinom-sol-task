import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@repo/db/client";
import { storeSchema } from "@/lib/validation/merchantSignup";

export async function POST(req: Request) {
	const session = await getServerSession(authOptions);
	if (!session?.user?.id) {
		return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });
	}
	const userId = session.user.id;

	const body = await req.json();
	const parsed = storeSchema.safeParse(body);
	if (!parsed.success) {
		return NextResponse.json(
			{ error: "VALIDATION_ERROR", details: parsed.error.flatten() },
			{ status: 400 }
		);
	}

	const {
		name,
		cityId,
		areaId,
		addressLine1,
		addressLine2,
		pincode,
		phone,
		description,
		storeImage,
		geo,
	} = parsed.data;

	// 1) Validate city & area
	const [city, area] = await Promise.all([
		prisma.city.findUnique({
			where: { id: cityId },
			select: { id: true, name: true },
		}),
		prisma.area.findUnique({
			where: { id: areaId },
			select: { id: true, name: true, cityId: true, pincode: true },
		}),
	]);
	if (!city)
		return NextResponse.json({ error: "CITY_NOT_FOUND" }, { status: 404 });
	if (!area)
		return NextResponse.json({ error: "AREA_NOT_FOUND" }, { status: 404 });
	if (area.cityId !== city.id) {
		return NextResponse.json({ error: "AREA_NOT_IN_CITY" }, { status: 400 });
	}

	// 2) Decide pincode (prefer user input, else area.pincode)
	const finalPincode = pincode ?? area.pincode ?? "";
	if (!finalPincode) {
		return NextResponse.json({ error: "PINCODE_REQUIRED" }, { status: 400 });
	}

	// 3) Create store
	const created = await prisma.store.create({
		data: {
			merchantId: userId,
			name,
			description: description ?? null,
			phone: phone ?? session.user.phone ?? null,
			storeImage: storeImage ?? null,
			addressLine1,
			addressLine2: addressLine2 ?? null,
			areaId: area.id, // relation
			city: city.name, // Store stores city name (string)
			pincode: finalPincode,
			lat: geo?.lat ?? null,
			lng: geo?.lng ?? null,
			// state, country left null/default if you don’t have them yet
		},
		select: { id: true },
	});

	return NextResponse.json({
		storeId: created.id,
		next: "/merchant/register/done",
	});
}
