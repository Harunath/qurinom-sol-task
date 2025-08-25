// app/(merchant)/merchant/products/[id]/edit/page.tsx
import { notFound } from "next/navigation";
import prisma from "@repo/db/client";
import { updateProductAction } from "@/lib/actions/product/actions";
import { ProductForm } from "@/components/products/ProductForm";

export default async function Page({
	params,
	searchParams,
}: {
	params: Promise<Record<string, string>>;
	searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
	const { id } = await params; // from [id]
	const spRaw = (await searchParams) ?? {};
	const sp = Object.fromEntries(
		Object.entries(spRaw).map(([k, v]) => [k, Array.isArray(v) ? v[0] : v])
	) as Record<string, string | undefined>;
	const [product, categories] = await Promise.all([
		prisma.product.findUnique({
			where: { id },
			select: {
				id: true,
				name: true,
				description: true,
				price: true,
				stock: true,
				categoryId: true,
				categoryName: true,
				subcategoryId: true,
			},
		}),
		prisma.category.findMany({
			select: { id: true, name: true },
			orderBy: { name: "asc" },
		}),
	]);

	if (!product) return notFound();

	const defaults = {
		id: product.id,
		name: product.name,
		description: (product as any).description ?? "",
		price: product.price as any,
		mrp: (product as any).mrp ?? ("" as any),
		stock: product.stock as any,
		sku: (product as any).sku ?? "",
		categoryId: product.categoryId,
		subcategoryId: product.subcategoryId ?? "",
		newImageUrl: "",
		newImageAlt: "",
	};

	async function submit(fd: FormData): Promise<void> {
		"use server";
		await updateProductAction(id, fd);
	}

	return (
		<div className="p-6 space-y-4">
			{sp.created ? (
				<div className="rounded-xl border border-green-200 bg-green-50 p-3 text-sm">
					Product created.
				</div>
			) : null}
			<ProductForm
				mode="edit"
				categories={categories}
				defaultValues={defaults}
				onSubmit={submit}
			/>
		</div>
	);
}
