"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

export default function Pagination({ totalPages }: { totalPages: number }) {
	const router = useRouter();
	const pathname = usePathname();
	const sp = useSearchParams();
	const page = Number(sp.get("page") ?? "1");

	function go(p: number) {
		const next = new URLSearchParams(sp.toString());
		next.set("page", String(p));
		router.push(`${pathname}?${next.toString()}`);
	}

	if (totalPages <= 1) return null;

	return (
		<nav className="flex items-center justify-center gap-2">
			<button
				onClick={() => go(1)}
				disabled={page <= 1}
				className="rounded-lg border px-3 py-1 disabled:opacity-50">
				First
			</button>
			<button
				onClick={() => go(page - 1)}
				disabled={page <= 1}
				className="rounded-lg border px-3 py-1 disabled:opacity-50">
				Prev
			</button>
			<span className="rounded-lg border px-3 py-1 text-sm">
				{page} / {totalPages}
			</span>
			<button
				onClick={() => go(page + 1)}
				disabled={page >= totalPages}
				className="rounded-lg border px-3 py-1 disabled:opacity-50">
				Next
			</button>
			<button
				onClick={() => go(totalPages)}
				disabled={page >= totalPages}
				className="rounded-lg border px-3 py-1 disabled:opacity-50">
				Last
			</button>
		</nav>
	);
}
