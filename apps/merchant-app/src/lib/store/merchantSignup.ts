// /store/merchantSignup.ts
import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";

export type ProfileDraft = {
	name?: string | null;
	email?: string | null;
	phone?: string;
};

export type StoreDraft = {
	name?: string;
	categoryId?: string;
	subcategoryId?: string;
	cityId?: string;
	areaId?: string;
	addressLine1?: string;
	landmark?: string;
	pincode?: string;
	lat?: number | null;
	lng?: number | null;
};

type MerchantSignupState = {
	// Step 1/2
	phone: string | null;
	otpToken: string | null; // returned from /auth/merchant/start
	devOtp: string | null; // shown only in DEV
	// Step 3
	profileDraft: ProfileDraft;
	// Step 4
	businessDraft: StoreDraft;

	// Status flags (optional but handy for guarding steps)
	hasVerifiedPhone: boolean;
	hasCompletedProfile: boolean;
	hasRegisteredBusiness: boolean;

	// Actions
	setStart(payload: {
		phone: string;
		otpToken: string;
		devOtp?: string | null;
	}): void;
	setVerified(): void;
	setProfileDraft(patch: Partial<ProfileDraft>): void;
	markProfileComplete(): void;
	setBusinessDraft(patch: Partial<StoreDraft>): void;
	markBusinessComplete(): void;
	clearAll(): void;
};

export const useMerchantSignup = create<MerchantSignupState>()(
	devtools(
		persist(
			(set) => ({
				phone: null,
				otpToken: null,
				devOtp: null,
				profileDraft: {},
				businessDraft: {},
				hasVerifiedPhone: false,
				hasCompletedProfile: false,
				hasRegisteredBusiness: false,

				setStart: ({ phone, otpToken, devOtp = null }) =>
					set(() => ({ phone, otpToken, devOtp })),

				setVerified: () =>
					set(() => ({ hasVerifiedPhone: true, devOtp: null })),

				setProfileDraft: (patch) =>
					set((s) => ({ profileDraft: { ...s.profileDraft, ...patch } })),

				markProfileComplete: () => set(() => ({ hasCompletedProfile: true })),

				setBusinessDraft: (patch) =>
					set((s) => ({ businessDraft: { ...s.businessDraft, ...patch } })),

				markBusinessComplete: () =>
					set(() => ({ hasRegisteredBusiness: true })),

				clearAll: () =>
					set(() => ({
						phone: null,
						otpToken: null,
						devOtp: null,
						profileDraft: {},
						businessDraft: {},
						hasVerifiedPhone: false,
						hasCompletedProfile: false,
						hasRegisteredBusiness: false,
					})),
			}),
			{ name: "merchant-signup" }
		)
	)
);

// Optional selectors for cleaner imports
export const useSignupPhone = () => useMerchantSignup((s) => s.phone);
export const useSignupOtpToken = () => useMerchantSignup((s) => s.otpToken);
export const useProfileDraft = () => useMerchantSignup((s) => s.profileDraft);
export const useBusinessDraft = () => useMerchantSignup((s) => s.businessDraft);
