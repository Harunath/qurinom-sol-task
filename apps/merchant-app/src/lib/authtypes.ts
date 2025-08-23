// types/next-auth.d.ts
import "next-auth";

declare module "next-auth" {
	interface User {
		id: string;
		phone: string;
		email?: string | null;
		role: "MERCHANT";
		phoneVerified: boolean;
		name: string | null;
		storeCompleted: boolean;
	}

	interface Session {
		user: User;
	}
}
