import NextAuth from "next-auth"
import { authConfig } from "./auth.config"

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig)

export { auth as getServerSession } from "./auth"
