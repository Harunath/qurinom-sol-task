"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { FaStore } from "react-icons/fa";
import { useState } from "react";
import { HiMenu, HiX } from "react-icons/hi";

export default function Navbar() {
	const { data: session } = useSession();
	const [isOpen, setIsOpen] = useState(false);

	return (
		<nav className="bg-white shadow-md sticky top-0 z-50">
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
				<div className="flex justify-between h-16 items-center">
					{/* Logo */}
					<Link
						href="/"
						className="flex items-center gap-2 text-xl font-bold text-indigo-600">
						<FaStore className="text-2xl" />
						<span>Qurinom</span>
					</Link>

					{/* Desktop Menu */}
					<div className="hidden md:flex gap-6 items-center">
						{session ? (
							<Link
								href="/merchant/dashboard"
								className="text-gray-700 hover:text-indigo-600 font-medium">
								Dashboard
							</Link>
						) : (
							<>
								<Link
									href="/login"
									className="text-gray-700 hover:text-indigo-600 font-medium">
									Login
								</Link>
								<Link
									href="/merchant/register"
									className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition">
									Sign Up
								</Link>
							</>
						)}
					</div>

					{/* Mobile Menu Button */}
					<div className="md:hidden">
						<button onClick={() => setIsOpen(!isOpen)}>
							{isOpen ? (
								<HiX className="h-6 w-6" />
							) : (
								<HiMenu className="h-6 w-6" />
							)}
						</button>
					</div>
				</div>
			</div>

			{/* Mobile Menu */}
			{isOpen && (
				<div className="md:hidden bg-white shadow-lg">
					<div className="px-4 py-4 space-y-2">
						{session ? (
							<Link
								href="/merchant/dashboard"
								className="block text-gray-700 hover:text-indigo-600 font-medium"
								onClick={() => setIsOpen(false)}>
								Dashboard
							</Link>
						) : (
							<>
								<Link
									href="/login"
									className="block text-gray-700 hover:text-indigo-600 font-medium"
									onClick={() => setIsOpen(false)}>
									Login
								</Link>
								<Link
									href="/merchant/register"
									className="block bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition"
									onClick={() => setIsOpen(false)}>
									Sign Up
								</Link>
							</>
						)}
					</div>
				</div>
			)}
		</nav>
	);
}
