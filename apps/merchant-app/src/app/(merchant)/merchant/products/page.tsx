import Link from "next/link";
import prisma from "@repo/db/client";

export default async function Page() {
	const items = await prisma.product.findMany({
		orderBy: { updatedAt: "desc" },
		select: { id: true, name: true, price: true, stock: true },
	});

	return (
		<div className="p-6">
			<div className="mb-4 flex items-center justify-between">
				<h1 className="text-2xl font-bold">My Products</h1>
				<Link
					href="/merchant/products/new"
					className="rounded-xl bg-black px-4 py-2 text-sm font-semibold text-white">
					+ Add Product
				</Link>
			</div>

			<ul className="divide-y rounded-2xl border">
				{items.map((p) => (
					<li key={p.id} className="flex items-center justify-between p-4">
						<div>
							<div className="font-medium">{p.name}</div>
							<div className="text-sm text-gray-500">
								₹{p.price} • Stock {p.stock}
							</div>
						</div>
						<Link
							href={`/merchant/products/${p.id}/edit`}
							className="text-sm font-semibold underline">
							Edit
						</Link>
					</li>
				))}
				{items.length === 0 ? (
					<li className="p-4 text-sm text-gray-500">No products yet.</li>
				) : null}
			</ul>
		</div>
	);
}
