"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { UseFormRegister } from "react-hook-form";

// Reuse your registration schema for phone+password validation
import { startSchema, type StartInput } from "@/lib/validation/user";

export default function LoginPage() {
	const router = useRouter();
	const params = useSearchParams();
	const callbackUrl = params.get("callbackUrl") || "/me";
	const nextAuthError = params.get("error"); // e.g., "CredentialsSignin"

	const [loading, setLoading] = useState(false);
	const [serverError, setServerError] = useState<string | null>(null);

	const form = useForm<StartInput>({
		resolver: zodResolver(startSchema),
		defaultValues: { phone: "", password: "" },
		mode: "onChange",
	});

	// Map NextAuth error query to a friendly message
	const initialBanner =
		nextAuthError === "CredentialsSignin"
			? "Invalid phone or password."
			: nextAuthError
				? "Sign-in failed. Please try again."
				: null;

	async function onSubmit(values: StartInput) {
		setServerError(null);
		setLoading(true);
		try {
			const res = await signIn("credentials", {
				phone: values.phone,
				password: values.password,
				redirect: false,
			});

			if (!res || res.error) {
				setServerError("Invalid phone or password.");
				return;
			}

			// Success: NextAuth updates session in the background
			router.push(callbackUrl);
		} catch (e) {
			setServerError("Network error. Please try again.");
		} finally {
			setLoading(false);
		}
	}

	return (
		<div className="min-h-[calc(100dvh-4rem)] flex items-center justify-center px-4 py-10">
			<div className="w-full max-w-md">
				<Header />

				<div className="mt-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
					{initialBanner || serverError ? (
						<p className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
							{serverError ?? initialBanner}
						</p>
					) : null}

					<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
						<div>
							<label className="mb-1 block text-sm font-medium">Phone</label>
							<input
								type="tel"
								placeholder="+91XXXXXXXXXX"
								{...form.register("phone")}
								className="w-full rounded-xl border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black"
							/>
							{form.formState.errors.phone ? (
								<p className="mt-1 text-xs text-red-600">
									{form.formState.errors.phone.message}
								</p>
							) : null}
						</div>

						<PasswordField
							error={form.formState.errors.password?.message}
							register={form.register}
						/>

						<button
							disabled={loading}
							className="w-full rounded-xl bg-black px-4 py-2 text-white disabled:opacity-60">
							{loading ? "Signing in..." : "Sign in"}
						</button>
					</form>

					<div className="mt-4 text-center text-sm text-gray-600">
						Don’t have an account?{" "}
						<Link href="/merchant/register" className="font-medium underline">
							Register
						</Link>
					</div>

					{/* Optional Google button (works if Google provider is configured) */}
					{/* <GoogleButton /> */}
				</div>
			</div>
		</div>
	);
}

function Header() {
	return (
		<div className="text-center">
			<h1 className="text-2xl font-semibold tracking-tight">Sign in</h1>
			<p className="mt-1 text-sm text-gray-600">
				Welcome back! Use your phone and password to continue.
			</p>
		</div>
	);
}

function PasswordField({
	error,
	register,
}: {
	error?: string;
	register: UseFormRegister<StartInput>;
}) {
	const [show, setShow] = useState(false);
	return (
		<div>
			<label className="mb-1 block text-sm font-medium">Password</label>
			<div className="relative">
				<input
					type={show ? "text" : "password"}
					placeholder="••••••••"
					autoComplete="current-password"
					{...register("password")}
					className="w-full rounded-xl border border-gray-300 px-3 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-black"
				/>
				<button
					type="button"
					onClick={() => setShow((s) => !s)}
					className="absolute right-2 top-1/2 -translate-y-1/2 rounded px-2 py-1 text-xs text-gray-600 hover:bg-gray-100">
					{show ? "Hide" : "Show"}
				</button>
			</div>
			{error ? <p className="mt-1 text-xs text-red-600">{error}</p> : null}
		</div>
	);
}

// function GoogleButton() {
// 	async function signInWithGoogle() {
// 		await signIn("google", { callbackUrl: "/merchant/dashboard" });
// 	}
// 	return (
// 		<div className="mt-6">
// 			<button
// 				onClick={signInWithGoogle}
// 				className="w-full rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm hover:bg-gray-50">
// 				Continue with Google
// 			</button>
// 		</div>
// 	);
// }
