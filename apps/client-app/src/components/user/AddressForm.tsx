"use client";

import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { addressSchema as baseAddressSchema } from "@/lib/validation/address";

const addressSchema = baseAddressSchema.extend({
	isDefault: z.boolean(),
});
import { useAddresses } from "@/lib/store/addresses";

type AddressInput = z.infer<typeof addressSchema> & {
	isDefault: boolean;
};

type Props = {
	mode?: "create" | "edit";
	initial?: Partial<AddressInput>;
	addressId?: string;
	onSuccess?: (id?: string) => void;
};

export default function AddressForm({
	mode = "create",
	initial,
	addressId,
	onSuccess,
}: Props) {
	const {
		states,
		citiesByState,
		areasByCity,
		loadStates,
		loadCities,
		loadAreas,
		create,
		update,
	} = useAddresses();

	const form = useForm<AddressInput>({
		resolver: zodResolver(addressSchema),
		defaultValues: {
			stateId: initial?.stateId ?? "",
			cityId: initial?.cityId ?? "",
			areaId: initial?.areaId ?? "",
			addressLine1: initial?.addressLine1 ?? "",
			addressLine2: (initial as any)?.addressLine2 ?? "",
			pincode: initial?.pincode ?? "",
			isDefault:
				typeof initial?.isDefault === "boolean" ? initial.isDefault : false,
		},
		mode: "onChange",
	});

	const [submitting, setSubmitting] = useState(false);

	const stateId = form.watch("stateId");
	const cityId = form.watch("cityId");

	// Load states and hydrate dependent lists if editing/pre-filled
	useEffect(() => {
		loadStates();
		if (form.getValues("stateId")) loadCities(form.getValues("stateId"));
		if (form.getValues("cityId")) loadAreas(form.getValues("cityId"));
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	useEffect(() => {
		if (!stateId) {
			form.setValue("cityId", "");
			form.setValue("areaId", "");
			return;
		}
		loadCities(stateId);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [stateId]);

	useEffect(() => {
		if (!cityId) {
			form.setValue("areaId", "");
			return;
		}
		loadAreas(cityId);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [cityId]);

	const onSubmit = async (values: AddressInput) => {
		setSubmitting(true);
		try {
			if (mode === "edit" && addressId) {
				const r = await update(addressId, values);
				if (!r.ok) {
					alert("Failed to save address");
					return;
				}
				onSuccess?.(addressId);
			} else {
				const r = await create(values);
				if (!r.ok) {
					alert("Failed to add address");
					return;
				}
				onSuccess?.(r.id);
			}
		} finally {
			setSubmitting(false);
		}
	};

	const disabled = useMemo(
		() => submitting || !form.formState.isValid,
		[submitting, form.formState.isValid]
	);

	const cities = stateId ? (citiesByState[stateId] ?? []) : [];
	const areas = cityId ? (areasByCity[cityId] ?? []) : [];

	return (
		<form
			onSubmit={form.handleSubmit(onSubmit)}
			className="mx-auto w-full max-w-xl space-y-4 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
			<h2 className="text-xl font-semibold tracking-tight">Address</h2>

			<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
				<div>
					<label className="mb-1 block text-sm font-medium">State</label>
					<select
						className="w-full rounded-xl border px-3 py-2"
						{...form.register("stateId")}>
						<option value="">Select state</option>
						{states.map((s) => (
							<option key={s.id} value={s.id}>
								{s.name}
							</option>
						))}
					</select>
					{form.formState.errors.stateId && (
						<p className="mt-1 text-xs text-red-600">
							{form.formState.errors.stateId.message}
						</p>
					)}
				</div>

				<div>
					<label className="mb-1 block text-sm font-medium">City</label>
					<select
						className="w-full rounded-xl border px-3 py-2"
						{...form.register("cityId")}
						disabled={!stateId}>
						<option value="">
							{stateId ? "Select city" : "Select state first"}
						</option>
						{cities.map((c) => (
							<option key={c.id} value={c.id}>
								{c.name}
							</option>
						))}
					</select>
					{form.formState.errors.cityId && (
						<p className="mt-1 text-xs text-red-600">
							{form.formState.errors.cityId.message}
						</p>
					)}
				</div>

				<div>
					<label className="mb-1 block text-sm font-medium">Area</label>
					<select
						className="w-full rounded-xl border px-3 py-2"
						{...form.register("areaId")}
						disabled={!cityId}>
						<option value="">
							{cityId ? "Select area" : "Select city first"}
						</option>
						{areas.map((a) => (
							<option key={a.id} value={a.id}>
								{a.name}
							</option>
						))}
					</select>
					{form.formState.errors.areaId && (
						<p className="mt-1 text-xs text-red-600">
							{form.formState.errors.areaId.message}
						</p>
					)}
				</div>

				<div>
					<label className="mb-1 block text-sm font-medium">Pincode</label>
					<input
						className="w-full rounded-xl border px-3 py-2"
						placeholder="500001"
						{...form.register("pincode")}
					/>
					{form.formState.errors.pincode && (
						<p className="mt-1 text-xs text-red-600">
							{form.formState.errors.pincode.message}
						</p>
					)}
				</div>
			</div>

			<div>
				<label className="mb-1 block text-sm font-medium">Address line</label>
				<input
					className="w-full rounded-xl border px-3 py-2"
					placeholder="House / Flat, Street, Landmark"
					{...form.register("addressLine1")}
				/>
				{form.formState.errors.addressLine1 && (
					<p className="mt-1 text-xs text-red-600">
						{form.formState.errors.addressLine1.message}
					</p>
				)}
			</div>

			<div>
				<label className="mb-1 block text-sm font-medium">
					Address line 2 (optional)
				</label>
				<input
					className="w-full rounded-xl border px-3 py-2"
					placeholder="Area / Apartment details"
					{...form.register("addressLine2")}
				/>
			</div>

			<div className="flex items-center justify-between">
				<label className="flex items-center gap-2 text-sm">
					<input type="checkbox" {...form.register("isDefault")} />
					Set as default
				</label>

				<button
					type="submit"
					disabled={disabled}
					className="rounded-xl bg-black px-4 py-2 text-white disabled:opacity-60">
					{mode === "edit"
						? submitting
							? "Saving..."
							: "Save changes"
						: submitting
							? "Adding..."
							: "Add address"}
				</button>
			</div>
		</form>
	);
}
