import { describe, it, expect } from 'vitest'
import { OPERATIONS } from '../../src/operations/registry'
import { schemas } from '../../src/schemas/encrypt-info'

describe('OPERATIONS', () => {
  it('每操作有 mode/endpoint/version/kind/schema', () => {
    for (const key of Object.keys(OPERATIONS) as (keyof typeof OPERATIONS)[]) {
      const op = OPERATIONS[key]
      expect(typeof op.mode).toBe('string')
      expect(typeof op.endpoint).toBe('string')
      expect(['1.0', '1.1']).toContain(op.version)
      expect(['html', 'json']).toContain(op.kind)
      expect(op.schema).toBe(schemas[key])
    }
  })
  it('endpoint 對應正確', () => {
    expect(OPERATIONS.queryTrade.endpoint).toBe('trade/query')
    expect(OPERATIONS.refundIcash.endpoint).toBe('trade/common/refund/icash')
    expect(OPERATIONS.confirmAftee.endpoint).toBe('trade/common/confirm/aftee')
    expect(OPERATIONS.cancelCreditBind.endpoint).toBe('credit_bind/cancel')
    expect(OPERATIONS.upp.endpoint).toBe('upp')
  })
  it('upp 為 html，linepay version=1.1', () => {
    expect(OPERATIONS.upp.kind).toBe('html')
    expect(OPERATIONS.linepay.version).toBe('1.1')
  })
})
