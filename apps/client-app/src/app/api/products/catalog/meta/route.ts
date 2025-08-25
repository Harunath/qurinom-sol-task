// app/api/catalog/meta/route.ts
import { NextResponse } from "next/server";
import prisma from "@repo/db/client";

type Row = { id: string; name: string; slug: string; parentId: string | null };

export async function GET() {
	const rows: Row[] = await prisma.category.findMany({
		select: { id: true, name: true, slug: true, parentId: true },
		orderBy: { name: "asc" },
	});

	const category = rows.filter((r) => r.parentId === null);

	// Hash map: parentSlug -> subcategories[]
	const subcategory: Record<string, Row[]> = {};
	const parentById = new Map(category.map((p) => [p.id, p]));

	for (const r of rows) {
		if (!r.parentId) continue; // skip parents
		const parent = parentById.get(r.parentId);
		if (!parent) continue; // orphan safety
		(subcategory[parent.slug] ||= []).push(r);
	}

	// (Optional) nested tree if you prefer directly:
	const tree = category.map((p) => ({
		...p,
		children: subcategory[p.slug] ?? [],
	}));

	return NextResponse.json({
		category, // [{ id, name, slug, parentId: null }, ...]
		subcategory, // { "fashion": [{...}, ...], "electronics": [...] }
		tree, // convenience nested format
	});
}
