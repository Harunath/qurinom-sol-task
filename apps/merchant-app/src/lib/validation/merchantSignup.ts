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

// Step 4: Store registration
export const storeSchema = z.object({
	name: z.string().min(2, "Store name is required").max(120),

	// we pick city by id in UI, but Store stores a city NAME string
	cityId: cuidOrUuid,
	areaId: cuidOrUuid, // must belong to cityId

	addressLine1: z.string().min(3, "Address is required").max(200),
	addressLine2: z.string().max(200).optional(),

	// pincode is required in Prisma — we’ll auto-fill from Area if missing
	pincode: z
		.string()
		.regex(/^\d{5,6}$/, "Invalid pincode")
		.optional(),

	phone: z.string().optional(),
	description: z.string().max(300).optional(),
	storeImage: z
		.union([z.string().url("Enter a valid URL"), z.literal("")])
		.transform((v) => (v === "" ? undefined : v))
		.optional(),
	geo: z
		.object({
			lat: z.number().gte(-90).lte(90),
			lng: z.number().gte(-180).lte(180),
		})
		.optional(),
});
export type StoreInput = z.infer<typeof storeSchema>;

export const StoreResponseSchema = z.object({
	storeId: z.string(),
	next: z.string(),
});
export type StoreResponse = z.infer<typeof StoreResponseSchema>;

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

export const meProfileResponseSchema = z.object({
	profile: profileSchema.partial(), // server may return partial on first load
});
export type MeProfileResponse = z.infer<typeof meProfileResponseSchema>;
