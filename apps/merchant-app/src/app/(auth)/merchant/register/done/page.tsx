import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function Page() {
	const session = await getServerSession(authOptions);
	if (!session) redirect("/login?callbackUrl=/merchant/register/done");

	// If you want to strictly require a store before showing "done", uncomment:
	// if (!session.user.storeCompleted) redirect("/merchant/register/store");

	const name = session.user?.name ?? null;
	const first = name?.split(" ")[0] ?? "There";

	return (
		<div className="relative min-h-[calc(100dvh-4rem)] bg-gradient-to-b from-white to-gray-50 px-4 py-10">
			<div className="mx-auto w-full max-w-2xl">
				<Hero />

				<div className="mt-6 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
					<div className="relative px-6 pb-6 pt-8 sm:px-8">
						<SuccessBadge />

						<h1 className="mt-4 text-center text-2xl font-semibold tracking-tight">
							You’re all set, {first}! 🎉
						</h1>
						<p className="mt-2 text-center text-sm text-gray-600">
							Your merchant account is verified and your first store is
							registered. You can start adding products right away.
						</p>

						<div className="mt-6 grid gap-3 sm:grid-cols-2">
							<Link
								href="/merchant/products/new"
								className="inline-flex items-center justify-center rounded-xl bg-black px-4 py-2 text-sm font-medium text-white hover:opacity-90">
								Add first product
							</Link>
							<Link
								href="/merchant/dashboard"
								className="inline-flex items-center justify-center rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm font-medium hover:bg-gray-50">
								Go to dashboard
							</Link>
						</div>

						<div className="mt-6 rounded-xl bg-gray-50 p-4">
							<h2 className="text-sm font-medium">Recommended next steps</h2>
							<ul className="mt-3 space-y-2 text-sm text-gray-700">
								<StepItem
									label="Upload a store logo"
									href="/merchant/settings/store"
								/>
								<StepItem
									label="Set delivery areas & timings"
									href="/merchant/settings/delivery"
								/>
								<StepItem
									label="Create categories and tags for products"
									href="/merchant/products/categories"
								/>
								<StepItem
									label="Invite a staff member (optional)"
									href="/merchant/settings/team"
								/>
							</ul>
						</div>
					</div>

					<Divider />

					<div className="px-6 py-5 sm:px-8">
						<h3 className="text-sm font-medium text-gray-900">Quick links</h3>
						<div className="mt-3 flex flex-wrap gap-2">
							<QuickLink href="/merchant/stores" label="View stores" />
							<QuickLink href="/merchant/orders" label="Orders" />
							<QuickLink href="/merchant/products" label="Products" />
							<QuickLink href="/me" label="My account" />
						</div>
					</div>
				</div>

				<FooterNote />
			</div>
		</div>
	);
}

function Hero() {
	return (
		<div className="relative mx-auto flex w-full max-w-2xl items-center justify-center">
			{/* Decorative burst */}
			<div className="pointer-events-none absolute inset-0 -z-10 blur-3xl">
				<div className="mx-auto h-40 w-40 rounded-full bg-gradient-to-tr from-emerald-400/40 to-sky-400/40" />
			</div>
		</div>
	);
}

function SuccessBadge() {
	return (
		<div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-sky-500 shadow-md ring-8 ring-emerald-100/60">
			<svg
				viewBox="0 0 24 24"
				className="h-8 w-8 text-white"
				aria-hidden="true">
				<path
					fill="currentColor"
					d="M9.0 16.2 4.8 12l1.4-1.4L9 13.4l8.8-8.8L19.2 6 9 16.2z"
				/>
			</svg>
		</div>
	);
}

function Divider() {
	return <div className="mx-6 border-t border-gray-200 sm:mx-8" />;
}

function StepItem({ label, href }: { label: string; href: string }) {
	return (
		<li className="flex items-center justify-between rounded-lg border border-gray-200 bg-white px-3 py-2">
			<div className="flex items-center gap-2">
				<span className="inline-block h-2.5 w-2.5 rounded-full bg-emerald-500" />
				<span>{label}</span>
			</div>
			<Link href={href} className="text-xs underline hover:opacity-80">
				Open
			</Link>
		</li>
	);
}

function QuickLink({ href, label }: { href: string; label: string }) {
	return (
		<Link
			href={href}
			className="inline-flex items-center gap-2 rounded-full border border-gray-300 bg-white px-3 py-1.5 text-xs hover:bg-gray-50">
			<span className="inline-block h-1.5 w-1.5 rounded-full bg-gray-400" />
			{label}
		</Link>
	);
}

function FooterNote() {
	return (
		<p className="mt-6 text-center text-xs text-gray-500">
			Tip: You can revisit the registration steps anytime from{" "}
			<Link href="/me" className="underline">
				My account
			</Link>
			.
		</p>
	);
}
