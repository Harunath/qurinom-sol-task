export default function Loading() {
	return (
		<div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
			<div className="mb-6 h-8 w-40 animate-pulse rounded bg-gray-200" />
			<div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
				<div className="lg:col-span-3">
					<div className="h-64 animate-pulse rounded-xl bg-gray-100" />
				</div>
				<div className="lg:col-span-9">
					<div className="mb-4 h-8 w-full animate-pulse rounded bg-gray-100" />
					<div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4">
						{Array.from({ length: 8 }).map((_, i) => (
							<div
								key={i}
								className="h-64 animate-pulse rounded-xl bg-gray-100"
							/>
						))}
					</div>
				</div>
			</div>
		</div>
	);
}
