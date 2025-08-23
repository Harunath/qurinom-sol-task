import {
	FaUserShield,
	FaStore,
	FaSearch,
	FaShoppingCart,
} from "react-icons/fa";

export default function HomePage() {
	return (
		<main className="min-h-screen bg-gray-50 flex flex-col items-center">
			{/* Hero Section */}
			<section className="max-w-4xl text-center px-6 py-20">
				<h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-6">
					Welcome to{" "}
					<span className="text-indigo-600">Qurinom Marketplace</span>
				</h1>
				<p className="text-lg md:text-xl text-gray-600 leading-relaxed">
					Your one-stop platform to{" "}
					<span className="font-semibold">shop smart</span>,
					<span className="font-semibold"> sell with ease</span>, and explore
					products in <span className="font-semibold">Fashion</span>,{" "}
					<span className="font-semibold">Electronics</span>, and{" "}
					<span className="font-semibold">Home Essentials</span>.
				</p>
			</section>

			{/* Features Section */}
			<section className="max-w-6xl grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 px-6 py-12">
				<div className="bg-white shadow-sm rounded-xl p-6 text-center hover:shadow-md transition">
					<FaUserShield className="mx-auto text-3xl text-indigo-600 mb-4" />
					<h3 className="text-lg font-semibold text-gray-800">Secure Login</h3>
					<p className="text-gray-600 text-sm mt-2">
						Sign up as a User or Merchant and access your dashboard safely.
					</p>
				</div>

				<div className="bg-white shadow-sm rounded-xl p-6 text-center hover:shadow-md transition">
					<FaStore className="mx-auto text-3xl text-indigo-600 mb-4" />
					<h3 className="text-lg font-semibold text-gray-800">
						Merchant Store
					</h3>
					<p className="text-gray-600 text-sm mt-2">
						Merchants can upload, edit, and manage their product listings
						easily.
					</p>
				</div>

				<div className="bg-white shadow-sm rounded-xl p-6 text-center hover:shadow-md transition">
					<FaSearch className="mx-auto text-3xl text-indigo-600 mb-4" />
					<h3 className="text-lg font-semibold text-gray-800">Smart Search</h3>
					<p className="text-gray-600 text-sm mt-2">
						Users can search products by category, price, location, and more.
					</p>
				</div>

				<div className="bg-white shadow-sm rounded-xl p-6 text-center hover:shadow-md transition">
					<FaShoppingCart className="mx-auto text-3xl text-indigo-600 mb-4" />
					<h3 className="text-lg font-semibold text-gray-800">
						Quick Checkout
					</h3>
					<p className="text-gray-600 text-sm mt-2">
						Add products to cart and enjoy a smooth, hassle-free checkout
						process.
					</p>
				</div>
			</section>

			{/* CTA Section */}
			<section className="text-center px-6 py-16">
				<h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-4">
					Ready to get started?
				</h2>
				<p className="text-gray-600 mb-6">
					Join as a user and explore products, or register as a merchant and
					grow your business.
				</p>
				<div className="flex gap-4 justify-center">
					<a
						href="/signup"
						className="bg-indigo-600 text-white px-6 py-3 rounded-md hover:bg-indigo-700 transition">
						Sign Up
					</a>
					<a
						href="/login"
						className="border border-indigo-600 text-indigo-600 px-6 py-3 rounded-md hover:bg-indigo-50 transition">
						Login
					</a>
				</div>
			</section>
		</main>
	);
}
