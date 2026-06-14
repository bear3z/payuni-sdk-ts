import { describe, it, expect } from 'vitest'
import { toApiPayload, schemas } from '../../src/schemas/encrypt-info'

describe('toApiPayload', () => {
  it('camelCase → PascalCase 並排除 undefined', () => {
    expect(toApiPayload({ merID: 'abc', merTradeNo: 'T1', tradeAmt: '100', cardCVC: undefined })).toEqual({
      MerID: 'abc',
      MerTradeNo: 'T1',
      TradeAmt: '100',
    })
  })
  it('特殊大小寫欄位正確映射', () => {
    expect(toApiPayload({ iCash: '1', atm: '1', cvs: '1', api3D: '1', payNo: 'P' })).toEqual({
      ICash: '1',
      ATM: '1',
      CVS: '1',
      API3D: '1',
      PayNo: 'P',
    })
  })
})

describe('schemas', () => {
  const common = { merID: 'abc', timestamp: '1700000000' }
  it('upp 缺 merTradeNo → 失敗且訊息正確', () => {
    const r = schemas.upp.safeParse({ ...common, tradeAmt: '100' })
    expect(r.success).toBe(false)
    if (!r.success) expect(r.error.issues[0]!.message).toContain('MerTradeNo')
  })
  it('upp 齊全 → 成功', () => {
    expect(schemas.upp.safeParse({ ...common, merTradeNo: 'T1', tradeAmt: '100' }).success).toBe(true)
  })
  it('缺 merID → 失敗', () => {
    expect(schemas.upp.safeParse({ timestamp: '1', merTradeNo: 'T1', tradeAmt: '100' }).success).toBe(false)
  })
  it('credit：有 creditHash 可免卡號', () => {
    expect(schemas.credit.safeParse({ ...common, merTradeNo: 'T1', tradeAmt: '100', creditHash: 'H' }).success).toBe(
      true,
    )
  })
  it('credit：無 creditHash 需卡號/到期/CVC', () => {
    const r = schemas.credit.safeParse({ ...common, merTradeNo: 'T1', tradeAmt: '100' })
    expect(r.success).toBe(false)
  })
  it('credit：無 creditHash 但卡號齊全 → 成功', () => {
    expect(
      schemas.credit.safeParse({
        ...common,
        merTradeNo: 'T1',
        tradeAmt: '100',
        cardNo: '4',
        cardExpired: '1230',
        cardCVC: '123',
      }).success,
    ).toBe(true)
  })
  it('closeTrade 需 tradeNo + closeType', () => {
    expect(schemas.closeTrade.safeParse({ ...common }).success).toBe(false)
    expect(schemas.closeTrade.safeParse({ ...common, tradeNo: 'U1', closeType: '1' }).success).toBe(true)
  })
  it('cancelCvs 需 payNo', () => {
    expect(schemas.cancelCvs.safeParse({ ...common, payNo: 'P1' }).success).toBe(true)
  })
  it('cancelCreditBind 需 useTokenType + bindVal', () => {
    expect(schemas.cancelCreditBind.safeParse({ ...common, useTokenType: '1', bindVal: 'B' }).success).toBe(true)
  })
  it('queryTrade 只需 common', () => {
    expect(schemas.queryTrade.safeParse({ ...common }).success).toBe(true)
  })
})
