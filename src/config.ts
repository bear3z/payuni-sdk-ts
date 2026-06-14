import { ok, err, type Result } from 'neverthrow'
import { configError, type PayuniError } from './errors'

export type PayuniEnv = 'production' | 'sandbox'

/** 預設請求逾時（毫秒） */
export const DEFAULT_TIMEOUT_MS = 30000

export interface PayuniConfig {
  merKey: string
  merIV: string
  env?: PayuniEnv
  merID?: string
  baseUrl?: string
  fetch?: typeof fetch
  /** 請求逾時（毫秒），預設 30000 */
  timeoutMs?: number
}

export interface ResolvedConfig {
  merKey: string
  merIV: string
  merID?: string
  apiBase: string
  fetchFn: typeof fetch
  timeoutMs: number
}

export const resolveConfig = (config: PayuniConfig): Result<ResolvedConfig, PayuniError> => {
  if (!config.merKey) return err(configError('key is not setting'))
  if (!config.merIV) return err(configError('iv is not setting'))
  const prefix = config.env === 'sandbox' ? 'https://sandbox-' : 'https://'
  const apiBase = config.baseUrl ?? `${prefix}api.payuni.com.tw/api/`
  const fetchFn = config.fetch ?? globalThis.fetch
  return ok({
    merKey: config.merKey,
    merIV: config.merIV,
    merID: config.merID,
    apiBase,
    fetchFn,
    timeoutMs: config.timeoutMs ?? DEFAULT_TIMEOUT_MS,
  })
}
