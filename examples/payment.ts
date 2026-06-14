/**
 * 交易建立範例（對應 .NET example/examples/payment/Payment.cs）
 * upp / credit / atm / cvs
 */
import { createPayuniClient } from '../src/index'

const client = createPayuniClient({
  merKey: '12345678901234567890123456789012',
  merIV: '1234567890123456',
  merID: 'abc',
  env: 'sandbox',
})

// 整合式支付頁（回傳自動送出的 HTML 表單字串）
export async function upp() {
  const result = await client.upp({
    merTradeNo: 'test' + new Date().toISOString().replace(/\D/g, '').slice(0, 14),
    tradeAmt: '100',
    returnURL: 'http://www.test.com.tw/api/return',
    notifyURL: 'http://www.test.com.tw/api/notify',
  })
  return result.match(
    (html) => html,
    (err) => `[${err.tag}] ${err.message}`,
  )
}

// 信用卡幕後
export async function credit() {
  const result = await client.credit({
    merTradeNo: 'test' + Date.now(),
    tradeAmt: '100',
    cardNo: '1234567890123456',
    cardCVC: '123',
    cardExpired: '1230',
  })
  result.match(
    (res) => console.log('credit ok:', res.data),
    (err) => console.error('credit fail:', err.tag, err.message),
  )
}

// 虛擬帳號幕後
export async function atm() {
  const result = await client.atm({
    merTradeNo: 'test' + Date.now(),
    tradeAmt: '100',
    bankType: '822',
  })
  result.match(
    (res) => console.log('atm ok:', res.data),
    (err) => console.error('atm fail:', err.tag, err.message),
  )
}

// 超商代碼幕後
export async function cvs() {
  const result = await client.cvs({
    merTradeNo: 'test' + Date.now(),
    tradeAmt: '100',
  })
  result.match(
    (res) => console.log('cvs ok:', res.data),
    (err) => console.error('cvs fail:', err.tag, err.message),
  )
}

// ReturnURL / NotifyURL 收到回傳後處理
export async function handleReturn(requestBody: string | Record<string, unknown>) {
  const result = await client.processResult(requestBody)
  return result.match(
    (res) => res.data,
    (err) => ({ error: err.tag, message: err.message }),
  )
}
