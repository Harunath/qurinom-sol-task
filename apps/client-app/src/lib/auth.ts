// lib/auth.ts
import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import prisma from "@repo/db/client";
import { Role } from "@repo/db/client";

export const authOptions: NextAuthOptions = {
	session: { strategy: "jwt" },

	providers: [
		GoogleProvider({
			clientId: process.env.GOOGLE_CLIENT_ID ?? "",
			clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
			allowDangerousEmailAccountLinking: true,
		}),

		CredentialsProvider({
			name: "Phone & Password",
			credentials: {
				phone: { label: "Phone", type: "text" },
				password: { label: "Password", type: "password" },
			},
			async authorize(credentials) {
				if (!credentials?.phone || !credentials?.password) {
					throw new Error("Invalid phone or password");
				}

				const user = await prisma.user.findFirst({
					where: { phone: credentials.phone },
					select: {
						id: true,
						phone: true,
						email: true,
						name: true,
						hashedPassword: true,
						role: true,
						phoneVerified: true,
					},
				});

				if (!user || !user.hashedPassword || user.role !== Role.USER) {
					throw new Error("Invalid phone or password");
				}

				const ok = await bcrypt.compare(
					credentials.password,
					user.hashedPassword
				);
				if (!ok) throw new Error("Invalid phone or password");

				return {
					id: user.id,
					phone: user.phone,
					email: user.email,
					role: user.role, // enum Role
					phoneVerified: !!user.phoneVerified,
					name: user.name ?? null,
				};
			},
		}),
	],

	callbacks: {
		async signIn({ account, user, profile }) {
			if (account?.provider === "credentials") return true;

			if (account?.provider === "google") {
				const email = user.email ?? profile?.email;
				if (!email) return false;
				const existing = await prisma.user.findUnique({
					where: { email },
					select: { id: true },
				});
				return Boolean(existing);
			}

			return false;
		},

		async jwt({ token, user, trigger, session }) {
			if (user && user.phone) {
				const merchant = await prisma.user.findFirst({
					where: { phone: user.phone },
					select: {
						id: true,
						phone: true,
						email: true,
						name: true,
						hashedPassword: true,
						role: true,
						phoneVerified: true,
					},
				});
				if (merchant) {
					token.id = merchant.id;
					token.phone = merchant.phone;
					token.email = merchant.email ?? null;
					token.role = merchant.role;
					token.phoneVerified = Boolean(merchant.phoneVerified);
					token.name = merchant.name ?? null;
				}

				// client-triggered updates (useSession().update({...}))
				if (trigger === "update" && session) {
					if ("phoneVerified" in session)
						token.phoneVerified = Boolean((session as any).phoneVerified);
					if ("name" in session)
						token.name = (session as any).name ?? token.name;
					if ("role" in session)
						token.role = (session as any).role ?? token.role;
					if ("email" in session)
						token.email = (session as any).email ?? token.email;
					if ("phone" in session)
						token.phone = (session as any).phone ?? token.phone;
				}
			}
			return token;
		},

		async session({ session, token }) {
			if (session.user && token) {
				session.user.id = token.id as string;
				session.user.phone = token.phone as string;
				session.user.email = (token.email as string | null) ?? null;
				session.user.role = token.role as "USER";
				session.user.phoneVerified = token.phoneVerified as boolean;
				session.user.name = (token.name as string | null) ?? null;
			}
			return session;
		},

		// sensible default redirect behavior
		async redirect({ url, baseUrl }) {
			// allow relative callbackUrls
			if (url.startsWith("/")) return `${baseUrl}${url}`;
			// allow same-origin absolute
			try {
				const u = new URL(url);
				if (u.origin === baseUrl) return url;
			} catch {}
			return baseUrl;
		},
	},

	pages: {
		signIn: "/login",
	},

	secret: process.env.NEXTAUTH_SECRET,
};
