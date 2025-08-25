import { z } from "zod";

export const addressSchema = z.object({
	stateId: z.string().min(1),
	cityId: z.string().min(1),
	areaId: z.string().min(1),
	addressLine1: z.string().min(3).max(200),
	addressLine2: z.string().optional().nullable(),
	pincode: z.string().min(5).max(10),
	isDefault: z.boolean().optional().default(false),
});

export type AddressInput = z.infer<typeof addressSchema>;
