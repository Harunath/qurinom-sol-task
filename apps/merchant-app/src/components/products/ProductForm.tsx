// app/(merchant)/merchant/products/ProductForm.tsx
"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import type { ProductFormValues } from "@/lib/validation/products";
import { productFormSchema } from "@/lib/validation/products";
import { toast } from "react-toastify";

export function ProductForm({
	mode,
	categories,
	defaultValues,
	onSubmit,
}: {
	mode: "create" | "edit";
	categories: { id: string; name: string }[];
	defaultValues?: Partial<ProductFormValues> & { id?: string };
	onSubmit: (fd: FormData) => void | Promise<void>;
}) {
	const router = useRouter();

	const form = useForm<ProductFormValues>({
		resolver: zodResolver(productFormSchema),
		defaultValues: {
			name: defaultValues?.name ?? "",
			description: defaultValues?.description ?? "",
			price: (defaultValues?.price as number | undefined) ?? 0,
			stock: (defaultValues?.stock as number | undefined) ?? 0,
			categoryName: defaultValues?.categoryName ?? "",
			categoryId: defaultValues?.categoryId ?? "",
			subcategoryId: defaultValues?.subcategoryId ?? "",
			newImageUrl: "",
			newImageAlt: "",
		},
		mode: "onChange",
	});

	// Dependent subcategories + auto-fill categoryName
	const categoryId = form.watch("categoryId");
	const [subcats, setSubcats] = React.useState<{ id: string; name: string }[]>(
		[]
	);

	React.useEffect(() => {
		// auto-fill categoryName from the categories prop
		const cat = categories.find((c) => c.id === categoryId);
		form.setValue("categoryName", cat?.name ?? "", { shouldValidate: true });

		if (!categoryId) {
			setSubcats([]);
			return;
		}
		let cancelled = false;
		fetch(`/api/subcategories?categoryId=${categoryId}`)
			.then((r) => r.json())
			.then((d) => {
				if (!cancelled) setSubcats(d.items ?? []);
			})
			.catch(() => {
				if (!cancelled) setSubcats([]);
			});
		return () => {
			cancelled = true;
		};
	}, [categoryId, categories, form]);

	const { isSubmitting, errors } = form.formState;

	async function handleSubmit(values: ProductFormValues) {
		const fd = new FormData();
		// Ensure numbers are serialized as strings for FormData
		fd.set("name", values.name);
		fd.set("description", values.description ?? "");
		fd.set("price", String(Number(values.price ?? 0)));
		fd.set("stock", String(Number(values.stock ?? 0)));
		fd.set("categoryId", values.categoryId);
		fd.set("subcategoryId", values.subcategoryId ?? "");
		// required denormalized field (auto-filled)
		fd.set("categoryName", values.categoryName ?? "");
		// optional one-by-one image
		if (values.newImageUrl) fd.set("newImageUrl", values.newImageUrl);
		if (values.newImageAlt) fd.set("newImageAlt", values.newImageAlt);

		try {
			// If your server action returns { ok: boolean, message?: string }, use it.
			const result = (await onSubmit(fd)) as any;

			if (result?.ok === false) {
				const msg =
					(result?.error?.formErrors?.join?.(", ") ??
						(result?.error?.fieldErrors &&
							Object.values(result.error.fieldErrors).flat().join(", "))) ||
					result?.message ||
					"Something went wrong";
				toast.error(msg);
				return;
			}
			if (mode === "create") {
				toast.success("Product created successfully");
				router.push(`/merchant/products/${result.id}/edit?created=1`);
			} else {
				("Product created successfully");
			}

			// Clear the form after success (only for create)
			if (mode === "create") {
				form.reset({
					name: "",
					description: "",
					price: 0,
					stock: 0,
					categoryId: "",
					categoryName: "",
					subcategoryId: "",
					newImageUrl: "",
					newImageAlt: "",
				});
				setSubcats([]);
			}
		} catch (e: any) {
			// Server action threw (validation/ownership/unknown)
			toast.error(e?.message ?? "Failed to save product");
		}
	}

	return (
		<form
			onSubmit={form.handleSubmit(handleSubmit)}
			className="mx-auto max-w-3xl space-y-6 rounded-2xl border p-6 shadow-sm">
			<h1 className="text-2xl font-bold">
				{mode === "create" ? "Add New Product" : "Edit Product"}
			</h1>

			<div className="grid gap-6 md:grid-cols-2">
				{/* Name */}
				<div className="space-y-2">
					<label className="block text-sm font-medium">Name</label>
					<input
						{...form.register("name")}
						className="w-full rounded-xl border px-3 py-2"
						placeholder="Ex: Cotton T-Shirt"
					/>
					{errors.name && (
						<p className="text-sm text-red-600">{errors.name.message}</p>
					)}
				</div>

				{/* Category */}
				<div className="space-y-2">
					<label className="block text-sm font-medium">Category</label>
					<select
						{...form.register("categoryId")}
						className="w-full rounded-xl border px-3 py-2">
						<option value="">Select...</option>
						{categories.map((c) => (
							<option key={c.id} value={c.id}>
								{c.name}
							</option>
						))}
					</select>
					{errors.categoryId && (
						<p className="text-sm text-red-600">{errors.categoryId.message}</p>
					)}
				</div>

				{/* Subcategory (optional) */}
				<div className="space-y-2">
					<label className="block text-sm font-medium">
						Subcategory (optional)
					</label>
					<select
						{...form.register("subcategoryId")}
						className="w-full rounded-xl border px-3 py-2">
						<option value="">None</option>
						{subcats.map((s) => (
							<option key={s.id} value={s.id}>
								{s.name}
							</option>
						))}
					</select>
				</div>

				{/* Category Name (auto) */}
				<div className="space-y-2">
					<label className="block text-sm font-medium">
						Category name (auto)
					</label>
					<input
						{...form.register("categoryName")}
						className="w-full rounded-xl border px-3 py-2 bg-gray-50"
						readOnly
						placeholder="Will auto-fill from Category"
					/>
					{errors.categoryName && (
						<p className="text-sm text-red-600">
							{errors.categoryName.message}
						</p>
					)}
				</div>

				{/* Price */}
				<div className="space-y-2">
					<label className="block text-sm font-medium">Price</label>
					<input
						type="number"
						inputMode="numeric"
						{...form.register("price", { valueAsNumber: true })}
					/>
					{errors.price && (
						<p className="text-sm text-red-600">
							{errors.price.message as any}
						</p>
					)}
				</div>

				{/* Stock */}
				<div className="space-y-2">
					<label className="block text-sm font-medium">Stock</label>
					<input
						type="number"
						inputMode="numeric"
						{...form.register("stock", { valueAsNumber: true })}
					/>
					{errors.stock && (
						<p className="text-sm text-red-600">
							{errors.stock.message as any}
						</p>
					)}
				</div>

				{/* Add image (one-by-one) */}
				<div className="space-y-2 md:col-span-2">
					<label className="block text-sm font-medium">
						Add image (one-by-one)
					</label>
					<div className="grid gap-3 md:grid-cols-2">
						<input
							{...form.register("newImageUrl")}
							className="w-full rounded-xl border px-3 py-2"
							placeholder="https://.../image.jpg"
						/>
						<input
							{...form.register("newImageAlt")}
							className="w-full rounded-xl border px-3 py-2"
							placeholder="Alt text (optional)"
						/>
					</div>
					{errors.newImageUrl && (
						<p className="text-sm text-red-600">{errors.newImageUrl.message}</p>
					)}
				</div>

				{/* Description */}
				<div className="md:col-span-2 space-y-2">
					<label className="block text-sm font-medium">Description</label>
					<textarea
						{...form.register("description")}
						rows={6}
						className="w-full rounded-xl border px-3 py-2"
					/>
				</div>
			</div>

			<div className="flex items-center gap-3">
				<button
					type="submit"
					disabled={isSubmitting}
					className="inline-flex items-center rounded-xl bg-black px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">
					{isSubmitting
						? "Saving..."
						: mode === "create"
							? "Create Product"
							: "Save Changes"}
				</button>

				<button
					type="button"
					onClick={() => router.back()}
					className="rounded-xl border px-4 py-2 text-sm font-semibold">
					Cancel
				</button>
			</div>
		</form>
	);
}
