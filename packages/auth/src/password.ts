/**
 * AKADEMATE.COM - Password Hashing Module
 *
 * Blueprint Reference: Section 6.1 - Autenticación
 *
 * Implements secure password hashing using:
 * - PBKDF2 with SHA-512 (Node.js native crypto)
 * - 310,000 iterations (OWASP 2023 recommendation)
 * - 32-byte salt, 64-byte hash
 *
 * Format: $pbkdf2-sha512$iterations$salt$hash
 */

import { randomBytes, pbkdf2, timingSafeEqual } from 'crypto'
import { promisify } from 'util'

const pbkdf2Async = promisify(pbkdf2)

// OWASP recommended iterations for PBKDF2-SHA512 (2023)
const ITERATIONS = 310000
const SALT_LENGTH = 32
const HASH_LENGTH = 64
const DIGEST = 'sha512'

/**
 * Password policy configuration
 */
export interface PasswordPolicy {
  minLength: number
  requireUppercase: boolean
  requireLowercase: boolean
  requireNumbers: boolean
  requireSpecialChars: boolean
  maxLength: number
}

/**
 * Default password policy per Blueprint
 */
export const DEFAULT_PASSWORD_POLICY: PasswordPolicy = {
  minLength: 8,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSpecialChars: false, // Optional for user-friendliness
  maxLength: 128,
}

/**
 * Password validation result
 */
export interface PasswordValidationResult {
  valid: boolean
  errors: string[]
}

/**
 * Validate password against policy
 */
export function validatePassword(
  password: string,
  policy: PasswordPolicy = DEFAULT_PASSWORD_POLICY
): PasswordValidationResult {
  const errors: string[] = []

  if (password.length < policy.minLength) {
    errors.push(`Password must be at least ${policy.minLength} characters`)
  }

  if (password.length > policy.maxLength) {
    errors.push(`Password must be at most ${policy.maxLength} characters`)
  }

  if (policy.requireUppercase && !/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter')
  }

  if (policy.requireLowercase && !/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter')
  }

  if (policy.requireNumbers && !/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number')
  }

  if (policy.requireSpecialChars && !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('Password must contain at least one special character')
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}

/**
 * Hash a password using PBKDF2-SHA512
 *
 * @param password - Plain text password
 * @returns Encoded hash string in format: $pbkdf2-sha512$iterations$salt$hash
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(SALT_LENGTH)
  const hash = await pbkdf2Async(password, salt, ITERATIONS, HASH_LENGTH, DIGEST)

  // Encode as: $pbkdf2-sha512$iterations$salt$hash
  return [
    '',
    'pbkdf2-sha512',
    ITERATIONS.toString(),
    salt.toString('base64'),
    hash.toString('base64'),
  ].join('$')
}

/**
 * Verify a password against a hash
 *
 * @param password - Plain text password to verify
 * @param storedHash - Previously stored hash string
 * @returns true if password matches, false otherwise
 */
export async function verifyPassword(
  password: string,
  storedHash: string
): Promise<boolean> {
  const parts = storedHash.split('$')

  // Format: ['', 'pbkdf2-sha512', iterations, salt, hash]
  if (parts.length !== 5 || parts[1] !== 'pbkdf2-sha512') {
    return false
  }

  const iterations = parseInt(parts[2] ?? '', 10)
  const salt = Buffer.from(parts[3] ?? '', 'base64')
  const storedHashBuffer = Buffer.from(parts[4] ?? '', 'base64')

  if (isNaN(iterations) || iterations < 1) {
    return false
  }

  try {
    const hash = await pbkdf2Async(password, salt, iterations, storedHashBuffer.length, DIGEST)

    // Use timing-safe comparison to prevent timing attacks
    return timingSafeEqual(hash, storedHashBuffer)
  } catch {
    return false
  }
}

/**
 * Check if a stored hash needs rehashing
 * (e.g., if iterations have been increased)
 */
export function needsRehash(storedHash: string): boolean {
  const parts = storedHash.split('$')

  if (parts.length !== 5 || parts[1] !== 'pbkdf2-sha512') {
    return true // Unknown format, needs rehash
  }

  const iterations = parseInt(parts[2] ?? '', 10)
  return iterations < ITERATIONS
}

/**
 * Generate a secure random password
 *
 * @param length - Password length (default: 16)
 * @returns Random password string
 */
export function generateRandomPassword(length = 16): string {
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*'
  const bytes = randomBytes(length)
  let password = ''

  for (let i = 0; i < length; i++) {
    const byte = bytes[i] ?? 0
    password += charset[byte % charset.length]
  }

  return password
}

/**
 * Generate a secure token for password reset or email verification
 *
 * @param bytes - Number of random bytes (default: 32)
 * @returns URL-safe base64 encoded token
 */
export function generateSecureToken(bytes = 32): string {
  return randomBytes(bytes).toString('base64url')
}

/**
 * Hash a token for storage (single SHA-256 hash)
 * Used for password reset tokens, email verification tokens, etc.
 */
export function hashToken(token: string): string {
  const { createHash } = require('crypto')
  return createHash('sha256').update(token).digest('hex')
}
