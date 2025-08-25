"use client";

import useSWR from "swr";
import AddressForm from "@/components/user/AddressForm";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function AddressesPage() {
	const { data, mutate } = useSWR("/api/user/addresses", fetcher);

	return (
		<div className="mx-auto max-w-4xl px-4 py-10 space-y-8">
			<h1 className="text-2xl font-bold tracking-tight">Your Addresses</h1>

			<section className="space-y-3">
				{data?.data?.map((a: any) => (
					<div key={a.id} className="rounded-2xl border p-4">
						<div className="flex items-center justify-between">
							<div>
								<p className="font-medium">
									{a.addressLine1}
									{a.addressLine2 ? `, ${a.addressLine2}` : ""}
								</p>
								<p className="text-sm text-gray-600">PIN: {a.pincode}</p>
								{a.isDefault && (
									<span className="mt-1 inline-block rounded-full border px-2 py-0.5 text-xs">
										Default
									</span>
								)}
							</div>
							<div className="flex gap-2">
								<button
									onClick={async () => {
										await fetch(`/api/user/addresses/${a.id}/set-default`, {
											method: "POST",
										});
										mutate();
									}}
									className="rounded-xl border px-3 py-1 text-sm">
									Set default
								</button>
								<button
									onClick={async () => {
										await fetch(`/api/user/addresses/${a.id}`, {
											method: "DELETE",
										});
										mutate();
									}}
									className="rounded-xl border px-3 py-1 text-sm">
									Delete
								</button>
							</div>
						</div>
					</div>
				))}
			</section>

			<section>
				<h2 className="mb-3 text-lg font-semibold">Add new address</h2>
				<AddressForm mode="create" onSuccess={() => mutate()} />
			</section>
		</div>
	);
}
