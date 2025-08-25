"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";

// Simple inline SVG
function ProfileIcon(props: React.SVGProps<SVGSVGElement>) {
	return (
		<svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
			<path
				fill="currentColor"
				d="M12 12a5 5 0 1 0-5-5 5 5 0 0 0 5 5Zm0 2c-4.42 0-8 2.239-8 5v1h16v-1c0-2.761-3.58-5-8-5Z"
			/>
		</svg>
	);
}

export default function AuthActions() {
	const { status } = useSession(); // "loading" | "authenticated" | "unauthenticated"
	const [showSpinner, setShowSpinner] = useState(true);

	// Small grace so the spinner shows briefly on first load
	useEffect(() => {
		const t = setTimeout(() => setShowSpinner(false), 400);
		return () => clearTimeout(t);
	}, []);

	if (status === "loading" || showSpinner) {
		return (
			<div className="flex items-center gap-2">
				<span className="sr-only">Loading</span>
				<div className="h-5 w-5 animate-spin rounded-full border-2 border-gray-300 border-t-gray-900" />
			</div>
		);
	}

	if (status === "authenticated") {
		return (
			<Link
				href="/account/profile"
				className="inline-flex h-9 w-9 items-center justify-center rounded-full border hover:bg-gray-50"
				aria-label="Profile"
				title="Profile">
				<ProfileIcon className="h-5 w-5 text-gray-700" />
			</Link>
		);
	}

	return (
		<div className="flex items-center gap-2 sm:gap-3">
			<Link
				href="/login"
				className="hidden sm:inline-block rounded-lg border px-3 py-2 text-sm font-medium hover:bg-gray-50">
				Login
			</Link>
			<Link
				href="/register"
				className="rounded-lg bg-gray-900 px-3 py-2 text-sm font-semibold text-white hover:opacity-90">
				Sign up
			</Link>
		</div>
	);
}
