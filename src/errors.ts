import type { ZodIssue } from 'zod'

export type PayuniError =
  | { tag: 'ConfigError'; message: string }
  | { tag: 'ValidationError'; message: string; issues: ZodIssue[] }
  | { tag: 'CryptoError'; message: string; cause?: unknown }
  | { tag: 'TransportError'; message: string; cause?: unknown }
  | { tag: 'HashMismatchError'; message: string }
  | { tag: 'ResponseError'; message: string; status?: string }

export const configError = (message: string): PayuniError => ({ tag: 'ConfigError', message })

export const validationError = (message: string, issues: ZodIssue[]): PayuniError => ({
  tag: 'ValidationError',
  message,
  issues,
})

export const cryptoError = (message: string, cause?: unknown): PayuniError => ({ tag: 'CryptoError', message, cause })

export const transportError = (message: string, cause?: unknown): PayuniError => ({
  tag: 'TransportError',
  message,
  cause,
})

export const hashMismatchError = (message: string): PayuniError => ({ tag: 'HashMismatchError', message })

export const responseError = (message: string, status?: string): PayuniError =>
  status === undefined ? { tag: 'ResponseError', message } : { tag: 'ResponseError', message, status }
