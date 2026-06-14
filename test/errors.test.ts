import { describe, it, expect } from 'vitest'
import {
  configError,
  validationError,
  cryptoError,
  transportError,
  hashMismatchError,
  responseError,
} from '../src/errors'
import type { ZodIssue } from 'zod'

describe('errors', () => {
  it('configError 帶 tag 與訊息', () => {
    expect(configError('key is not setting')).toEqual({ tag: 'ConfigError', message: 'key is not setting' })
  })
  it('validationError 帶 issues', () => {
    const issue = { code: 'custom', path: [], message: 'bad' } as unknown as ZodIssue
    const e = validationError('bad', [issue])
    expect(e.tag).toBe('ValidationError')
    if (e.tag === 'ValidationError') expect(e.issues).toHaveLength(1)
  })
  it('cryptoError/transportError 帶 cause', () => {
    expect(cryptoError('x', new Error('y')).tag).toBe('CryptoError')
    expect(transportError('x', new Error('y')).tag).toBe('TransportError')
  })
  it('hashMismatchError / responseError', () => {
    expect(hashMismatchError('m').tag).toBe('HashMismatchError')
    expect(responseError('m', 'API00003')).toEqual({ tag: 'ResponseError', message: 'm', status: 'API00003' })
  })
})
