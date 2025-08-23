// prisma/seed.ts
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Tiny slug helper (no external deps)
function toSlug(s: string) {
	return s
		.toLowerCase()
		.trim()
		.normalize("NFKD")
		.replace(/[\u0300-\u036f]/g, "") // remove diacritics
		.replace(/[^a-z0-9\s-]/g, "") // remove non-word chars
		.replace(/\s+/g, "-") // spaces -> dashes
		.replace(/-+/g, "-"); // collapse dashes
}

async function upsertCategory(name: string) {
	// Adjust the `where` to match your unique in schema:
	// - If Category has unique name: use { name }
	// - If Category has unique slug: use { slug }
	const slug = toSlug(name);

	// Try slug first; if your schema uses name unique, switch to where: { name }
	return prisma.category.upsert({
		where: { slug }, // <-- change to { name: name } if that's your unique
		update: {},
		create: { name, slug },
	});
}

async function main() {
	// 1) State → City
	const telangana = await prisma.state.upsert({
		where: { name: "Telangana" }, // assumes State.name is unique
		update: {},
		create: { name: "Telangana", code: "TG" },
	});

	const hyderabad = await prisma.city.upsert({
		// assumes @@unique([name, stateId]) on City
		where: { name_stateId: { name: "Hyderabad", stateId: telangana.id } },
		update: {},
		create: { name: "Hyderabad", stateId: telangana.id },
	});

	// 2) Areas under Hyderabad (only the ones you asked for)
	const areas = [
		{ name: "Uppal", pincode: "500039" },
		{ name: "Nagole", pincode: "500068" }, // (you typed "nagol")
		{ name: "Madhapur", pincode: "500081" },
		{ name: "HITEC City", pincode: "500081" },
		{ name: "Kondapur", pincode: "500084" },
	];

	for (const a of areas) {
		// assumes @@unique([name, cityId]) on Area
		await prisma.area.upsert({
			where: { name_cityId: { name: a.name, cityId: hyderabad.id } },
			update: { pincode: a.pincode },
			create: {
				name: a.name,
				pincode: a.pincode,
				cityId: hyderabad.id,
			},
		});
	}

	// 3) Categories (no subcategories in schema)
	await upsertCategory("Fashion");
	await upsertCategory("Electronics");
	await upsertCategory("Home Essentials");

	console.log(
		"✅ Seed complete: Telangana/Hyderabad areas + top-level categories."
	);
}

main()
	.then(async () => {
		await prisma.$disconnect();
	})
	.catch(async (e) => {
		console.error(e);
		await prisma.$disconnect();
		process.exit(1);
	});
