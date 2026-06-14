import { describe, it, expect } from 'vitest'
import { bytesToHex, hexToBytes, bytesToBase64, base64ToBytes, utf8ToBytes, bytesToUtf8 } from '../../src/crypto/codec'

describe('codec', () => {
  it('hex round-trip', () => {
    const bytes = new Uint8Array([0x00, 0x0f, 0xa5, 0xff])
    expect(bytesToHex(bytes)).toBe('000fa5ff')
    expect([...hexToBytes('000fa5ff')]).toEqual([0, 15, 165, 255])
  })
  it('hex 小寫補零', () => {
    expect(bytesToHex(new Uint8Array([1, 2, 10]))).toBe('01020a')
  })
  it('hexToBytes 忽略空白', () => {
    expect([...hexToBytes('00 0f a5')]).toEqual([0, 15, 165])
  })
  it('base64 round-trip（含需要 padding 的長度）', () => {
    for (const s of ['', 'a', 'ab', 'abc', 'abcd', 'hello world']) {
      const b = utf8ToBytes(s)
      expect(bytesToUtf8(base64ToBytes(bytesToBase64(b)))).toBe(s)
    }
  })
  it('base64 已知值', () => {
    expect(bytesToBase64(utf8ToBytes('foobar'))).toBe('Zm9vYmFy')
    expect(bytesToUtf8(base64ToBytes('Zm9vYmFy'))).toBe('foobar')
  })
  it('utf8 多位元組', () => {
    const s = '統一金流 ✓'
    expect(bytesToUtf8(utf8ToBytes(s))).toBe(s)
  })
})
