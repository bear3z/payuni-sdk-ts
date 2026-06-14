/**
 * 交易查詢 / 請退款 / 取消 / 退款範例（對應 .NET example/examples/trade/Trade.cs）
 */
import { createPayuniClient } from '../src/index'

const client = createPayuniClient({
  merKey: '12345678901234567890123456789012',
  merIV: '1234567890123456',
  merID: 'abc',
  env: 'sandbox',
})

// 交易查詢
export async function tradeQuery() {
  const result = await client.queryTrade({ merTradeNo: 'test20220829111528' })
  result.match(
    (res) => console.log('query:', res.data),
    (err) => console.error(err.tag, err.message),
  )
}

// 交易請退款（關帳）
export async function tradeClose() {
  const result = await client.closeTrade({ tradeNo: '16614190477810373246', closeType: '1' })
  result.match(
    (res) => console.log('close:', res.data),
    (err) => console.error(err.tag, err.message),
  )
}

// 交易取消授權
export async function tradeCancel() {
  const result = await client.cancelTrade({ tradeNo: '16614190477810373246' })
  result.match(
    (res) => console.log('cancel:', res.data),
    (err) => console.error(err.tag, err.message),
  )
}

// 愛金卡退款（ICASH）
export async function tradeRefundIcash() {
  const result = await client.refundIcash({ tradeNo: '1665472985627866043', tradeAmt: '100' })
  result.match(
    (res) => console.log('refund icash:', res.data),
    (err) => console.error(err.tag, err.message),
  )
}

// 後支付退款（AFTEE）
export async function tradeRefundAftee() {
  const result = await client.refundAftee({ tradeNo: '1665472985627866043', tradeAmt: '100' })
  result.match(
    (res) => console.log('refund aftee:', res.data),
    (err) => console.error(err.tag, err.message),
  )
}
