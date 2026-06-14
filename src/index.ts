// client
export { createPayuniClient } from './client'
export type { PayuniClient } from './client'

// config
export { resolveConfig } from './config'
export type { PayuniConfig, PayuniEnv, ResolvedConfig } from './config'

// errors
export { configError, validationError, cryptoError, transportError, hashMismatchError, responseError } from './errors'
export type { PayuniError } from './errors'

// crypto（純函數）
export { encrypt, decrypt } from './crypto/aes-gcm'
export { hashInfo } from './crypto/hash'
export * as codec from './crypto/codec'

// core（純函數）
export { buildRequest } from './core/request'
export type { PayuniRequest } from './core/request'
export { processResult } from './core/response'
export type { TradeResponse } from './core/response'
export { toQueryString, parseQueryString } from './core/query-string'
export { postForm } from './core/transport'

// schemas / operations
export { schemas, toApiPayload, FIELD_MAP } from './schemas/encrypt-info'
export type {
  OperationKey,
  EncryptInfoInput,
  PayuniFields,
  OperationInputMap,
  ClientInput,
  FieldKey,
} from './schemas/encrypt-info'
export { OPERATIONS } from './operations/registry'
export type { OperationDef } from './operations/registry'
