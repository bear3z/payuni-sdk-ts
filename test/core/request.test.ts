import { describe, it, expect } from 'vitest'
import { buildRequest } from '../../src/core/request'
import { decrypt } from '../../src/crypto/aes-gcm'
import { hashInfo } from '../../src/crypto/hash'
import { parseQueryString } from '../../src/core/query-string'

const KEY = '12345678901234567890123456789012'
const IV = '1234567890123456'

describe('buildRequest', () => {
  it('產出 MerID/Version/EncryptInfo/HashInfo/IsPlatForm，且可解密還原', async () => {
    const r = await buildRequest(
      { merKey: KEY, merIV: IV },
      { merID: 'abc', timestamp: '1700000000', merTradeNo: 'T1', tradeAmt: '100' },
      '1.0',
    )
    const req = r._unsafeUnwrap()
    expect(req.MerID).toBe('abc')
    expect(req.Version).toBe('1.0')
    expect(req.IsPlatForm).toBe('')
    // HashInfo 應為 SHA256(key + EncryptInfo + iv) 大寫
    expect(req.HashInfo).toBe((await hashInfo(KEY, req.EncryptInfo, IV))._unsafeUnwrap())
    // EncryptInfo 解密後為 PascalCase query string
    const plain = (await decrypt(KEY, IV, req.EncryptInfo))._unsafeUnwrap()
    expect(parseQueryString(plain)).toEqual({
      MerID: 'abc',
      Timestamp: '1700000000',
      MerTradeNo: 'T1',
      TradeAmt: '100',
    })
  })

  it('IsPlatForm 自加密內容移除、改放外層', async () => {
    const r = await buildRequest({ merKey: KEY, merIV: IV }, { merID: 'abc', timestamp: '1', isPlatForm: 'Y' }, '1.0')
    const req = r._unsafeUnwrap()
    expect(req.IsPlatForm).toBe('Y')
    const plain = (await decrypt(KEY, IV, req.EncryptInfo))._unsafeUnwrap()
    expect(plain).not.toContain('IsPlatForm')
  })
})
