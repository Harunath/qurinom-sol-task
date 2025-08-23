// app/(merchant)/merchant/products/actions.ts
"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@repo/db/client";
import { productFormSchema } from "@/lib/validation/products";
import { toSlug } from "@/lib/slug";

/**
 * Generate a unique slug per store by suffixing -2, -3, ... if needed.
 */

function toNumberOrUndef(v: FormDataEntryValue | null) {
	if (v == null || typeof v !== "string") return undefined;
	const t = v.trim();
	if (t === "") return undefined; // let Zod flag "required"
	const n = Number(t);
	return Number.isFinite(n) ? n : NaN; // NaN will fail z.number()
}
async function uniqueSlugForStore(
	tx: { product: { findMany: typeof prisma.product.findMany } },
	storeId: string,
	base: string
) {
	const existing = await tx.product.findMany({
		where: { storeId, slug: { startsWith: base } },
		select: { slug: true },
	});

	if (existing.length === 0) return base;

	const used = new Set(existing.map((e) => e.slug));
	if (!used.has(base)) return base;

	// Find next available numeric suffix
	let i = 2;
	while (used.has(`${base}-${i}`)) i++;
	return `${base}-${i}`;
}

export async function createProductAction(formData: FormData) {
	const session = await getServerSession(authOptions);
	if (!session?.user) throw new Error("Unauthenticated");

	// Resolve store for this user
	const store = await prisma.store.findFirst({
		where: { merchantId: session.user.id as string },
		select: { id: true },
	});
	if (!store)
		throw new Error(
			"No store found for this account. Complete store registration first."
		);
	const storeId = store.id;

	// Read optional one-by-one image fields
	const newImageUrl =
		(formData.get("newImageUrl") as string | null)?.trim() ?? "";
	const newImageAlt =
		(formData.get("newImageAlt") as string | null)?.trim() ?? "";
	console.log(formData);
	// Validate form
	const raw = Object.fromEntries(formData.entries()) as Record<string, any>;

	// normalize number fields
	const data = {
		...raw,
		price: toNumberOrUndef(formData.get("price")),
		stock: toNumberOrUndef(formData.get("stock")),
	};

	const parsed = productFormSchema.safeParse(data);
	console.log(parsed);
	if (!parsed.success) {
		return { ok: false as const, error: parsed.error.flatten() };
	}
	const {
		name,
		description,
		price,
		categoryName,
		stock,
		categoryId,
		subcategoryId,
	} = parsed.data;

	// Create inside a transaction
	const created = await prisma.$transaction(async (tx) => {
		// Validate category
		const category = await tx.category.findUnique({
			where: { id: categoryId },
			select: { id: true },
		});
		if (!category) throw new Error("Invalid category");

		// Validate subcategory belongs to category (if provided)
		if (subcategoryId) {
			const ok = await tx.category.findFirst({
				where: { id: subcategoryId, parentId: categoryId },
				select: { id: true },
			});
			if (!ok) throw new Error("Invalid subcategory for the selected category");
		}

		// Compute unique slug per store
		const baseSlug = toSlug(name);
		const slug = await uniqueSlugForStore(tx, storeId, baseSlug);

		// Create product
		const product = await tx.product.create({
			data: {
				name,
				slug,
				description: description || null,
				price,
				stock,
				categoryId,
				categoryName,
				subcategoryId: subcategoryId || null,
				storeId,
			},
			select: { id: true },
		});
		console.log("product ", product);
		// Optionally create the first image
		if (newImageUrl) {
			await tx.productImage.create({
				data: {
					productId: product.id,
					url: newImageUrl,
					alt: newImageAlt || null,
				},
			});
		}

		return product;
	});
	if (!created) return { ok: false };

	revalidatePath("/merchant/products");
	return { ok: true, id: created.id }; // ✅ return, no redirect
}
/** Find a unique slug per store when updating (exclude current product). */
async function uniqueSlugForStoreOnUpdate(
	tx: { product: { findMany: typeof prisma.product.findMany } },
	storeId: string,
	base: string,
	productId: string
) {
	const existing = await tx.product.findMany({
		where: { storeId, slug: { startsWith: base }, NOT: { id: productId } },
		select: { slug: true },
	});
	if (existing.length === 0) return base;

	const used = new Set(existing.map((e) => e.slug));
	if (!used.has(base)) return base;

	let i = 2;
	while (used.has(`${base}-${i}`)) i++;
	return `${base}-${i}`;
}

export async function updateProductAction(
	productId: string,
	formData: FormData
) {
	const session = await getServerSession(authOptions);
	if (!session?.user) throw new Error("Unauthenticated");

	// store owned by this user
	const store = await prisma.store.findFirst({
		where: { merchantId: session.user.id as string },
		select: { id: true },
	});
	if (!store) throw new Error("No store found for this account.");
	const storeId = store.id;

	// optional one-by-one image add
	const newImageUrl =
		(formData.get("newImageUrl") as string | null)?.trim() ?? "";
	const newImageAlt =
		(formData.get("newImageAlt") as string | null)?.trim() ?? "";

	// parse core fields (schema should NOT require mrp/sku)
	const raw = Object.fromEntries(formData.entries()) as Record<string, any>;

	// normalize number fields
	const data = {
		...raw,
		price: toNumberOrUndef(formData.get("price")),
		stock: toNumberOrUndef(formData.get("stock")),
	};

	const parsed = productFormSchema.safeParse(data);
	if (!parsed.success) {
		return { ok: false as const, error: parsed.error.flatten() };
	}

	const { name, description, price, stock, categoryId, subcategoryId } =
		parsed.data;

	await prisma.$transaction(async (tx) => {
		// ensure product belongs to this store
		const existing = await tx.product.findFirst({
			where: { id: productId, storeId },
			select: { id: true },
		});
		if (!existing) throw new Error("Product not found or not yours");

		// validate category & read its name (required field on Product)
		const category = await tx.category.findUnique({
			where: { id: categoryId },
			select: { id: true, name: true },
		});
		if (!category) throw new Error("Invalid category");

		// if subcategory provided, ensure it belongs to the chosen category
		if (subcategoryId) {
			const ok = await tx.category.findFirst({
				where: { id: subcategoryId, parentId: categoryId },
				select: { id: true },
			});
			if (!ok) throw new Error("Invalid subcategory for the selected category");
		}

		const baseSlug = toSlug(name);
		const slug = await uniqueSlugForStoreOnUpdate(
			tx,
			storeId,
			baseSlug,
			productId
		);

		await tx.product.update({
			where: { id: productId },
			data: {
				name,
				slug,
				description: description || null,
				price,
				stock,
				categoryId,
				subcategoryId: subcategoryId || null,
				categoryName: category.name, // <- required denormalized field
			},
		});

		if (newImageUrl) {
			await tx.productImage.create({
				data: {
					productId,
					url: newImageUrl,
					alt: newImageAlt || null,
				},
			});
		}
	});

	revalidatePath(`/merchant/products/${productId}/edit`);
	return { ok: true as const };
}
