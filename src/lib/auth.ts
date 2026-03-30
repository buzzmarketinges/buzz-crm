
import NextAuth, { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import prisma from "@/lib/prisma"
import bcrypt from "bcryptjs"

export const authOptions: NextAuthOptions = {
    secret: process.env.NEXTAUTH_SECRET,
    providers: [
        CredentialsProvider({
            name: "Credentials",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" }
            },
            async authorize(credentials) {
                console.log("Auth attempt for:", credentials?.email)
                if (!credentials?.email || !credentials?.password) {
                    console.log("Missing credentials")
                    return null
                }

                const user = await prisma.user.findUnique({
                    where: {
                        email: credentials.email
                    }
                })

                if (!user) {
                    console.log("User not found in DB:", credentials.email)
                    return null
                }

                console.log("User found, comparing passwords")
                const isPasswordValid = await bcrypt.compare(
                    credentials.password,
                    user.password
                )

                if (!isPasswordValid) {
                    console.log("Invalid password for user:", user.email)
                    return null
                }

                console.log("Login success!")
                return {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                }
            }

        })
    ],
    session: {
        strategy: "jwt"
    },
    pages: {
        signIn: '/login',
        error: '/login',
    },
    callbacks: {
        async session({ session, token }) {
            if (token && session.user) {
                session.user.name = token.name
                session.user.email = token.email
            }
            return session
        },
        async jwt({ token, user }) {
            if (user) {
                token.id = user.id
            }
            return token
        }
    }
}
