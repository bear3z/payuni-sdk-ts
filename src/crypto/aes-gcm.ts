import { ResultAsync } from 'neverthrow'
import { cryptoError, type PayuniError } from '../errors'
import { bytesToHex, hexToBytes, bytesToBase64, base64ToBytes, utf8ToBytes, bytesToUtf8 } from './codec'

const TAG_LEN_BYTES = 16
const SEP = ':::'

const importKey = (merKey: string): Promise<CryptoKey> =>
  crypto.subtle.importKey('raw', utf8ToBytes(merKey), { name: 'AES-GCM' }, false, ['encrypt', 'decrypt'])

export const encrypt = (merKey: string, merIV: string, plain: string): ResultAsync<string, PayuniError> =>
  ResultAsync.fromPromise(
    (async () => {
      if (plain === '') return plain
      const key = await importKey(merKey)
      const buf = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv: utf8ToBytes(merIV), tagLength: TAG_LEN_BYTES * 8 },
        key,
        utf8ToBytes(plain),
      )
      const ct = new Uint8Array(buf)
      const cipher = ct.subarray(0, ct.length - TAG_LEN_BYTES)
      const tag = ct.subarray(ct.length - TAG_LEN_BYTES)
      const combined = bytesToBase64(cipher) + SEP + bytesToBase64(tag)
      return bytesToHex(utf8ToBytes(combined))
    })(),
    (e) => cryptoError('加密失敗 (encrypt failed)', e),
  )

export const decrypt = (merKey: string, merIV: string, encryptStr: string): ResultAsync<string, PayuniError> =>
  ResultAsync.fromPromise(
    (async () => {
      if (encryptStr === '') return encryptStr
      const combined = bytesToUtf8(hexToBytes(encryptStr))
      const parts = combined.split(SEP).filter((s) => s.length > 0)
      const cipher = base64ToBytes(parts[0]!)
      const tag = base64ToBytes(parts[1]!)
      const data = new Uint8Array(cipher.length + tag.length)
      data.set(cipher, 0)
      data.set(tag, cipher.length)
      const key = await importKey(merKey)
      const pt = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv: utf8ToBytes(merIV), tagLength: TAG_LEN_BYTES * 8 },
        key,
        data,
      )
      return bytesToUtf8(new Uint8Array(pt))
    })(),
    (e) => cryptoError('解密失敗 (decrypt failed)', e),
  )
