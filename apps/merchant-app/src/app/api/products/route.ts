// app/api/products/route.ts
import { NextRequest, NextResponse } from "next/server";
import prisma from "@repo/db/client";

function parseIntParam(
	value: string | null,
	fallback: number,
	min = 1,
	max = 100
) {
	const n = Number.parseInt(value ?? "", 10);
	if (Number.isNaN(n)) return fallback;
	return Math.min(Math.max(n, min), max);
}

export async function GET(req: NextRequest) {
	const { searchParams } = new URL(req.url);
	const categoryQuery = searchParams.get("category"); // slug or id
	const page = parseIntParam(searchParams.get("page"), 1, 1, 10_000);
	const limit = parseIntParam(searchParams.get("limit"), 12, 1, 100);
	const offset = (page - 1) * limit;

	try {
		// Branch A: Filter by main category (slug OR id)
		if (categoryQuery && categoryQuery.trim() !== "") {
			const category = await prisma.category.findFirst({
				where: {
					OR: [{ id: categoryQuery }, { slug: categoryQuery }],
				},
				select: { id: true, name: true },
			});

			if (!category) {
				return NextResponse.json({
					items: [],
					page,
					limit,
					total: 0,
					totalPages: 0,
					hasNextPage: false,
					category: null,
				});
			}

			const total = await prisma.product.count({
				where: { categoryId: category.id },
			});

			// Use DISTINCT ON to pick one (earliest) image per product, and order page by updatedAt desc.
			// If your table names/columns differ, adjust below.
			const rows = await prisma.$queryRaw<
				Array<{
					id: string;
					name: string;
					slug: string;
					description: string | null;
					price: number;
					stock: number;
					categoryId: string;
					subcategoryId: string | null;
					categoryName: string; // required on Product as per your note
					createdAt: Date;
					updatedAt: Date;
					image_url: string | null;
				}>
			>`
		WITH picks AS (
		  SELECT DISTINCT ON (p.id)
			p.id, p.name, p.slug, p.description, p.price, p.stock,
			p."categoryId", p."subcategoryId", p."categoryName",
			p."createdAt", p."updatedAt",
			pi.url AS image_url,
			p.id AS pid_for_order, -- keep for stable order
			p."updatedAt" AS p_updated_at
		  FROM "Product" p
		  LEFT JOIN "ProductImage" pi ON pi."productId" = p.id
		  WHERE p."categoryId" = ${category.id}
		  ORDER BY p.id, pi."createdAt" ASC NULLS LAST
		)
		SELECT * FROM picks
		ORDER BY p_updated_at DESC
		LIMIT ${limit} OFFSET ${offset};
	  `;

			const totalPages = Math.ceil(total / limit) || 0;
			const hasNextPage = page < totalPages;

			return NextResponse.json({
				items: rows.map((r) => ({
					id: r.id,
					name: r.name,
					slug: r.slug,
					description: r.description,
					price: r.price,
					stock: r.stock,
					categoryId: r.categoryId,
					subcategoryId: r.subcategoryId,
					categoryName: r.categoryName,
					createdAt: r.createdAt,
					updatedAt: r.updatedAt,
					firstImageUrl: r.image_url,
				})),
				page,
				limit,
				total,
				totalPages,
				hasNextPage,
				category: { id: category.id, name: category.name },
			});
		}

		// Branch B: No category → Random products with pagination
		const totalAll = await prisma.product.count();

		// DISTINCT ON to pick one image per product, then randomize at the outer level.
		const rowsRandom = await prisma.$queryRaw<
			Array<{
				id: string;
				name: string;
				slug: string;
				description: string | null;
				price: number;
				stock: number;
				categoryId: string;
				subcategoryId: string | null;
				categoryName: string;
				createdAt: Date;
				updatedAt: Date;
				image_url: string | null;
			}>
		>`
	  WITH picks AS (
		SELECT DISTINCT ON (p.id)
		  p.id, p.name, p.slug, p.description, p.price, p.stock,
		  p."categoryId", p."subcategoryId", p."categoryName",
		  p."createdAt", p."updatedAt",
		  pi.url AS image_url
		FROM "Product" p
		LEFT JOIN "ProductImage" pi ON pi."productId" = p.id
		ORDER BY p.id, pi."createdAt" ASC NULLS LAST
	  )
	  SELECT * FROM picks
	  ORDER BY RANDOM()
	  LIMIT ${limit} OFFSET ${offset};
	`;

		const totalPagesAll = Math.ceil(totalAll / limit) || 0;
		const hasNextPageAll = page < totalPagesAll;

		return NextResponse.json({
			items: rowsRandom.map((r) => ({
				id: r.id,
				name: r.name,
				slug: r.slug,
				description: r.description,
				price: r.price,
				stock: r.stock,
				categoryId: r.categoryId,
				subcategoryId: r.subcategoryId,
				categoryName: r.categoryName,
				createdAt: r.createdAt,
				updatedAt: r.updatedAt,
				firstImageUrl: r.image_url,
			})),
			page,
			limit,
			total: totalAll,
			totalPages: totalPagesAll,
			hasNextPage: hasNextPageAll,
			category: null,
		});
	} catch (err) {
		console.error("[GET /api/products] error:", err);
		return NextResponse.json({ error: "Internal error" }, { status: 500 });
	}
}
