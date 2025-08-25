"use client";

import Link from "next/link";
import { useState } from "react";
import AuthActions from "./AuthActions";

export default function Navbar() {
	const [open, setOpen] = useState(false);

	return (
		<header className="w-full border-b bg-white">
			<nav className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
				{/* Left: Logo */}
				<Link href="/" className="flex items-center gap-2 shrink-0">
					<div className="grid h-9 w-9 place-items-center rounded-xl bg-black text-white font-bold">
						Q
					</div>
					<span className="text-lg font-semibold tracking-tight">Qurinom</span>
				</Link>

				<div className="flex items-center justify-end gap-3 px-4 py-3">
					{/* Desktop links */}
					<div className="hidden items-center gap-6 md:flex">
						<Link
							href="/products"
							className="rounded-lg border px-3 py-2 text-sm font-medium hover:bg-gray-50">
							Store
						</Link>
					</div>

					{/* Right: Auth / Mobile toggle */}
					<div className="flex items-center gap-2">
						<button
							className="inline-flex h-9 w-9 items-center justify-center rounded-lg border md:hidden"
							aria-label="Toggle menu"
							onClick={() => setOpen((s) => !s)}>
							<span className="sr-only">Menu</span>
							<div className="space-y-1.5">
								<span className="block h-0.5 w-5 bg-gray-900"></span>
								<span className="block h-0.5 w-5 bg-gray-900"></span>
								<span className="block h-0.5 w-5 bg-gray-900"></span>
							</div>
						</button>

						{/* Auth actions (loading → profile or login/signup) */}
						<AuthActions />
					</div>
				</div>
			</nav>

			{/* Mobile menu */}
			{open && (
				<div className="md:hidden border-t">
					<div className="mx-auto max-w-6xl px-4 py-3">
						<Link
							href="/store"
							className="block rounded-lg px-3 py-2 text-sm font-medium hover:bg-gray-50"
							onClick={() => setOpen(false)}>
							Store
						</Link>
					</div>
				</div>
			)}
		</header>
	);
}
