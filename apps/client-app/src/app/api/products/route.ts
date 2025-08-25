import { NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@repo/db/client"; // update import to your prisma client path

const querySchema = z.object({
	q: z.string().trim().optional(),
	category: z.string().trim().optional(), // slug
	subcategory: z.string().trim().optional(), // slug
	minPrice: z.coerce.number().int().nonnegative().optional(),
	maxPrice: z.coerce.number().int().nonnegative().optional(),
	stateId: z.string().trim().optional(),
	cityId: z.string().trim().optional(),
	areaId: z.string().trim().optional(),
	sort: z
		.enum(["newest", "price-asc", "price-desc"])
		.default("newest")
		.optional(),
	page: z.coerce.number().int().min(1).default(1).optional(),
	perPage: z.coerce.number().int().min(1).max(100).default(24).optional(),
});

export async function GET(req: Request) {
	try {
		const url = new URL(req.url);
		const parsed = querySchema.safeParse(Object.fromEntries(url.searchParams));
		if (!parsed.success) {
			return NextResponse.json(
				{ ok: false, errors: parsed.error.flatten().fieldErrors },
				{ status: 400 }
			);
		}

		const {
			q,
			category,
			subcategory,
			minPrice,
			maxPrice,
			stateId,
			cityId,
			areaId,
			sort = "newest",
			page = 1,
			perPage = 24,
		} = parsed.data;

		const where: any = {
			isActive: true, // if you have soft-enable for products; remove if not
			// category/subcategory via slug relations
			...(category ? { category: { slug: category } } : {}),
			...(subcategory ? { subcategory: { slug: subcategory } } : {}),
			// price range
			...(minPrice != null || maxPrice != null
				? {
						price: {
							...(minPrice != null ? { gte: minPrice } : {}),
							...(maxPrice != null ? { lte: maxPrice } : {}),
						},
					}
				: {}),
			// text search: adjust to your fields
			...(q
				? {
						OR: [
							{ name: { contains: q, mode: "insensitive" } },
							{ description: { contains: q, mode: "insensitive" } },
						],
					}
				: {}),
			// location through related store
			...(stateId || cityId || areaId
				? {
						store: {
							...(stateId ? { stateId } : {}),
							...(cityId ? { cityId } : {}),
							...(areaId ? { areaId } : {}),
						},
					}
				: {}),
		};

		let orderBy: any = [{ createdAt: "desc" as const }];
		if (sort === "price-asc") orderBy = [{ price: "asc" }];
		if (sort === "price-desc") orderBy = [{ price: "desc" }];

		const skip = (page - 1) * perPage;
		const take = perPage;

		const [total, items] = await Promise.all([
			prisma.product.count({ where }),
			prisma.product.findMany({
				where,
				orderBy,
				skip,
				take,
				include: {
					category: { select: { id: true, name: true, slug: true } },
					subcategory: { select: { id: true, name: true, slug: true } },
					store: {
						select: {
							id: true,
							name: true,
						},
					},
					images: { select: { url: true, alt: true, id: true } },
					// images: true, // uncomment if relation exists
				},
			}),
		]);

		return NextResponse.json({
			ok: true,
			data: items,
			pagination: {
				page,
				perPage,
				total,
				totalPages: Math.ceil(total / perPage) || 1,
				hasMore: skip + items.length < total,
			},
		});
	} catch (err) {
		console.error("/api/products error", err);
		return NextResponse.json(
			{ ok: false, error: "Internal Server Error" },
			{ status: 500 }
		);
	}
}
