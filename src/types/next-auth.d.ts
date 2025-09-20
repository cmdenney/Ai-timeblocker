import { DefaultSession, DefaultUser } from "next-auth"
import { JWT, DefaultJWT } from "next-auth/jwt"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      name: string
      email: string
      image: string
    } & DefaultSession["user"]
    accessToken?: string
    provider?: string
  }

  interface User extends DefaultUser {
    id: string
    name: string
    email: string
    image: string
  }
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    id: string
    name: string
    email: string
    image: string
    accessToken?: string
    refreshToken?: string
    provider?: string
    providerAccountId?: string
  }
}
