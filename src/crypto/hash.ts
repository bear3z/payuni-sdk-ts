import { ResultAsync } from 'neverthrow'
import { cryptoError, type PayuniError } from '../errors'
import { bytesToHex, utf8ToBytes } from './codec'

export const hashInfo = (merKey: string, encryptInfo: string, merIV: string): ResultAsync<string, PayuniError> =>
  ResultAsync.fromPromise(
    (async () => {
      const digest = await crypto.subtle.digest('SHA-256', utf8ToBytes(merKey + encryptInfo + merIV))
      return bytesToHex(new Uint8Array(digest)).toUpperCase()
    })(),
    (e) => cryptoError('雜湊失敗 (hash failed)', e),
  )
