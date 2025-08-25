import Image from "next/image";
import Link from "next/link";

type Product = {
	id: string;
	name: string;
	description?: string | null;
	price: number; // adjust if you use sellingPrice
	images?: { url: string; alt?: string | null }[]; // optional
	category?: { name: string; slug: string };
	subcategory?: { name: string; slug: string } | null;
};

export default function ProductCard({ product }: { product: Product }) {
	const img =
		product.images?.[0]?.url ??
		"https://picsum.photos/seed/placeholder/640/480"; // replace with your image logic
	return (
		<Link
			href={`/products/${product.id}`}
			className="group block overflow-hidden rounded-2xl border bg-white shadow-sm transition hover:shadow-md">
			<div className="relative aspect-[4/3] w-full">
				<Image
					src={img}
					alt={product.images?.[0]?.alt ?? product.name}
					fill
					className="object-cover transition group-hover:scale-[1.03]"
				/>
			</div>
			<div className="space-y-1 px-4 py-3">
				<h3 className="line-clamp-1 text-sm font-semibold">{product.name}</h3>
				{product.subcategory ? (
					<p className="line-clamp-1 text-xs text-gray-500">
						{product.category?.name} · {product.subcategory.name}
					</p>
				) : product.category ? (
					<p className="line-clamp-1 text-xs text-gray-500">
						{product.category.name}
					</p>
				) : null}
				<p className="text-base font-bold">
					₹{product.price.toLocaleString("en-IN")}
				</p>
			</div>
		</Link>
	);
}
