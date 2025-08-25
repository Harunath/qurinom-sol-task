// types/next-auth.d.ts
import "next-auth";

declare module "next-auth" {
	interface User {
		id: string;
		phone: string;
		email?: string | null;
		role: "USER";
		phoneVerified: boolean;
		name: string | null;
	}

	interface Session {
		user: User;
	}
}
