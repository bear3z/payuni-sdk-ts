import { describe, it, expect } from 'vitest'
import * as sdk from '../src/index'

describe('public API', () => {
  it('匯出 createPayuniClient 與純函數', () => {
    expect(typeof sdk.createPayuniClient).toBe('function')
    expect(typeof sdk.encrypt).toBe('function')
    expect(typeof sdk.decrypt).toBe('function')
    expect(typeof sdk.hashInfo).toBe('function')
    expect(typeof sdk.buildRequest).toBe('function')
    expect(typeof sdk.processResult).toBe('function')
    expect(typeof sdk.toQueryString).toBe('function')
    expect(sdk.OPERATIONS.upp.endpoint).toBe('upp')
  })
})
