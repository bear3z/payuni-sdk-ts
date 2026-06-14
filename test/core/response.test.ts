import { describe, it, expect } from 'vitest'
import { processResult } from '../../src/core/response'
import { encrypt } from '../../src/crypto/aes-gcm'
import { hashInfo } from '../../src/crypto/hash'

const KEY = '12345678901234567890123456789012'
const IV = '1234567890123456'

// 模擬伺服器回傳：EncryptInfo 為 JSON 內容加密，HashInfo 為其雜湊
const makeResponse = async (payload: object, status = 'SUCCESS') => {
  const enc = (await encrypt(KEY, IV, JSON.stringify(payload)))._unsafeUnwrap()
  const hash = (await hashInfo(KEY, enc, IV))._unsafeUnwrap()
  return JSON.stringify({
    Status: status,
    Message: 'ok',
    MerID: 'abc',
    Version: '1.0',
    EncryptInfo: enc,
    HashInfo: hash,
  })
}

describe('processResult', () => {
  it('驗章通過 → 解密並解析 data', async () => {
    const raw = await makeResponse({ TradeNo: 'U123', TradeStatus: '1' })
    const r = await processResult({ merKey: KEY, merIV: IV }, raw)
    const res = r._unsafeUnwrap()
    expect(res.status).toBe('SUCCESS')
    expect(res.data).toEqual({ TradeNo: 'U123', TradeStatus: '1' })
  })

  it('接受物件輸入（ReturnURL/NotifyURL 的 req.body）', async () => {
    const raw = await makeResponse({ TradeNo: 'U1' })
    const obj = JSON.parse(raw)
    const r = await processResult({ merKey: KEY, merIV: IV }, obj)
    expect(r._unsafeUnwrap().data).toEqual({ TradeNo: 'U1' })
  })

  it('hash 不符 → HashMismatchError', async () => {
    const raw = await makeResponse({ TradeNo: 'U1' })
    const tampered = JSON.parse(raw)
    tampered.HashInfo = 'WRONG'
    const r = await processResult({ merKey: KEY, merIV: IV }, JSON.stringify(tampered))
    expect(r._unsafeUnwrapErr().tag).toBe('HashMismatchError')
  })

  it('缺 EncryptInfo → ResponseError', async () => {
    const r = await processResult({ merKey: KEY, merIV: IV }, JSON.stringify({ Status: 'X' }))
    expect(r._unsafeUnwrapErr().tag).toBe('ResponseError')
  })

  it('Status=API00003 → ResponseError 無API版本號', async () => {
    const r = await processResult({ merKey: KEY, merIV: IV }, JSON.stringify({ Status: 'API00003' }))
    const e = r._unsafeUnwrapErr()
    expect(e.tag).toBe('ResponseError')
    expect(e.message).toContain('無API版本號')
  })

  it('缺 HashInfo → ResponseError', async () => {
    const enc = (await encrypt(KEY, IV, 'x=1'))._unsafeUnwrap()
    const r = await processResult({ merKey: KEY, merIV: IV }, JSON.stringify({ EncryptInfo: enc }))
    expect(r._unsafeUnwrapErr().message).toContain('HashInfo')
  })

  it('非 JSON 字串 → ResponseError', async () => {
    const r = await processResult({ merKey: KEY, merIV: IV }, 'not-json')
    expect(r._unsafeUnwrapErr().tag).toBe('ResponseError')
  })
})
