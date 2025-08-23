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
				autoClose={5000} // Close after 5 seconds
				hideProgressBar={false}
				newestOnTop={false}
				closeOnClick
				rtl={false}
				pauseOnFocusLoss
				draggable
				pauseOnHover
				theme="light" // Options: 'light', 'dark', 'colored'
			/>
			<SessionProvider>{children}</SessionProvider>
		</div>
	);
};

export default Providers;
