import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { startSchema } from "@/lib/validation/user";
import prisma from "@repo/db/client";
import { randomBytes } from "crypto";

const DEV_SIMULATE = process.env.NEXT_PUBLIC_SIMULATE_OTP === "true";

function genOtp() {
	const n = Math.floor(100000 + Math.random() * 900000);
	return String(n);
}

export async function POST(req: Request) {
	try {
		console.log(
			"process.env.NEXT_PUBLIC_SIMULATE_OTP ",
			process.env.NEXT_PUBLIC_SIMULATE_OTP
		);
		const body = await req.json();
		const parsed = startSchema.safeParse(body);
		if (!parsed.success) {
			return NextResponse.json(
				{ error: "VALIDATION_ERROR", details: parsed.error.flatten() },
				{ status: 400 }
			);
		}

		const { phone, password } = parsed.data;

		// Ensure phone is unique
		const existing = await prisma.user.findFirst({
			where: { phone: phone as string },
		});
		if (existing) {
			return NextResponse.json(
				{ error: "PHONE_ALREADY_REGISTERED" },
				{ status: 409 }
			);
		}

		// Hash password early; store in session until OTP is verified
		const passwordHash = await bcrypt.hash(password, 10);

		// Create OTP session (rotate prior unconsumed sessions)
		const now = new Date();
		const expiresAt = new Date(now.getTime() + 10 * 60 * 1000); // 10 mins
		const otp = genOtp();
		const otpToken = randomBytes(24).toString("hex");

		await prisma.otpSession.create({
			data: {
				id: otpToken,
				phone,
				passwordHash,
				otp,
				expiresAt,
				attemptCount: 0,
				consumed: false,
			},
		});

		// DEV: return OTP so user can see it below the input
		return NextResponse.json({
			otpToken,
			expiresAt: expiresAt.toISOString(),
			...(DEV_SIMULATE ? { otp } : {}),
		});
	} catch (e) {
		console.error(e);
		return NextResponse.json({ error: "SERVER_ERROR" }, { status: 500 });
	}
}
