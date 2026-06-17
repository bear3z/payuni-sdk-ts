import { errAsync, okAsync, type ResultAsync } from 'neverthrow'
import { validationError, type PayuniError } from './errors'
import { resolveConfig, type PayuniConfig } from './config'
import { buildRequest, type PayuniRequest } from './core/request'
import { postForm } from './core/transport'
import { processResult, type TradeResponse } from './core/response'
import { OPERATIONS } from './operations/registry'
import { type ClientInput, type OperationKey } from './schemas/encrypt-info'

const stripUndefined = (o: Record<string, unknown>): Record<string, unknown> => {
  const out: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(o)) if (v !== undefined) out[k] = v
  return out
}

const nowTimestamp = (): string => Math.floor(Date.now() / 1000).toString()

// HTML 屬性跳脫，避免 merID / baseUrl 含特殊字元時逸出 value 屬性造成注入
const escapeAttr = (s: string): string =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;')

// Auto-submit via a trailing inline <script> rather than <body onload>. A body
// onload only fires on a full document load; when a consumer injects this markup
// with document.write() during an existing page's load (readyState === 'loading'),
// the onload never fires and the form silently never submits. An inline script
// placed after the form runs as soon as it is parsed/written, so it works both for
// a standalone page load and for document.write injection.
const htmlForm = (action: string, p: PayuniRequest): string =>
  `<html><body>` +
  `<form action='${escapeAttr(action)}' method='post' id='upp'>` +
  `<input name='MerID' type='hidden' value='${escapeAttr(p.MerID)}' />` +
  `<input name='Version' type='hidden' value='${escapeAttr(p.Version)}' />` +
  `<input name='EncryptInfo' type='hidden' value='${escapeAttr(p.EncryptInfo)}' />` +
  `<input name='HashInfo' type='hidden' value='${escapeAttr(p.HashInfo)}' />` +
  `<input name='IsPlatForm' type='hidden' value='${escapeAttr(p.IsPlatForm)}' />` +
  `</form>` +
  `<script>document.getElementById('upp').submit();</script>` +
  `</body></html>`

export interface PayuniClient {
  upp: (input: ClientInput<'upp'>) => ResultAsync<string, PayuniError>
  atm: (input: ClientInput<'atm'>) => ResultAsync<TradeResponse, PayuniError>
  cvs: (input: ClientInput<'cvs'>) => ResultAsync<TradeResponse, PayuniError>
  linepay: (input: ClientInput<'linepay'>) => ResultAsync<TradeResponse, PayuniError>
  afteeDirect: (input: ClientInput<'afteeDirect'>) => ResultAsync<TradeResponse, PayuniError>
  credit: (input: ClientInput<'credit'>) => ResultAsync<TradeResponse, PayuniError>
  cancelCvs: (input: ClientInput<'cancelCvs'>) => ResultAsync<TradeResponse, PayuniError>
  queryTrade: (input: ClientInput<'queryTrade'>) => ResultAsync<TradeResponse, PayuniError>
  closeTrade: (input: ClientInput<'closeTrade'>) => ResultAsync<TradeResponse, PayuniError>
  cancelTrade: (input: ClientInput<'cancelTrade'>) => ResultAsync<TradeResponse, PayuniError>
  confirmAftee: (input: ClientInput<'confirmAftee'>) => ResultAsync<TradeResponse, PayuniError>
  refundIcash: (input: ClientInput<'refundIcash'>) => ResultAsync<TradeResponse, PayuniError>
  refundAftee: (input: ClientInput<'refundAftee'>) => ResultAsync<TradeResponse, PayuniError>
  refundLinepay: (input: ClientInput<'refundLinepay'>) => ResultAsync<TradeResponse, PayuniError>
  queryCreditBind: (input: ClientInput<'queryCreditBind'>) => ResultAsync<TradeResponse, PayuniError>
  cancelCreditBind: (input: ClientInput<'cancelCreditBind'>) => ResultAsync<TradeResponse, PayuniError>
  processResult: (raw: string | Record<string, unknown>) => ResultAsync<TradeResponse, PayuniError>
}

export const createPayuniClient = (config: PayuniConfig): PayuniClient => {
  const run = <K extends OperationKey>(
    key: K,
    input: ClientInput<K>,
  ): ResultAsync<TradeResponse | string, PayuniError> => {
    const op = OPERATIONS[key]
    return resolveConfig(config).asyncAndThen((cfg) => {
      const merged = {
        merID: config.merID,
        timestamp: nowTimestamp(),
        ...stripUndefined(input as Record<string, unknown>),
      }
      const parsed = op.schema.safeParse(merged)
      if (!parsed.success) {
        const issue = parsed.error.issues[0]
        return errAsync<TradeResponse | string, PayuniError>(
          validationError(issue?.message ?? '參數驗證失敗', parsed.error.issues),
        )
      }
      return buildRequest(
        { merKey: cfg.merKey, merIV: cfg.merIV },
        parsed.data as Record<string, unknown>,
        op.version,
      ).andThen((reqBody) => {
        const url = cfg.apiBase + op.endpoint
        if (op.kind === 'html') return okAsync<TradeResponse | string, PayuniError>(htmlForm(url, reqBody))
        return postForm(cfg.fetchFn, url, reqBody as unknown as Record<string, string>, cfg.timeoutMs).andThen((raw) =>
          processResult({ merKey: cfg.merKey, merIV: cfg.merIV }, raw),
        )
      })
    })
  }

  const json =
    <K extends OperationKey>(key: K) =>
    (input: ClientInput<K>): ResultAsync<TradeResponse, PayuniError> =>
      run(key, input) as ResultAsync<TradeResponse, PayuniError>

  return {
    upp: (input) => run('upp', input) as ResultAsync<string, PayuniError>,
    atm: json('atm'),
    cvs: json('cvs'),
    linepay: json('linepay'),
    afteeDirect: json('afteeDirect'),
    credit: json('credit'),
    cancelCvs: json('cancelCvs'),
    queryTrade: json('queryTrade'),
    closeTrade: json('closeTrade'),
    cancelTrade: json('cancelTrade'),
    confirmAftee: json('confirmAftee'),
    refundIcash: json('refundIcash'),
    refundAftee: json('refundAftee'),
    refundLinepay: json('refundLinepay'),
    queryCreditBind: json('queryCreditBind'),
    cancelCreditBind: json('cancelCreditBind'),
    processResult: (raw) =>
      resolveConfig(config).asyncAndThen((cfg) => processResult({ merKey: cfg.merKey, merIV: cfg.merIV }, raw)),
  }
}
