import type { ResultAsync } from 'neverthrow'
import type { PayuniError } from '../errors'
import { encrypt } from '../crypto/aes-gcm'
import { hashInfo } from '../crypto/hash'
import { toQueryString } from './query-string'
import { toApiPayload } from '../schemas/encrypt-info'

export interface PayuniRequest {
  MerID: string
  Version: string
  EncryptInfo: string
  HashInfo: string
  IsPlatForm: string
}

export const buildRequest = (
  cfg: { merKey: string; merIV: string },
  info: Record<string, unknown>,
  version: string,
): ResultAsync<PayuniRequest, PayuniError> => {
  const { isPlatForm, ...rest } = info
  const payload = toApiPayload(rest)
  const plain = toQueryString(payload)
  return encrypt(cfg.merKey, cfg.merIV, plain).andThen((enc) =>
    hashInfo(cfg.merKey, enc, cfg.merIV).map((hash) => ({
      MerID: payload.MerID ?? '',
      Version: version,
      EncryptInfo: enc,
      HashInfo: hash,
      IsPlatForm: isPlatForm != null ? String(isPlatForm) : '',
    })),
  )
}
