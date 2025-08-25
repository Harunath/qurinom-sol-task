import { Suspense } from "react";
import Filters from "@/components/shop/Filters";
import ProductCard from "@/components/shop/ProductCard";
import Pagination from "@/components/ui/Pagination";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth"; // <-- your NextAuth config
import prisma from "@repo/db/client";

type SearchParamsInput = Record<string, string | string[] | undefined>;

// Decide the active area for this request (URL > user's default > none)
async function resolveActiveAreaId(
	searchParams: Record<string, string | string[] | undefined>
): Promise<string | null> {
	const urlArea = Array.isArray(searchParams.areaId)
		? searchParams.areaId[0]
		: searchParams.areaId;
	if (urlArea) return urlArea;

	// No area in URL → look at the logged-in user's default address
	const session = await getServerSession(authOptions);
	const userId = session?.user?.id as string | undefined;
	if (!userId) return null;

	const defaultAddr = await prisma.address.findFirst({
		where: { userId, isDefault: true },
		select: { areaId: true },
	});

	return defaultAddr?.areaId ?? null;
}

// Build a canonical query string that always includes areaId
function toQuery(params: Record<string, unknown>) {
	const sp = new URLSearchParams();
	for (const [k, v] of Object.entries(params)) {
		if (v === undefined || v === null || v === "") continue;
		sp.set(k, String(v));
	}
	return sp.toString();
}

function flattenParams(sp: SearchParamsInput = {}) {
	return Object.fromEntries(
		Object.entries(sp).map(([k, v]) => [k, Array.isArray(v) ? v[0] : v])
	) as Record<string, string | undefined>;
}

async function fetchProducts(
	searchParams: Record<string, string | string[] | undefined>
) {
	const pick = (key: string) => {
		const v = searchParams[key];
		return Array.isArray(v) ? v[0] : v;
	};

	const q = pick("q");
	const category = pick("category"); // parent slug
	const subcategory = pick("subcategory"); // child slug
	const minPrice = pick("minPrice");
	const maxPrice = pick("maxPrice");
	const areaId = pick("areaId");
	const sort = pick("sort") ?? "newest";
	const page = pick("page") ?? "1";
	const perPage = pick("perPage") ?? "24";

	const qs = toQuery({
		q,
		category,
		subcategory,
		minPrice,
		maxPrice,
		areaId,
		sort,
		page,
		perPage,
	});

	const res = await fetch(`${process.env.NEXTAUTH_URL}/api/products?${qs}`, {
		cache: "no-store",
	});
	if (!res.ok) throw new Error("Failed to load products");

	return (await res.json()) as {
		ok: boolean;
		data: any[];
		pagination: {
			page: number;
			perPage: number;
			total: number;
			totalPages: number;
			hasMore: boolean;
		};
	};
}

// products/page.tsx (Server Component)
async function fetchFiltersMeta() {
	const res = await fetch(
		`${process.env.NEXTAUTH_URL}/api/products/catalog/meta`,
		{
			cache: "force-cache",
			next: { revalidate: 300 }, // optional
		}
	).catch(() => null);

	if (!res || !res.ok) {
		// Safe fallback shape
		return {
			category: [] as {
				id: string;
				name: string;
				slug: string;
				parentId: null;
			}[],
			subcategory: {} as Record<
				string,
				{ id: string; name: string; slug: string; parentId: string }[]
			>,
			tree: [] as any[],
		};
	}

	// Expected shape from /api/products/catalog/meta (single table with parentId)
	return (await res.json()) as {
		category: { id: string; name: string; slug: string; parentId: null }[];
		subcategory: Record<
			string,
			{ id: string; name: string; slug: string; parentId: string }[]
		>;
		tree: Array<{
			id: string;
			name: string;
			slug: string;
			parentId: null;
			children: { id: string; name: string; slug: string; parentId: string }[];
		}>;
	};
}

export default async function Page({
	searchParams,
}: {
	searchParams: Promise<SearchParamsInput>;
}) {
	// 1) Ensure we have an areaId (URL or user's default)
	const spRaw = (await searchParams) ?? {};
	const sp = flattenParams(spRaw);
	const activeAreaId = await resolveActiveAreaId(sp);

	// 2) If we found an areaId but it's not in the URL, canonicalize once
	const urlHasArea =
		typeof sp.areaId === "string" || (Array.isArray(sp.areaId) && sp.areaId[0]);

	if (activeAreaId && !urlHasArea) {
		// Preserve other filters, inject areaId, reset to page 1
		const currentFlat = Object.fromEntries(
			Object.entries(sp).map(([k, v]) => [k, Array.isArray(v) ? v[0] : v])
		) as Record<string, string | undefined>;

		const qs = toQuery({
			...currentFlat,
			areaId: activeAreaId,
			page: "1",
		});

		redirect(`/products?${qs}`);
	}

	// 3) If still no areaId, render the page but your UI should show an area picker (no products call)
	if (!activeAreaId) {
		return (
			<div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
				<h1 className="mb-6 text-2xl font-bold tracking-tight">Products</h1>
				<div className="mb-4 rounded-xl border bg-yellow-50 p-4 text-sm">
					Select your delivery area to see available products.
				</div>
				{/* You can render Filters disabled or hide them until area is chosen */}
			</div>
		);
	}

	// 4) Fetch with areaId included (your existing helpers)
	const [{ data, pagination }, meta] = await Promise.all([
		fetchProducts({ ...sp, areaId: activeAreaId }),
		fetchFiltersMeta(),
	]);

	// 5) Flatten for Filters (client) and render your existing UI
	const current = Object.fromEntries(
		Object.entries(sp).map(([k, v]) => [k, Array.isArray(v) ? v[0] : v])
	) as Record<string, string | undefined>;

	// Ensure current carries areaId so Filters and the sort form can preserve it
	current.areaId = activeAreaId;

	return (
		<div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
			<div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
				<h1 className="text-2xl font-bold tracking-tight">Products</h1>
				<p className="text-sm text-gray-500">{pagination.total} items</p>
			</div>

			<div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
				{/* Filters (Client) */}
				<aside className="lg:col-span-3">
					<Suspense
						fallback={
							<div className="h-40 animate-pulse rounded-xl bg-gray-100" />
						}>
						{/* Filters expects `meta` with parents/childrenByParentSlug */}
						<Filters
							meta={{
								category: meta.category,
								subcategory: meta.subcategory,
							}}
							current={current}
						/>
					</Suspense>
				</aside>

				{/* Results */}
				<section className="lg:col-span-9">
					{/* Sort row */}
					<div className="mb-4 flex items-center justify-between gap-3">
						<div className="text-sm text-gray-600">
							Page {pagination.page} of {pagination.totalPages}
						</div>
						<form action="/products" className="inline-flex items-center gap-2">
							{/* Preserve current filters when changing sort */}
							<input type="hidden" name="q" defaultValue={current.q} />
							<input
								type="hidden"
								name="category"
								defaultValue={current.category}
							/>
							<input
								type="hidden"
								name="subcategory"
								defaultValue={current.subcategory}
							/>
							<input
								type="hidden"
								name="minPrice"
								defaultValue={current.minPrice}
							/>
							<input
								type="hidden"
								name="maxPrice"
								defaultValue={current.maxPrice}
							/>
							<input
								type="hidden"
								name="areaId"
								defaultValue={current.areaId}
							/>
							<select
								name="sort"
								defaultValue={current.sort ?? "newest"}
								className="rounded-lg border px-2 py-1 text-sm">
								<option value="newest">Newest</option>
								<option value="price-asc">Price: Low to High</option>
								<option value="price-desc">Price: High to Low</option>
							</select>
							<button className="rounded-lg border px-3 py-1 text-sm">
								Apply
							</button>
						</form>
					</div>

					{/* Grid */}
					{data.length === 0 ? (
						<div className="rounded-xl border border-dashed p-12 text-center text-gray-500">
							No products found.
						</div>
					) : (
						<ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4">
							{data.map((p) => (
								<li key={p.id}>
									<ProductCard product={p} />
								</li>
							))}
						</ul>
					)}

					{/* Pagination */}
					<div className="mt-8">
						<Pagination totalPages={pagination.totalPages} />
					</div>
				</section>
			</div>
		</div>
	);
}
