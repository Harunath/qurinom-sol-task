// lib/store/signup.ts
import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";

type UserSignupState = {
	// Step 1 only
	phone: string | null;
	password: string | null; // captured during step 1
	otpToken: string | null; // from /auth/user/start
	devOtp: string | null; // shown only in DEV

	// Status
	hasVerifiedPhone: boolean;

	// Actions
	setStart(payload: {
		phone: string;
		password: string;
		otpToken: string;
		devOtp?: string | null;
	}): void;
	setVerified(): void;
	clearAll(): void;
};

export const useUserSignup = create<UserSignupState>()(
	devtools(
		persist(
			(set) => ({
				phone: null,
				password: null,
				otpToken: null,
				devOtp: null,
				hasVerifiedPhone: false,

				setStart: ({ phone, password, otpToken, devOtp = null }) =>
					set(() => ({ phone, password, otpToken, devOtp })),

				setVerified: () =>
					set(() => ({ hasVerifiedPhone: true, devOtp: null })),

				clearAll: () =>
					set(() => ({
						phone: null,
						password: null,
						otpToken: null,
						devOtp: null,
						hasVerifiedPhone: false,
					})),
			}),
			{
				name: "user-signup",
				version: 2,
				// drop old address fields from persisted state
				migrate: (state: any, version) => {
					if (version < 2 && state) {
						delete state.addressDraft;
						delete state.hasCompletedAddress;
					}
					return state as UserSignupState;
				},
			}
		)
	)
);

// Selectors
export const useUserSignupPhone = () => useUserSignup((s) => s.phone);
export const useUserSignupOtpToken = () => useUserSignup((s) => s.otpToken);
export const useUserSignupIsVerified = () =>
	useUserSignup((s) => s.hasVerifiedPhone);
