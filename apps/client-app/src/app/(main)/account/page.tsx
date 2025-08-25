import { redirect } from "next/navigation";

function page() {
	redirect("/account/profile");
}

export default page;
