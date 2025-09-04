"use client";
import { SessionProvider } from "next-auth/react";
import React, { ReactNode } from "react";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css"; // Import CSS

const Providers = ({ children }: { children: ReactNode }) => {
	return (
		<div>
			<ToastContainer
				position="top-right"
				autoClose={5000}
				hideProgressBar={false}
				newestOnTop={false}
				closeOnClick
				rtl={false}
				pauseOnFocusLoss
				draggable
				pauseOnHover
				theme="light"
			/>
			<SessionProvider>{children}</SessionProvider>
		</div>
	);
};

export default Providers;
