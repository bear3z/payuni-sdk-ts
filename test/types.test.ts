import { describe, it, expect } from 'vitest'
import { createPayuniClient } from '../src/client'
import type { ClientInput, PayuniFields } from '../src/index'

// 型別層級測試：由 tsc（pnpm typecheck）驗證 @ts-expect-error 是否成立。
// 若打錯字未被偵測，@ts-expect-error 會變成「未使用」而讓 typecheck 失敗。

const KEY = '12345678901234567890123456789012'
const IV = '1234567890123456'
const client = createPayuniClient({ merKey: KEY, merIV: IV, merID: 'abc' })

// 正確用法：選填欄位可帶、merID/timestamp 可省略
void client.atm({ merTradeNo: 'T1', tradeAmt: '100', bankType: '822' })
void client.queryTrade({ merTradeNo: 'T1' })

// 選填欄位打錯字必須被攔下（returnURL → returnUrl）
// @ts-expect-error 打錯字的選填欄位應被偵測
void client.upp({ merTradeNo: 'T1', tradeAmt: '100', returnUrl: 'x' })

// 任意未知欄位必須被攔下
// @ts-expect-error 未知欄位應被偵測
void client.atm({ merTradeNo: 'T1', tradeAmt: '100', bogusField: 'x' })

// 缺少必填欄位必須被攔下（atm 需 merTradeNo）
// @ts-expect-error 缺 merTradeNo 應被偵測
void client.atm({ tradeAmt: '100' })

// ClientInput / PayuniFields 可被引用（匯出檢查）
const _input: ClientInput<'atm'> = { merTradeNo: 'T1', tradeAmt: '100' }
const _fields: PayuniFields = { merID: 'abc' }
void _input
void _fields

describe('types', () => {
  it('型別層級斷言由 tsc 驗證', () => {
    expect(true).toBe(true)
  })
})
