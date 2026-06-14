import { errAsync, type ResultAsync } from 'neverthrow'
import { hashMismatchError, responseError, type PayuniError } from '../errors'
import { decrypt } from '../crypto/aes-gcm'
import { hashInfo } from '../crypto/hash'
import { parseQueryString } from './query-string'

export interface TradeResponse {
  status: string
  message: string
  raw: string
  data: Record<string, unknown>
}

const parseDecrypted = (s: string): Record<string, unknown> => {
  try {
    const j = JSON.parse(s)
    return typeof j === 'object' && j !== null ? (j as Record<string, unknown>) : { value: j }
  } catch {
    /* not JSON */
  }
  if (s.includes('=')) return parseQueryString(s)
  return { raw: s }
}

export const processResult = (
  cfg: { merKey: string; merIV: string },
  input: string | Record<string, unknown>,
): ResultAsync<TradeResponse, PayuniError> => {
  let parsed: Record<string, unknown>
  if (typeof input === 'string') {
    try {
      parsed = JSON.parse(input) as Record<string, unknown>
    } catch {
      return errAsync(responseError('傳入參數需為陣列(Result must be an array)'))
    }
  } else {
    parsed = input
  }

  const encryptInfo = parsed.EncryptInfo as string | undefined
  const hashVal = parsed.HashInfo as string | undefined
  const status = parsed.Status as string | undefined
  const message = (parsed.Message as string | undefined) ?? ''

  if (!encryptInfo) {
    if (status === 'API00003') return errAsync(responseError('無API版本號', status))
    return errAsync(responseError('缺少加密字串(missing EncryptInfo)', status))
  }
  if (!hashVal) return errAsync(responseError('缺少Hash資訊(missing HashInfo)', status))

  return hashInfo(cfg.merKey, encryptInfo, cfg.merIV).andThen((chk) => {
    if (chk !== hashVal) return errAsync<TradeResponse, PayuniError>(hashMismatchError('Hash值比對失敗(Hash mismatch)'))
    return decrypt(cfg.merKey, cfg.merIV, encryptInfo).map((decrypted) => ({
      status: status ?? '',
      message,
      raw: decrypted,
      data: parseDecrypted(decrypted),
    }))
  })
}
