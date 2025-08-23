"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useSession } from "next-auth/react";
import { useMerchantSignup } from "@/lib/store/merchantSignup";
import {
	storeSchema,
	type StoreInput,
	type StoreResponse,
} from "@/lib/validation/merchantSignup";

export default function RegisterStore() {
	const router = useRouter();
	const { status, update } = useSession();

	// Optional: use your store draft if you’ve added it
	// We won’t type-rely on it to avoid blocking you.
	const signup = useMerchantSignup() as any;

	const [serverError, setServerError] = useState<string | null>(null);
	const [loading, setLoading] = useState(false);

	// Select options
	const [cities, setCities] = useState<Array<{ id: string; name: string }>>([]);
	const [areas, setAreas] = useState<
		Array<{ id: string; name: string; pincode?: string | null }>
	>([]);

	const form = useForm<StoreInput>({
		resolver: zodResolver(storeSchema),
		defaultValues: {
			name: signup?.storeDraft?.name ?? "",
			cityId: signup?.storeDraft?.cityId ?? "",
			areaId: signup?.storeDraft?.areaId ?? "",
			addressLine1: signup?.storeDraft?.addressLine1 ?? "",
			addressLine2: signup?.storeDraft?.addressLine2 ?? "",
			pincode: signup?.storeDraft?.pincode ?? "",
			phone: signup?.storeDraft?.phone ?? "",
			description: signup?.storeDraft?.description ?? "",
			storeImage: signup?.storeDraft?.storeImage ?? "",
			geo: signup?.storeDraft?.geo ?? undefined,
		},
		mode: "onChange",
	});

	// Load cities on mount
	useEffect(() => {
		let ignore = false;
		(async () => {
			try {
				const res = await fetch("/api/geo/cities");
				if (!res.ok) return;
				const data = await res.json();
				if (!ignore) setCities(data.cities ?? []);
			} catch {}
		})();
		return () => {
			ignore = true;
		};
	}, []);

	// Watch city → load areas
	const cityId = form.watch("cityId");
	useEffect(() => {
		let ignore = false;
		async function loadAreas() {
			if (!cityId) {
				setAreas([]);
				return;
			}
			try {
				const res = await fetch(
					`/api/geo/areas?cityId=${encodeURIComponent(cityId)}`
				);
				const data = await res.json();
				if (!ignore) setAreas(data.areas ?? []);
			} catch {
				if (!ignore) setAreas([]);
			}
		}
		loadAreas();
		return () => {
			ignore = true;
		};
	}, [cityId]);

	// Auto-fill pincode from selected area (if empty)
	const areaId = form.watch("areaId");
	useEffect(() => {
		if (!areaId) return;
		const a = areas.find((x) => x.id === areaId);
		if (a?.pincode && !form.getValues("pincode")) {
			form.setValue("pincode", a.pincode, { shouldValidate: true });
		}
	}, [areaId, areas, form]);

	// Persist draft to store on change (if your store has setStoreDraft)
	useEffect(() => {
		const sub = form.watch((values) => {
			signup?.setStoreDraft?.(values);
			// backward-compat if you still have businessDraft:
			signup?.setBusinessDraft?.(values);
		});
		return () => sub.unsubscribe();
	}, [form, signup]);

	async function onSubmit(values: StoreInput) {
		setServerError(null);
		setLoading(true);
		try {
			const res = await fetch("/api/merchant/stores", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(values),
			});
			const data: StoreResponse | { error: string } = await res.json();

			if (!res.ok) {
				const e = (data as any)?.error;
				if (e === "AREA_NOT_IN_CITY")
					setServerError("Selected area does not belong to the chosen city.");
				else if (e === "PINCODE_REQUIRED")
					setServerError("Pincode is required for this area.");
				else if (e === "UNAUTHENTICATED")
					setServerError("Please sign in again.");
				else setServerError("Something went wrong. Please try again.");
				return;
			}

			// mark wizard complete in session immediately
			await update?.({ businessCompleted: true });

			// If your store has a markStoreComplete action, call it (non-blocking)
			signup?.markStoreComplete?.();
			signup?.markBusinessComplete?.();

			router.push((data as StoreResponse).next || "/merchant/register/done");
		} catch {
			setServerError("Network error. Please try again.");
		} finally {
			setLoading(false);
		}
	}

	// Optional guard: require auth
	useEffect(() => {
		if (status === "unauthenticated")
			router.replace("/login?callbackUrl=/merchant/register/store");
	}, [status, router]);

	return (
		<div className="min-h-[calc(100dvh-4rem)] flex items-center justify-center px-4 py-10">
			<div className="w-full max-w-md">
				<Header />
				<div className="mt-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
					{serverError ? (
						<p className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
							{serverError}
						</p>
					) : null}

					<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
						<TextField
							label="Store name"
							{...form.register("name")}
							error={form.formState.errors.name?.message}
						/>

						<SelectField
							label="City"
							value={cityId}
							onChange={(e) =>
								form.setValue("cityId", e.target.value, {
									shouldValidate: true,
								})
							}
							options={[{ id: "", name: "Select city" }, ...cities]}
							error={form.formState.errors.cityId?.message}
						/>

						<SelectField
							label="Area"
							value={areaId}
							onChange={(e) =>
								form.setValue("areaId", e.target.value, {
									shouldValidate: true,
								})
							}
							options={[{ id: "", name: "Select area" }, ...areas]}
							error={form.formState.errors.areaId?.message}
						/>

						<TextField
							label="Address line 1"
							{...form.register("addressLine1")}
							error={form.formState.errors.addressLine1?.message}
						/>
						<TextField
							label="Address line 2 (optional)"
							{...form.register("addressLine2")}
							error={form.formState.errors.addressLine2?.message}
						/>

						<TextField
							label="Pincode"
							inputMode="numeric"
							{...form.register("pincode")}
							error={form.formState.errors.pincode?.message}
						/>

						<TextField
							label="Phone (optional)"
							{...form.register("phone")}
							error={form.formState.errors.phone?.message}
						/>
						<TextField
							label="Store image URL (optional)"
							{...form.register("storeImage")}
							error={form.formState.errors.storeImage?.message}
						/>
						<TextField
							label="Description (optional)"
							{...form.register("description")}
							error={form.formState.errors.description?.message}
						/>

						<button
							disabled={loading}
							className="w-full rounded-xl bg-black px-4 py-2 text-white disabled:opacity-60">
							{loading ? "Saving..." : "Save & Continue"}
						</button>
					</form>
				</div>
			</div>
		</div>
	);
}

function Header() {
	return (
		<div className="text-center">
			<h1 className="text-2xl font-semibold tracking-tight">
				Register your store
			</h1>
			<p className="mt-1 text-sm text-gray-600">
				Add your primary store to start selling.
			</p>
			<div className="mt-4 flex items-center justify-center gap-2 text-xs">
				<span className="rounded-full bg-gray-200 px-2 py-0.5 text-gray-700">
					1
				</span>
				<span className="text-gray-400">—</span>
				<span className="rounded-full bg-gray-200 px-2 py-0.5 text-gray-700">
					2
				</span>
				<span className="text-gray-400">—</span>
				<span className="rounded-full bg-black px-2 py-0.5 text-white">4</span>
			</div>
		</div>
	);
}

function TextField({
	label,
	error,
	...rest
}: React.InputHTMLAttributes<HTMLInputElement> & {
	label: string;
	error?: string;
}) {
	return (
		<div>
			<label className="mb-1 block text-sm font-medium">{label}</label>
			<input
				{...rest}
				className="w-full rounded-xl border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black"
			/>
			{error ? <p className="mt-1 text-xs text-red-600">{error}</p> : null}
		</div>
	);
}

function SelectField({
	label,
	value,
	onChange,
	options,
	error,
}: {
	label: string;
	value: string;
	onChange: React.ChangeEventHandler<HTMLSelectElement>;
	options: Array<{ id: string; name: string }>;
	error?: string;
}) {
	return (
		<div>
			<label className="mb-1 block text-sm font-medium">{label}</label>
			<select
				value={value}
				onChange={onChange}
				className="w-full rounded-xl border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black">
				{options.map((o) => (
					<option key={o.id} value={o.id}>
						{o.name}
					</option>
				))}
			</select>
			{error ? <p className="mt-1 text-xs text-red-600">{error}</p> : null}
		</div>
	);
}
