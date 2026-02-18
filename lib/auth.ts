// Authentication utilities
import { compare, hash } from 'bcryptjs'

export async function hashPassword(password: string): Promise<string> {
  return hash(password, 12)
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return compare(password, hashedPassword)
}

export function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}
