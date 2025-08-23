// // lib/validation/products.ts
// import { z } from "zod";

// export const productFormSchema = z.object({
// 	name: z.string().min(2, "Name is too short"),
// 	description: z.string().max(2000).optional().or(z.literal("")),
// 	price: z.coerce.number().int().min(1, "Price must be > 0"), // required number
// 	stock: z.coerce.number().int().min(0, "Stock can't be negative"), // required number
// 	categoryId: z.string().min(1, "Select a category"),
// 	categoryName: z.string().min(1, "Category name missing"), // required, we auto-fill
// 	subcategoryId: z.string().optional().or(z.literal("")),
// 	newImageUrl: z.string().url().optional().or(z.literal("")),
// 	newImageAlt: z.string().max(120).optional().or(z.literal("")),
// });

// export type ProductFormValues = z.infer<typeof productFormSchema>;

import { z } from "zod";

export const productFormSchema = z.object({
	name: z.string().min(1),
	price: z.number(),
	stock: z.number(),
	categoryId: z.string().min(1),
	categoryName: z.string().min(1),
	description: z.string().optional(),
	subcategoryId: z.string().optional(),
	newImageUrl: z.string().optional(),
	newImageAlt: z.string().optional(),
});

export type ProductFormValues = z.infer<typeof productFormSchema>;
