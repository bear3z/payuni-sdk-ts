/**
 * 信用卡 Token（約定 / 記憶卡號）範例（對應 .NET example/examples/cardit_bind/CardBind.cs）
 */
import { createPayuniClient } from '../src/index'

const client = createPayuniClient({
  merKey: '12345678901234567890123456789012',
  merIV: '1234567890123456',
  merID: 'abc',
  env: 'sandbox',
})

// 信用卡 Token 查詢（約定）
export async function tradeBindQuery() {
  const result = await client.queryCreditBind({})
  result.match(
    (res) => console.log('bind query:', res.data),
    (err) => console.error(err.tag, err.message),
  )
}

// 信用卡 Token 取消（約定 / 記憶卡號）
export async function tradeBindCancel() {
  const result = await client.cancelCreditBind({ useTokenType: '1', bindVal: '1' })
  result.match(
    (res) => console.log('bind cancel:', res.data),
    (err) => console.error(err.tag, err.message),
  )
}
