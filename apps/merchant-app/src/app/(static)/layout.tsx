import Navbar from "@/components/common/Navbar";
import React from "react";

export default function Layout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<div>
			<Navbar />
			{children}
		</div>
	);
}
