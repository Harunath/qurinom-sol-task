import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@repo/db/client";
import { profileSchema } from "@/lib/validation/merchantSignup";

export async function GET() {
	const session = await getServerSession(authOptions);
	if (!session?.user?.id) {
		return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });
	}

	const userId = session.user.id as string;

	// Adjust model/table name if yours differs
	const profile = await prisma.user.findUnique({
		where: { id: userId },
		select: {
			name: true,
			email: true,
			phone: true,
			role: true,
		},
	});

	return NextResponse.json({ profile: profile ?? {} });
}

export async function PATCH(req: Request) {
	const session = await getServerSession(authOptions);
	if (!session?.user?.id) {
		return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });
	}

	const body = await req.json();
	const parsed = profileSchema.safeParse(body);
	if (!parsed.success) {
		return NextResponse.json(
			{ error: "VALIDATION_ERROR", details: parsed.error.flatten() },
			{ status: 400 }
		);
	}

	const userId = session.user.id as string;
	const { name, email } = parsed.data;

	// If you also keep a unique email on User, add a uniqueness check here.
	const updated = await prisma.user.update({
		where: { id: userId },
		data: { name, email },
		select: {
			name: true,
			email: true,
		},
	});

	return NextResponse.json({
		profile: updated,
		next: "/merchant/register/business",
	});
}
