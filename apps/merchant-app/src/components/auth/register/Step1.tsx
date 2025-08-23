"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
	StartInput,
	VerifyInput,
	startSchema,
	verifySchema,
} from "@/lib/validation/merchantSignup";
import { useMerchantSignup } from "@/lib/store/merchantSignup";
import { signIn } from "next-auth/react";

const DEV_SIMULATE = process.env.NEXT_PUBLIC_SIMULATE_OTP === "true";

export default function MerchantRegisterPage() {
	const router = useRouter();
	const { phone, otpToken, devOtp, setStart, setVerified } =
		useMerchantSignup();

	const [loading, setLoading] = useState(false);
	const [serverError, setServerError] = useState<string | null>(null);
	const [passwordMemo, setPasswordMemo] = useState<string>(""); // keep password to signIn after verify

	const isOnOtpStep = Boolean(otpToken);

	return (
		<div className="min-h-[calc(100dvh-4rem)] flex items-center justify-center px-4 py-10">
			<div className="w-full max-w-md">
				<Header currentStep={isOnOtpStep ? 2 : 1} />
				<div className="mt-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
					{serverError ? (
						<p className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
							{serverError}
						</p>
					) : null}

					{!isOnOtpStep ? (
						<StartCard
							onNext={(payload) => {
								setStart(payload);
								setPasswordMemo(payload.password); // remember for signIn
							}}
							setServerError={setServerError}
							setLoading={setLoading}
							loading={loading}
						/>
					) : (
						<OtpCard
							phone={phone!}
							otpToken={otpToken!}
							devOtp={devOtp}
							passwordToSignIn={passwordMemo}
							afterVerify={async () => {
								setVerified();
								// Sign in right after verify using credentials
								// If you wired a credentials provider with phone + password:
								const res = await signIn("credentials", {
									phone,
									password: passwordMemo,
									redirect: false,
								});
								if (res?.error) {
									// Even if signIn fails (e.g., not configured), go next; user is created
									console.warn("signIn error:", res.error);
								}
								router.push("/merchant/register/profile");
							}}
							setServerError={setServerError}
							setLoading={setLoading}
							loading={loading}
						/>
					)}
				</div>

				{DEV_SIMULATE && devOtp ? <DevOtpBanner otp={devOtp} /> : null}
			</div>
		</div>
	);
}

function Header({ currentStep }: { currentStep: 1 | 2 }) {
	return (
		<div className="text-center">
			<h1 className="text-2xl font-semibold tracking-tight">
				Merchant Registration
			</h1>
			<p className="mt-1 text-sm text-gray-600">
				{currentStep === 1
					? "Enter phone and password to receive OTP"
					: "Enter the 6‑digit OTP to verify your phone"}
			</p>
			<div className="mt-4 flex items-center justify-center gap-2 text-xs">
				<span
					className={`rounded-full px-2 py-0.5 ${currentStep >= 1 ? "bg-black text-white" : "bg-gray-200"}`}>
					1
				</span>
				<span className="text-gray-400">—</span>
				<span
					className={`rounded-full px-2 py-0.5 ${currentStep >= 2 ? "bg-black text-white" : "bg-gray-200"}`}>
					2
				</span>
			</div>
		</div>
	);
}

function StartCard({
	onNext,
	setServerError,
	setLoading,
	loading,
}: {
	onNext: (p: {
		phone: string;
		otpToken: string;
		devOtp?: string | null;
		password: string;
	}) => void;
	setServerError: (s: string | null) => void;
	setLoading: (b: boolean) => void;
	loading: boolean;
}) {
	const form = useForm<StartInput>({
		resolver: zodResolver(startSchema),
		defaultValues: { phone: "", password: "" },
		mode: "onChange",
	});

	const handleSubmit = form.handleSubmit(async (values) => {
		setServerError(null);
		setLoading(true);
		try {
			const res = await fetch("/api/auth/merchant/start", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(values),
			});
			const data = await res.json();
			if (!res.ok) {
				if (data?.error === "PHONE_ALREADY_REGISTERED") {
					setServerError(
						"This phone number is already registered. Try signing in."
					);
				} else if (data?.error === "VALIDATION_ERROR") {
					setServerError("Please check the inputs and try again.");
				} else {
					setServerError("Something went wrong. Please try again.");
				}
				return;
			}

			onNext({
				phone: values.phone,
				otpToken: data.otpToken,
				devOtp: data.otp ?? null,
				password: values.password,
			});
		} catch (e) {
			console.error(e);
			setServerError("Network error. Please try again.");
		} finally {
			setLoading(false);
		}
	});

	return (
		<form onSubmit={handleSubmit} className="space-y-4">
			<div>
				<label className="mb-1 block text-sm font-medium">Phone</label>
				<input
					type="tel"
					{...form.register("phone")}
					placeholder="+91XXXXXXXXXX"
					className="w-full rounded-xl border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black"
				/>
				{form.formState.errors.phone ? (
					<p className="mt-1 text-xs text-red-600">
						{form.formState.errors.phone.message}
					</p>
				) : null}
			</div>

			<div>
				<label className="mb-1 block text-sm font-medium">Password</label>
				<input
					type="password"
					{...form.register("password")}
					placeholder="••••••••"
					className="w-full rounded-xl border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black"
				/>
				{form.formState.errors.password ? (
					<p className="mt-1 text-xs text-red-600">
						{form.formState.errors.password.message}
					</p>
				) : null}
			</div>

			<button
				disabled={loading}
				className="w-full rounded-xl bg-black px-4 py-2 text-white disabled:opacity-60">
				{loading ? "Sending OTP..." : "Send OTP"}
			</button>
		</form>
	);
}

function OtpInputs({
	value,
	onChange,
	length = 6,
}: {
	value: string;
	onChange: (v: string) => void;
	length?: number;
}) {
	const values = useMemo(() => {
		const arr = value.split("").slice(0, length);
		while (arr.length < length) arr.push("");
		return arr;
	}, [value, length]);

	return (
		<div className="flex justify-between gap-2">
			{values.map((v, i) => (
				<input
					key={i}
					inputMode="numeric"
					maxLength={1}
					value={v}
					onChange={(e) => {
						const digit = e.target.value.replace(/\D/g, "").slice(0, 1);
						const next = value.slice(0, i) + digit + value.slice(i + 1);
						onChange(next);
						const nextEl = (e.target as HTMLInputElement)
							.nextElementSibling as HTMLInputElement | null;
						if (digit && nextEl) nextEl.focus();
					}}
					className="h-12 w-12 rounded-xl border border-gray-300 text-center text-xl tracking-widest focus:outline-none focus:ring-2 focus:ring-black"
				/>
			))}
		</div>
	);
}

function OtpCard({
	phone,
	otpToken,
	devOtp,
	passwordToSignIn,
	afterVerify,
	setServerError,
	setLoading,
	loading,
}: {
	phone: string;
	otpToken: string;
	devOtp: string | null | undefined;
	passwordToSignIn: string;
	afterVerify: () => void | Promise<void>;
	setServerError: (s: string | null) => void;
	setLoading: (b: boolean) => void;
	loading: boolean;
}) {
	const form = useForm<VerifyInput>({
		resolver: zodResolver(verifySchema),
		defaultValues: { otpToken, otp: "" },
		mode: "onChange",
	});

	const otpValue = form.watch("otp");

	const onSubmit = form.handleSubmit(async (values) => {
		setServerError(null);
		setLoading(true);
		try {
			const res = await fetch("/api/auth/merchant/verify", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(values),
			});
			const data = await res.json();
			if (!res.ok) {
				if (data?.error === "OTP_INVALID")
					setServerError("Invalid OTP. Try again.");
				else if (data?.error === "OTP_EXPIRED")
					setServerError("OTP expired. Please restart signup.");
				else if (data?.error === "OTP_TOO_MANY_ATTEMPTS")
					setServerError("Too many attempts. Try later.");
				else setServerError("Something went wrong. Please try again.");
				return;
			}

			await afterVerify();
		} catch (e) {
			console.error(e);
			setServerError("Network error. Please try again.");
		} finally {
			setLoading(false);
		}
	});

	return (
		<form onSubmit={onSubmit} className="space-y-4">
			<div className="text-sm text-gray-600">
				OTP has been sent to <span className="font-medium">{phone}</span>
			</div>

			<OtpInputs
				value={otpValue}
				onChange={(v) => form.setValue("otp", v, { shouldValidate: true })}
			/>
			{form.formState.errors.otp ? (
				<p className="text-xs text-red-600">
					{form.formState.errors.otp.message}
				</p>
			) : null}

			{/* Hidden input for token (kept in state) */}
			<input
				type="hidden"
				{...form.register("otpToken")}
				value={otpToken}
				readOnly
			/>

			<button
				disabled={loading || otpValue.length !== 6}
				className="w-full rounded-xl bg-black px-4 py-2 text-white disabled:opacity-60">
				{loading ? "Verifying..." : "Verify"}
			</button>

			<p className="text-center text-xs text-gray-500">
				Didn’t get the code? For now, restart the flow or enable dev OTP.
			</p>
			{DEV_SIMULATE && devOtp ? (
				<p className="text-center text-xs text-gray-500">
					Dev OTP is shown below.
				</p>
			) : null}
		</form>
	);
}

function DevOtpBanner({ otp }: { otp: string }) {
	return (
		<div className="mt-4 rounded-xl border border-dashed border-gray-300 bg-gray-50 p-3 text-center text-sm text-gray-700">
			<span className="font-semibold">DEV MODE:</span> OTP is{" "}
			<span className="font-mono">{otp}</span>
		</div>
	);
}
