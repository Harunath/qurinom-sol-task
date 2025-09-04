import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Link from "next/link";

export default async function ProfilePage() {
	// const session = await getServerSession(authOptions);

	// if (!session?.user) {
	// 	return (
	// 		<div className="mx-auto max-w-2xl px-4 py-20 text-center">
	// 			<h1 className="text-2xl font-bold">
	// 				Please log in to view your profile
	// 			</h1>
	// 			<Link
	// 				href="/login"
	// 				className="mt-6 inline-block rounded-lg bg-gray-900 px-5 py-2 text-sm font-semibold text-white hover:opacity-90">
	// 				Log in
	// 			</Link>
	// 		</div>
	// 	);
	// }

	// const { name, email, phone } = session.user as {
	// 	name?: string;
	// 	email?: string;
	// 	phone?: string;
	// };

	return (
		<main className="mx-auto max-w-2xl px-4 py-12">
			<h1 className="mb-8 text-3xl font-bold">Your Profile</h1>

			{/* <div className="space-y-4 rounded-xl border bg-white p-6 shadow-sm">
				<p>
					<span className="font-medium">Name: </span>
					{name ?? "—"}
				</p>
				<p>
					<span className="font-medium">Email: </span>
					{email ?? "—"}
				</p>
				<p>
					<span className="font-medium">Phone: </span>
					{phone ?? "—"}
				</p>
			</div>

			<div className="mt-8 flex flex-col gap-3">
				<Link
					href="/account/edit"
					className="rounded-lg border px-4 py-2 text-center text-sm font-medium hover:bg-gray-50">
					Manage Account
				</Link>
				<Link
					href="/account/addresses"
					className="rounded-lg border px-4 py-2 text-center text-sm font-medium hover:bg-gray-50">
					Manage Addresses
				</Link>
			</div> */}
		</main>
	);
}
