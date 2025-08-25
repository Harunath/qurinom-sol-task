"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

type Meta = {
	category: { id: string; name: string; slug: string; parentId: null }[];
	subcategory: Record<
		string,
		{ id: string; name: string; slug: string; parentId: string }[]
	>;
};

export default function Filters({
	meta,
	current,
}: {
	meta: Meta;
	current: Record<string, string | undefined>;
}) {
	const router = useRouter();
	const pathname = usePathname();
	const sp = useSearchParams();

	// Local UI state mirrors URL but we never filter locally — only push new URL
	const [q, setQ] = useState(current.q ?? "");
	const [minPrice, setMinPrice] = useState(current.minPrice ?? "");
	const [maxPrice, setMaxPrice] = useState(current.maxPrice ?? "");
	const [sort, setSort] = useState(current.sort ?? "newest");

	const [category, setCategory] = useState(current.category ?? ""); // parent slug
	const [subcategory, setSubcategory] = useState(current.subcategory ?? ""); // child slug

	const subcats = meta.subcategory[category] ?? [];

	useEffect(() => {
		// sync when navigating back/forward
		setQ(current.q ?? "");
		setCategory(current.category ?? "");
		setSubcategory(current.subcategory ?? "");
		setMinPrice(current.minPrice ?? "");
		setMaxPrice(current.maxPrice ?? "");
		setSort(current.sort ?? "newest");
	}, [
		current.q,
		current.category,
		current.subcategory,
		current.minPrice,
		current.maxPrice,
		current.sort,
	]);

	function submit(nextPage?: number) {
		const next = new URLSearchParams(sp.toString());
		function setOrDelete(k: string, v?: string) {
			if (v && v !== "") next.set(k, v);
			else next.delete(k);
		}
		setOrDelete("q", q);
		setOrDelete("category", category);
		setOrDelete("subcategory", subcategory);
		setOrDelete("minPrice", minPrice);
		setOrDelete("maxPrice", maxPrice);
		setOrDelete("sort", sort);
		setOrDelete("page", nextPage ? String(nextPage) : "1"); // reset to first page
		router.push(`${pathname}?${next.toString()}`);
	}

	function clearAll() {
		router.push(pathname);
	}

	return (
		<div className="sticky top-24 space-y-4">
			{/* Mobile disclosure */}
			<details className="lg:hidden rounded-xl border bg-white p-4 open:shadow">
				<summary className="cursor-pointer text-base font-semibold">
					Filters
				</summary>
				<div className="mt-4 space-y-4">
					<SearchBox value={q} onChange={setQ} onSubmit={() => submit()} />
					<CategorySelect
						meta={meta}
						category={category}
						setCategory={(v) => {
							setCategory(v);
							setSubcategory("");
						}}
					/>
					<SubcategorySelect
						subcats={subcats}
						subcategory={subcategory}
						setSubcategory={setSubcategory}
					/>
					<PriceRange
						minPrice={minPrice}
						maxPrice={maxPrice}
						setMinPrice={setMinPrice}
						setMaxPrice={setMaxPrice}
					/>
					<SortSelect sort={sort} setSort={setSort} />
					<div className="flex gap-2">
						<button
							onClick={() => submit()}
							className="w-full rounded-lg bg-black px-4 py-2 text-white">
							Apply
						</button>
						<button
							onClick={clearAll}
							className="w-full rounded-lg border px-4 py-2">
							Clear
						</button>
					</div>
				</div>
			</details>

			{/* Desktop panel */}
			<div className="hidden lg:block rounded-2xl border bg-white p-4 shadow-sm">
				<div className="space-y-4">
					<SearchBox value={q} onChange={setQ} onSubmit={() => submit()} />
					<CategorySelect
						meta={meta}
						category={category}
						setCategory={(v) => {
							setCategory(v);
							setSubcategory("");
						}}
					/>
					<SubcategorySelect
						subcats={subcats}
						subcategory={subcategory}
						setSubcategory={setSubcategory}
					/>
					<PriceRange
						minPrice={minPrice}
						maxPrice={maxPrice}
						setMinPrice={setMinPrice}
						setMaxPrice={setMaxPrice}
					/>
					<SortSelect sort={sort} setSort={setSort} />
					<div className="flex gap-2 pt-2">
						<button
							onClick={() => submit()}
							className="w-full rounded-lg bg-black px-4 py-2 text-white">
							Apply filters
						</button>
						<button
							onClick={clearAll}
							className="w-full rounded-lg border px-4 py-2">
							Clear
						</button>
					</div>
				</div>
			</div>
		</div>
	);
}

function SearchBox({
	value,
	onChange,
	onSubmit,
}: {
	value: string;
	onChange: (v: string) => void;
	onSubmit: () => void;
}) {
	return (
		<div>
			<label className="mb-1 block text-sm font-medium">Search</label>
			<div className="flex">
				<input
					value={value}
					onChange={(e) => onChange(e.target.value)}
					placeholder="Search products"
					className="w-full rounded-l-lg border px-3 py-2"
				/>
				<button
					onClick={onSubmit}
					className="rounded-r-lg border border-l-0 px-4">
					Go
				</button>
			</div>
		</div>
	);
}

function CategorySelect({
	meta,
	category,
	setCategory,
}: {
	meta: Meta;
	category: string;
	setCategory: (v: string) => void;
}) {
	return (
		<div>
			<label className="mb-1 block text-sm font-medium">Category</label>
			<select
				value={category}
				onChange={(e) => setCategory(e.target.value)}
				className="w-full rounded-lg border px-3 py-2">
				<option value="">All</option>
				{meta.category.map((c) => (
					<option key={c.slug} value={c.slug}>
						{c.name}
					</option>
				))}
			</select>
		</div>
	);
}

function SubcategorySelect({
	subcats,
	subcategory,
	setSubcategory,
}: {
	subcats: { name: string; slug: string }[];
	subcategory: string;
	setSubcategory: (v: string) => void;
}) {
	return (
		<div>
			<label className="mb-1 block text-sm font-medium">Subcategory</label>
			<select
				value={subcategory}
				onChange={(e) => setSubcategory(e.target.value)}
				className="w-full rounded-lg border px-3 py-2"
				disabled={subcats.length === 0}>
				<option value="">All</option>
				{subcats.map((s) => (
					<option key={s.slug} value={s.slug}>
						{s.name}
					</option>
				))}
			</select>
		</div>
	);
}

function PriceRange({
	minPrice,
	maxPrice,
	setMinPrice,
	setMaxPrice,
}: {
	minPrice: string;
	maxPrice: string;
	setMinPrice: (v: string) => void;
	setMaxPrice: (v: string) => void;
}) {
	return (
		<div>
			<label className="mb-1 block text-sm font-medium">Price range (₹)</label>
			<div className="flex items-center gap-2">
				<input
					inputMode="numeric"
					pattern="[0-9]*"
					value={minPrice}
					onChange={(e) => setMinPrice(e.target.value)}
					placeholder="Min"
					className="w-1/2 rounded-lg border px-3 py-2"
				/>
				<span className="text-gray-400">—</span>
				<input
					inputMode="numeric"
					pattern="[0-9]*"
					value={maxPrice}
					onChange={(e) => setMaxPrice(e.target.value)}
					placeholder="Max"
					className="w-1/2 rounded-lg border px-3 py-2"
				/>
			</div>
		</div>
	);
}

function SortSelect({
	sort,
	setSort,
}: {
	sort: string;
	setSort: (v: string) => void;
}) {
	return (
		<div>
			<label className="mb-1 block text-sm font-medium">Sort by</label>
			<select
				value={sort}
				onChange={(e) => setSort(e.target.value)}
				className="w-full rounded-lg border px-3 py-2">
				<option value="newest">Newest</option>
				<option value="price-asc">Price: Low to High</option>
				<option value="price-desc">Price: High to Low</option>
			</select>
		</div>
	);
}
