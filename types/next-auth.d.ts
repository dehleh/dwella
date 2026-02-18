import { DefaultSession, DefaultUser } from 'next-auth'
import { JWT, DefaultJWT } from 'next-auth/jwt'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      roles: {
        host?: boolean
        seeker?: boolean
        admin?: boolean
      }
      status: string
      verificationStatus: string
    } & DefaultSession['user']
  }

  interface User extends DefaultUser {
    id: string
    roles: {
      host?: boolean
      seeker?: boolean
      admin?: boolean
    }
    status: string
    verificationStatus: string
  }
}

declare module 'next-auth/jwt' {
  interface JWT extends DefaultJWT {
    id: string
    roles: {
      host?: boolean
      seeker?: boolean
      admin?: boolean
    }
    status: string
    verificationStatus: string
  }
}
