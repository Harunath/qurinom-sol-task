import { NextResponse } from "next/server";
import { verifySchema } from "@/lib/validation/user";
import prisma, { Role } from "@repo/db/client";
// If you prefer to create a session cookie here, you can also import your NextAuth helpers.

export async function POST(req: Request) {
	try {
		const body = await req.json();
		const parsed = verifySchema.safeParse(body);
		if (!parsed.success) {
			return NextResponse.json(
				{ error: "VALIDATION_ERROR", details: parsed.error.flatten() },
				{ status: 400 }
			);
		}

		const { otpToken, otp } = parsed.data;

		const sess = await prisma.otpSession.findUnique({
			where: { id: otpToken },
		});
		if (!sess)
			return NextResponse.json({ error: "SESSION_NOT_FOUND" }, { status: 404 });
		if (sess.consumed)
			return NextResponse.json({ error: "SESSION_CONSUMED" }, { status: 400 });

		const now = new Date();
		if (sess.expiresAt.getTime() < now.getTime()) {
			return NextResponse.json({ error: "OTP_EXPIRED" }, { status: 400 });
		}

		// Increment attempts and check
		if (sess.attemptCount >= 5) {
			return NextResponse.json(
				{ error: "OTP_TOO_MANY_ATTEMPTS" },
				{ status: 429 }
			);
		}
		if (sess.otp !== otp) {
			await prisma.otpSession.update({
				where: { id: otpToken },
				data: { attemptCount: { increment: 1 } },
			});
			return NextResponse.json({ error: "OTP_INVALID" }, { status: 400 });
		}

		// Create user atomically; if phone got registered meanwhile, fail gracefully
		const created = await prisma.$transaction(async (tx) => {
			const existing = await tx.user.findFirst({
				where: { phone: sess.phone as string },
			});
			if (existing) return existing;

			return tx.user.create({
				data: {
					phone: sess.phone,
					hashedPassword: sess.passwordHash as string,
					phoneVerified: true,
					role: Role.USER,
				},
			});
		});

		// Consume session
		await prisma.otpSession.update({
			where: { id: otpToken },
			data: { consumed: true },
		});

		return NextResponse.json({
			userId: created.id,
			next: "/merchant/register/profile",
		});
	} catch (e) {
		console.error(e);
		return NextResponse.json({ error: "SERVER_ERROR" }, { status: 500 });
	}
}
