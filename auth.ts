import NextAuth from "next-auth"
import { ZodError } from "zod"
import Credentials from "next-auth/providers/credentials"
import { signInSchema } from "./lib/zod"
// Your own logic for dealing with plaintext password strings; be careful!
import bcrypt from 'bcrypt';
import { PrismaAdapter } from "@next-auth/prisma-adapter"
import { prisma } from "./prisma/client";

export const { handlers, auth } = NextAuth({
    adapter: PrismaAdapter(prisma),
    providers: [
        Credentials({
            // You can specify which fields should be submitted, by adding keys to the `credentials` object.
            // e.g. domain, username, password, 2FA token, etc.
            credentials: {
                email: {
                    label: "Email",
                    type: "email",
                    placeholder: "Email",
                },
                password: {
                    label: "Password",
                    type: "password",
                    placeholder: "Password",
                },
            },
            authorize: async (credentials) => {

                const { email, password } = await signInSchema.parseAsync(credentials)

                // logic to salt and hash password
                // Hash the password using bcrypt.
                const saltRounds = 10;
                const pwHash = await bcrypt.hash(password, saltRounds);

                // logic to verify if the user exists
                const user = await prisma.user.findUnique({
                    where: { email: email },
                });

                if (!user) return null;

                // return JSON object with the user data
                const passwordsMatch = await bcrypt.compare(
                    pwHash,
                    user.password!
                );

                return passwordsMatch ? user : null;

            },
        }),
    ],
    session: {
        strategy: "jwt",
    },
})