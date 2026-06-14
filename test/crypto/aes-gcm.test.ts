import { describe, it, expect } from 'vitest'
import { createCipheriv, createDecipheriv } from 'node:crypto'
import { encrypt, decrypt } from '../../src/crypto/aes-gcm'
import { bytesToHex, hexToBytes, bytesToBase64, base64ToBytes, utf8ToBytes, bytesToUtf8 } from '../../src/crypto/codec'

const KEY = '12345678901234567890123456789012' // 32 bytes
const IV = '1234567890123456' // 16 bytes

// 以 Node crypto 用「與 SDK 相同的格式」加密，作為標準 oracle
const nodeEncrypt = (plain: string): string => {
  const cipher = createCipheriv('aes-256-gcm', utf8ToBytes(KEY), utf8ToBytes(IV))
  const ct = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()
  const combined = bytesToBase64(new Uint8Array(ct)) + ':::' + bytesToBase64(new Uint8Array(tag))
  return bytesToHex(utf8ToBytes(combined))
}

const nodeDecrypt = (encStr: string): string => {
  const combined = bytesToUtf8(hexToBytes(encStr))
  const [c, t] = combined.split(':::')
  const decipher = createDecipheriv('aes-256-gcm', utf8ToBytes(KEY), utf8ToBytes(IV))
  decipher.setAuthTag(Buffer.from(base64ToBytes(t!)))
  return Buffer.concat([decipher.update(Buffer.from(base64ToBytes(c!))), decipher.final()]).toString('utf8')
}

describe('aes-gcm', () => {
  it('round-trip 還原原文', async () => {
    const plain = 'MerID=abc&TradeAmt=100&統一=金流'
    const enc = await encrypt(KEY, IV, plain)
    expect(enc.isOk()).toBe(true)
    const dec = await decrypt(KEY, IV, enc._unsafeUnwrap())
    expect(dec._unsafeUnwrap()).toBe(plain)
  })

  it('空字串原樣回傳', async () => {
    expect((await encrypt(KEY, IV, ''))._unsafeUnwrap()).toBe('')
    expect((await decrypt(KEY, IV, ''))._unsafeUnwrap()).toBe('')
  })

  it('SDK 加密可被 Node 標準解密（格式相容）', async () => {
    const plain = 'MerID=abc&TradeAmt=100'
    const enc = (await encrypt(KEY, IV, plain))._unsafeUnwrap()
    expect(nodeDecrypt(enc)).toBe(plain)
  })

  it('Node 標準加密可被 SDK 解密（格式相容）', async () => {
    const plain = 'MerID=abc&TradeAmt=100'
    const enc = nodeEncrypt(plain)
    expect((await decrypt(KEY, IV, enc))._unsafeUnwrap()).toBe(plain)
  })

  it('解密失敗回 CryptoError', async () => {
    const r = await decrypt(KEY, IV, bytesToHex(utf8ToBytes('AAAA:::BBBB')))
    expect(r.isErr()).toBe(true)
    expect(r._unsafeUnwrapErr().tag).toBe('CryptoError')
  })
})
