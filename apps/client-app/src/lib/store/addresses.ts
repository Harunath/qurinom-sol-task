// lib/store/addresses.ts
import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
import { z } from "zod";

/** Enum for address type (keeps scope for HOME/WORK/OTHER) */
export const AddressTypeEnum = z.enum(["HOME", "WORK", "OTHER"]);
export type AddressType = z.infer<typeof AddressTypeEnum>;

/** Validation schema (exported for forms) */
export const addressSchema = z.object({
	stateId: z.string().min(1, "State is required"),
	cityId: z.string().min(1, "City is required"),
	// area can be optional (nullable) depending on your data (Area?)
	areaId: z.string().min(1).optional().nullable(),

	addressLine1: z.string().min(3, "Address line is too short").max(200),
	addressLine2: z.string().optional().nullable(),

	pincode: z
		.string()
		.min(5, "Pincode is too short")
		.max(10, "Pincode is too long"),

	// optional fields supported by your Prisma model
	type: AddressTypeEnum.optional().default("HOME"),
	label: z.string().optional().nullable(),
	lat: z.number().optional(),
	lng: z.number().optional(),

	isDefault: z.boolean().optional().default(false),
});

/** Use the schema for your form values and API payload */
export type AddressInput = z.input<typeof addressSchema>; // pre-parse (type can be omitted)

export type Option = { id: string; name: string };

export type AddressDTO = {
	id: string;
	stateId: string;
	cityId: string;
	areaId?: string | null;
	addressLine1: string;
	addressLine2?: string | null;
	pincode: string;
	isDefault: boolean;
	createdAt: string;
	updatedAt: string;

	// keep parity with model (optional in responses)
	type?: AddressType;
	label?: string | null;
	lat?: number | null;
	lng?: number | null;
};

type AddressStore = {
	// Address list
	items: AddressDTO[];
	isLoading: boolean;
	error: string | null;

	// Location options cache
	states: Option[];
	citiesByState: Record<string, Option[]>;
	areasByCity: Record<string, Option[]>;

	// Actions: list
	fetchAll: () => Promise<void>;

	// Actions: CRUD
	create: (payload: AddressInput) => Promise<{ ok: boolean; id?: string }>;
	update: (
		id: string,
		payload: Partial<AddressInput>
	) => Promise<{ ok: boolean }>;
	remove: (id: string) => Promise<{ ok: boolean }>;
	setDefault: (id: string) => Promise<{ ok: boolean }>;

	// Actions: options
	loadStates: () => Promise<void>;
	loadCities: (stateId: string) => Promise<void>;
	loadAreas: (cityId: string) => Promise<void>;

	// Utils
	upsertLocal: (addr: AddressDTO) => void;
	clear: () => void;
};

export const useAddresses = create<AddressStore>()(
	devtools(
		persist(
			(set, get) => ({
				items: [],
				isLoading: false,
				error: null,

				states: [],
				citiesByState: {},
				areasByCity: {},

				fetchAll: async () => {
					set({ isLoading: true, error: null });
					try {
						const r = await fetch("/api/user/addresses", { cache: "no-store" });
						const j = await r.json();
						if (!r.ok || !j.ok)
							throw new Error(j.error || "Failed to fetch addresses");
						set({ items: j.data, isLoading: false });
					} catch (e: any) {
						set({ error: e.message ?? "Error", isLoading: false });
					}
				},

				create: async (payload) => {
					// (Optional) client-side guard with zod
					const parsed = addressSchema.safeParse(payload);
					if (!parsed.success) return { ok: false };

					const r = await fetch("/api/user/addresses", {
						method: "POST",
						headers: { "Content-Type": "application/json" },
						body: JSON.stringify(parsed.data),
					});
					const j = await r.json();
					if (!r.ok || !j.ok) return { ok: false };

					const created: AddressDTO = j.data;
					const items = get().items.slice();
					if (created.isDefault)
						items.forEach((a) => (a.isDefault = a.id === created.id));
					set({ items: [created, ...items] });
					return { ok: true, id: created.id };
				},

				update: async (id, payload) => {
					// allow partial updates — validate only provided fields
					const r = await fetch(`/api/user/addresses/${id}`, {
						method: "PATCH",
						headers: { "Content-Type": "application/json" },
						body: JSON.stringify(payload),
					});
					const j = await r.json();
					if (!r.ok || !j.ok) return { ok: false };

					const updated: AddressDTO = j.data;
					const items = get().items.map((a) =>
						a.id === id ? { ...a, ...updated } : a
					);
					if (updated.isDefault)
						items.forEach((a) => (a.isDefault = a.id === id));
					set({ items });
					return { ok: true };
				},

				remove: async (id) => {
					const r = await fetch(`/api/user/addresses/${id}`, {
						method: "DELETE",
					});
					if (!r.ok) return { ok: false };
					set({ items: get().items.filter((a) => a.id !== id) });
					return { ok: true };
				},

				setDefault: async (id) => {
					const r = await fetch(`/api/user/addresses/${id}/set-default`, {
						method: "POST",
					});
					const ok = r.ok;
					if (ok) {
						const items = get().items.map((a) => ({
							...a,
							isDefault: a.id === id,
						}));
						set({ items });
					}
					return { ok };
				},

				loadStates: async () => {
					if (get().states.length) return;
					const r = await fetch("/api/locations/states");
					const j = await r.json();
					if (j.ok) set({ states: j.data });
				},

				loadCities: async (stateId: string) => {
					if (!stateId) return;
					if (get().citiesByState[stateId]?.length) return;
					const r = await fetch(`/api/locations/cities?stateId=${stateId}`);
					const j = await r.json();
					if (j.ok) {
						set((s) => ({
							citiesByState: { ...s.citiesByState, [stateId]: j.data },
						}));
					}
				},

				loadAreas: async (cityId: string) => {
					if (!cityId) return;
					if (get().areasByCity[cityId]?.length) return;
					const r = await fetch(`/api/locations/areas?cityId=${cityId}`);
					const j = await r.json();
					if (j.ok) {
						set((s) => ({
							areasByCity: { ...s.areasByCity, [cityId]: j.data },
						}));
					}
				},

				upsertLocal: (addr) => {
					const exists = get().items.some((a) => a.id === addr.id);
					if (exists) {
						set((s) => ({
							items: s.items.map((a) => (a.id === addr.id ? addr : a)),
						}));
					} else {
						set((s) => ({ items: [addr, ...s.items] }));
					}
				},

				clear: () =>
					set({
						items: [],
						isLoading: false,
						error: null,
						states: [],
						citiesByState: {},
						areasByCity: {},
					}),
			}),
			{ name: "addresses-store", version: 2 }
		)
	)
);
