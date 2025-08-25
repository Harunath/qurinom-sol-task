// import { z } from "zod";

// export const sendOtpSchema = z.object({
// 	phone: z
// 		.string()
// 		.min(7, "Invalid phone")
// 		.max(20, "Invalid phone")
// 		.regex(/^[0-9+\-\s()]+$/, "Invalid phone"),
// });

// export const verifyOtpSchema = z.object({
// 	phone: z
// 		.string()
// 		.min(7, "Invalid phone")
// 		.max(20, "Invalid phone")
// 		.regex(/^[0-9+\-\s()]+$/, "Invalid phone"),
// 	purpose: z.literal("signup"),
// 	code: z
// 		.string()
// 		.length(6, "Enter 6‑digit OTP")
// 		.regex(/^\d{6}$/, "Digits only"),
// });

// /lib/validation/merchantSignup.ts
import { z } from "zod";

// Reusable helpers
const phoneE164 = z
	.string()
	.min(10)
	.max(15)
	.regex(/^\+?[1-9]\d{9,14}$/, "Invalid phone number");

const cuidOrUuid = z.string().min(1); // relax for now; tighten later if needed

// Step 1: start (phone + password)
export const startSchema = z.object({
	phone: phoneE164,
	password: z
		.string()
		.min(8, "Password must be at least 8 characters")
		.max(128, "Password too long"),
});
export type StartInput = z.infer<typeof startSchema>;

// Step 2: verify OTP
export const verifySchema = z.object({
	otpToken: z.string().min(1),
	otp: z.string().regex(/^\d{6}$/, "OTP must be 6 digits"),
});
export type VerifyInput = z.infer<typeof verifySchema>;

// Step 3: personal info (profile)
export const profileSchema = z.object({
	name: z.string().min(1, "First name is required").max(50).optional(),
	email: z.string().email("Invalid email").max(254).optional(),
	// avatarUrl: z
	// 	.string()
	// 	.url()
	// 	.optional()
	// 	.or(z.literal("").transform(() => undefined)),
});
export type ProfileInput = z.infer<typeof profileSchema>;

// Optional: API response shapes to keep client/server aligned
export const startResponseSchema = z.object({
	otpToken: z.string(),
	expiresAt: z.string(), // ISO
	otp: z.string().optional(), // present only in DEV
});
export type StartResponse = z.infer<typeof startResponseSchema>;

export const verifyResponseSchema = z.object({
	userId: z.string(),
	next: z.string(),
});
export type VerifyResponse = z.infer<typeof verifyResponseSchema>;

export const userRegisterSchema = z
	.object({
		// phone + verificationId are required
		phone: z
			.string()
			.min(7, "Invalid phone")
			.max(20, "Invalid phone")
			.regex(/^[0-9+\-\s()]+$/, "Invalid phone"),
		verificationId: z.string().min(8),

		// account
		name: z.string().min(2, "Name is too short").max(50).optional(),
		email: z.string().email("Invalid email").optional(),
		password: z
			.string()
			.min(8, "Min 8 characters")
			.max(72, "Max 72 characters")
			.regex(
				/^(?=.*[A-Za-z])(?=.*\d).+$/,
				"Must include a letter and a number"
			),
		confirmPassword: z.string(),

		// address
		stateId: z.string(),
		cityId: z.string(),
		areaId: z.string().optional(),
		addressLine1: z.string(),
		pincode: z.string().regex(/^[0-9]{5,7}$/, "Invalid pincode"),
	})
	.refine((d) => d.password === d.confirmPassword, {
		message: "Passwords must match",
		path: ["confirmPassword"],
	});

export type UserRegisterInput = z.infer<typeof userRegisterSchema>;
