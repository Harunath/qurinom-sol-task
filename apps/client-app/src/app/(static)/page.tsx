// app/page.tsx
import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import OffersGrid from "@/components/static/home/OfferGrid";

export default async function Page() {
	const session = await getServerSession(authOptions);
	const href = session?.user ? "/store" : "/register";
	const label = session?.user ? "Go to Store" : "Create your account";

	return (
		<main className="min-h-screen bg-white text-gray-900">
			{/* Hero */}
			<section className="mx-auto max-w-6xl px-4 py-20">
				<div className="grid gap-10 lg:grid-cols-2 lg:items-center">
					<div>
						<h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl">
							Discover products from local merchants
						</h1>
						<p className="mt-4 text-lg text-gray-600">
							Fashion, Electronics, and Home Essentials—browse by category,
							filter by price & location, and enjoy a smooth checkout.
						</p>

						<div className="mt-8 flex flex-wrap items-center gap-3">
							<Link
								href={href}
								className="rounded-xl bg-gray-900 px-5 py-3 text-sm font-semibold text-white hover:opacity-90">
								{label}
							</Link>
							<Link
								href="/categories"
								className="rounded-xl border px-5 py-3 text-sm font-medium hover:bg-gray-50">
								Explore categories
							</Link>
						</div>
					</div>

					{/* Visual placeholder */}
					<div className="relative">
						<div className="pointer-events-none absolute -inset-4 -z-10 rounded-3xl bg-gradient-to-tr from-gray-100 to-white" />
						<div className="rounded-3xl border bg-white p-4 shadow-sm">
							<OffersGrid />
						</div>
						<p className="mt-3 text-center text-sm text-gray-500">
							Sneak peek: curated cards for categories and deals
						</p>
					</div>
				</div>
			</section>

			{/* Footer */}
			<footer className="border-t">
				<div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-8 text-sm text-gray-500">
					<span>© {new Date().getFullYear()} Qurinom</span>
					<div className="flex items-center gap-4">
						<Link className="hover:text-gray-700" href="/privacy">
							Privacy
						</Link>
						<Link className="hover:text-gray-700" href="/terms">
							Terms
						</Link>
						<Link className="hover:text-gray-700" href="/contact">
							Contact
						</Link>
					</div>
				</div>
			</footer>
		</main>
	);
}
