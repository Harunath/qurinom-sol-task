// app/(merchant)/merchant/dashboard/page.tsx
import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@repo/db/client";
import { notFound, redirect } from "next/navigation";

const LOW_STOCK_THRESHOLD = 5;

async function resolveStoreIdForUser(userId: string) {
	const store = await prisma.store.findFirst({
		where: { merchantId: userId },
		select: { id: true },
	});
	if (!store)
		throw new Error(
			"No store found for this account. Complete store registration first."
		);
	return store.id;
}

export default async function DashboardPage() {
	const session = await getServerSession(authOptions);
	if (!session?.user) redirect("/login");

	const storeId = await resolveStoreIdForUser(session.user.id as string);

	// KPIs
	const [totalProducts, lowStock, outOfStock, distinctCats] = await Promise.all(
		[
			prisma.product.count({ where: { storeId } }),
			prisma.product.count({
				where: { storeId, stock: { lte: LOW_STOCK_THRESHOLD, gt: 0 } },
			}),
			prisma.product.count({ where: { storeId, stock: 0 } }),
			prisma.product.findMany({
				where: { storeId },
				select: { categoryId: true },
				distinct: ["categoryId"],
			}),
		]
	);
	const categoriesUsed = distinctCats.length;

	// Latest products (with first image URL if any)
	const latest = await prisma.product.findMany({
		where: { storeId },
		orderBy: { updatedAt: "desc" },
		take: 8,
		select: {
			id: true,
			name: true,
			slug: true,
			price: true,
			stock: true,
			categoryName: true,
			updatedAt: true,
		},
	});

	const images = await prisma.productImage.findMany({
		where: { productId: { in: latest.map((p: { id: string }) => p.id) } },
		orderBy: { createdAt: "asc" },
		select: { productId: true, url: true },
	});
	const firstImageByProduct = new Map<string, string>();
	for (const img of images) {
		if (!firstImageByProduct.has(img.productId))
			firstImageByProduct.set(img.productId, img.url);
	}

	return (
		<div className="p-6 space-y-8">
			<header className="flex items-center justify-between">
				<h1 className="text-2xl font-bold">Merchant Dashboard</h1>
				<div className="flex gap-3">
					<Link
						href="/merchant/products/new"
						className="rounded-xl bg-black px-4 py-2 text-sm font-semibold text-white">
						+ Add Product
					</Link>
					<Link
						href="/merchant/products"
						className="rounded-xl border px-4 py-2 text-sm font-semibold">
						View All
					</Link>
				</div>
			</header>

			{/* KPI Cards */}
			<section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
				<KpiCard label="Total Products" value={totalProducts} />
				<KpiCard
					label={`Low Stock (≤${LOW_STOCK_THRESHOLD})`}
					value={lowStock}
				/>
				<KpiCard label="Out of Stock" value={outOfStock} />
				<KpiCard label="Categories Used" value={categoriesUsed} />
			</section>

			{/* Latest Products */}
			<section className="space-y-4">
				<div className="flex items-center justify-between">
					<h2 className="text-lg font-semibold">Latest Products</h2>
					<Link
						href="/merchant/products"
						className="text-sm font-semibold underline">
						See all
					</Link>
				</div>

				{latest.length === 0 ? (
					<div className="rounded-2xl border p-6 text-sm text-gray-600">
						No products yet. Start by adding your first product.
					</div>
				) : (
					<ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
						{latest.map(
							(p: {
								id: string;
								name: string;
								slug: string;
								price: number;
								stock: number;
								categoryName: string;
								updatedAt: Date;
							}) => {
								const img = firstImageByProduct.get(p.id);
								return (
									<li key={p.id} className="rounded-2xl border p-3 shadow-sm">
										<div className="aspect-[4/3] overflow-hidden rounded-xl bg-gray-50">
											{img ? (
												// eslint-disable-next-line @next/next/no-img-element
												<img
													src={img}
													alt={p.name}
													className="h-full w-full object-cover"
													loading="lazy"
												/>
											) : (
												<div className="flex h-full items-center justify-center text-xs text-gray-400">
													No Image
												</div>
											)}
										</div>
										<div className="mt-3 space-y-1">
											<div className="line-clamp-1 font-medium">{p.name}</div>
											<div className="text-sm text-gray-600">
												{p.categoryName}
											</div>
											<div className="text-sm text-gray-700">
												₹{p.price} • Stock {p.stock}
											</div>
										</div>
										<div className="mt-3 flex gap-2">
											<Link
												href={`/merchant/products/${p.id}/edit`}
												className="rounded-lg border px-3 py-1 text-sm font-semibold">
												Edit
											</Link>
											<Link
												href={`/p/${p.slug}`}
												className="rounded-lg px-3 py-1 text-sm font-semibold underline">
												Preview
											</Link>
										</div>
									</li>
								);
							}
						)}
					</ul>
				)}
			</section>
		</div>
	);
}

function KpiCard({ label, value }: { label: string; value: number }) {
	return (
		<div className="rounded-2xl border p-5 shadow-sm">
			<div className="text-sm text-gray-600">{label}</div>
			<div className="mt-1 text-2xl font-bold">{value}</div>
		</div>
	);
}
