import { describe, it, expect } from 'vitest'
import { resolveConfig } from '../src/config'

const base = { merKey: 'k', merIV: 'v' }

describe('resolveConfig', () => {
  it('production 預設 URL', () => {
    const r = resolveConfig(base)._unsafeUnwrap()
    expect(r.apiBase).toBe('https://api.payuni.com.tw/api/')
  })
  it('sandbox URL', () => {
    const r = resolveConfig({ ...base, env: 'sandbox' })._unsafeUnwrap()
    expect(r.apiBase).toBe('https://sandbox-api.payuni.com.tw/api/')
  })
  it('可覆寫 baseUrl', () => {
    const r = resolveConfig({ ...base, baseUrl: 'http://local/api/' })._unsafeUnwrap()
    expect(r.apiBase).toBe('http://local/api/')
  })
  it('缺 merKey → ConfigError', () => {
    const r = resolveConfig({ merKey: '', merIV: 'v' })
    expect(r._unsafeUnwrapErr()).toEqual({ tag: 'ConfigError', message: 'key is not setting' })
  })
  it('缺 merIV → ConfigError', () => {
    expect(resolveConfig({ merKey: 'k', merIV: '' })._unsafeUnwrapErr().message).toBe('iv is not setting')
  })
  it('保留 merID 與注入的 fetch', () => {
    const fakeFetch = (async () => new Response('')) as unknown as typeof fetch
    const r = resolveConfig({ ...base, merID: 'M1', fetch: fakeFetch })._unsafeUnwrap()
    expect(r.merID).toBe('M1')
    expect(r.fetchFn).toBe(fakeFetch)
  })
})
