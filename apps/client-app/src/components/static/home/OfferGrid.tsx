"use client";

export default function OffersGrid() {
	const handleClick = (title: string) => {
		alert(`${title} — Under development`);
	};

	return (
		<div className="grid grid-cols-3 gap-3">
			<div
				onClick={() => handleClick("Fashion")}
				className="flex h-40 cursor-pointer items-center justify-center rounded-xl bg-pink-100 text-lg font-semibold hover:bg-pink-200">
				Fashion Offers
			</div>
			<div
				onClick={() => handleClick("Electronics")}
				className="flex h-40 cursor-pointer items-center justify-center rounded-xl bg-blue-100 text-lg font-semibold hover:bg-blue-200">
				Electronics Offers
			</div>
			<div
				onClick={() => handleClick("Home Essentials")}
				className="flex h-40 cursor-pointer items-center justify-center rounded-xl bg-green-100 text-lg font-semibold hover:bg-green-200">
				Home Essentials
			</div>
			<div
				onClick={() => handleClick("Membership")}
				className="col-span-3 flex h-28 cursor-pointer items-center justify-center rounded-xl bg-yellow-100 text-lg font-semibold hover:bg-yellow-200">
				Membership
			</div>
		</div>
	);
}
