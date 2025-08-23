// app/(merchant)/merchant/products/new/page.tsx
import prisma from "@repo/db/client";
import { createProductAction } from "@/lib/actions/product/actions";
import { ProductForm } from "@/components/products/ProductForm";

export default async function Page() {
	const categories = await prisma.category.findMany({
		select: { id: true, name: true },
		orderBy: { name: "asc" },
	});

	async function submit(fd: FormData) {
		"use server";
		await createProductAction(fd);
	}

	return (
		<div className="p-6">
			<ProductForm mode="create" categories={categories} onSubmit={submit} />
		</div>
	);
}
