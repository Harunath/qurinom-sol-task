// app/user/register/done/page.tsx
"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function DonePage() {
	const router = useRouter();
	const search = useSearchParams();
	const next = search.get("next") || "/"; // pass ?next=/path-to-your-highlighted-menu

	useEffect(() => {
		const t = setTimeout(() => router.replace(next), 3000); // ~3s
		return () => clearTimeout(t);
	}, [router, next]);

	return (
		<div className="mx-auto flex min-h-[60vh] max-w-xl flex-col items-center justify-center px-4 text-center">
			<div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
				<svg
					viewBox="0 0 24 24"
					className="h-8 w-8 text-green-600"
					fill="none"
					stroke="currentColor"
					strokeWidth="2">
					<path
						d="M20 6L9 17l-5-5"
						strokeLinecap="round"
						strokeLinejoin="round"
					/>
				</svg>
			</div>

			<h1 className="mb-2 text-2xl font-bold tracking-tight">All set!</h1>
			<p className="mb-6 text-gray-600">
				Your address was saved. Redirecting to the next page…
			</p>

			<button
				onClick={() => router.replace(next)}
				className="rounded-xl bg-black px-4 py-2 text-white">
				Go now
			</button>
		</div>
	);
}
