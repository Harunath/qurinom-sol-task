import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function MePage() {
	const session = await getServerSession(authOptions);
	if (!session) redirect("/login");

	const u = session.user;

	const isMerchant = u.role === "MERCHANT";
	const phoneVerified = !!u.phoneVerified;
	const businessDone = !!u.storeCompleted;

	const registrationDone = isMerchant ? phoneVerified && businessDone : true;

	return (
		<div className="min-h-[calc(100dvh-4rem)] flex items-center justify-center px-4 py-10">
			<div className="w-full max-w-md">
				<Header />

				<div className="mt-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm space-y-4">
					<section className="space-y-1">
						<h2 className="text-lg font-semibold tracking-tight">Account</h2>
						<div className="text-sm text-gray-600">
							<div className="flex items-center justify-between">
								<span>Role</span>
								<span className="font-medium">{u.role}</span>
							</div>
							<div className="flex items-center justify-between">
								<span>Phone</span>
								<span className="font-medium">{u.phone ?? "—"}</span>
							</div>
							<div className="flex items-center justify-between">
								<span>Email</span>
								<span className="font-medium">{u.email ?? "—"}</span>
							</div>
						</div>
					</section>

					{isMerchant && (
						<section className="space-y-2">
							<h2 className="text-lg font-semibold tracking-tight">
								Registration status
							</h2>

							<StatusRow label="Phone verified" ok={phoneVerified} />
							<StatusRow
								label="Business registered"
								ok={businessDone}
								actionHref="/merchant/register/business"
							/>

							<div className="mt-2 rounded-xl bg-gray-50 p-3 text-sm">
								{registrationDone ? (
									<p className="text-green-700">
										✅ Registration complete. You’re all set!
									</p>
								) : (
									<p className="text-gray-700">
										Finish the remaining steps to complete your registration.
									</p>
								)}
							</div>

							{!registrationDone && (
								<div className="flex gap-2 pt-2">
									{!businessDone && (
										<Link
											href="/merchant/register/business"
											className="flex-1 rounded-xl bg-black px-4 py-2 text-center text-white">
											Register business
										</Link>
									)}
								</div>
							)}
						</section>
					)}
				</div>
			</div>
		</div>
	);
}

function Header() {
	return (
		<div className="text-center">
			<h1 className="text-2xl font-semibold tracking-tight">My Account</h1>
			<p className="mt-1 text-sm text-gray-600">
				View your account and registration progress
			</p>
		</div>
	);
}

function StatusRow({
	label,
	ok,
	actionHref,
}: {
	label: string;
	ok: boolean;
	actionHref?: string;
}) {
	return (
		<div className="flex items-center justify-between rounded-xl border border-gray-200 px-3 py-2">
			<div className="flex items-center gap-2">
				<span
					className={`inline-block h-2.5 w-2.5 rounded-full ${
						ok ? "bg-green-500" : "bg-gray-300"
					}`}
				/>
				<span className="text-sm">{label}</span>
			</div>
			<div className="flex items-center gap-2">
				<span className={`text-xs ${ok ? "text-green-700" : "text-gray-500"}`}>
					{ok ? "Done" : "Pending"}
				</span>
				{!ok && actionHref ? (
					<a href={actionHref} className="text-xs underline hover:opacity-80">
						Continue
					</a>
				) : null}
			</div>
		</div>
	);
}
