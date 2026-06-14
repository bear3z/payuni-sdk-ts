import { ResultAsync, okAsync, errAsync } from 'neverthrow'
import { transportError, type PayuniError } from '../errors'
import { toQueryString } from './query-string'

const DEFAULT_TIMEOUT_MS = 30000

interface RawResponse {
  ok: boolean
  status: number
  body: string
}

const doPost = async (fetchFn: typeof fetch, url: string, body: string, timeoutMs: number): Promise<RawResponse> => {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const res = await fetchFn(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'PRESCOSDKAPI',
      },
      body,
      signal: controller.signal,
    })
    return { ok: res.ok, status: res.status, body: await res.text() }
  } finally {
    clearTimeout(timer)
  }
}

export const postForm = (
  fetchFn: typeof fetch,
  url: string,
  payload: Record<string, string>,
  timeoutMs: number = DEFAULT_TIMEOUT_MS,
): ResultAsync<string, PayuniError> =>
  ResultAsync.fromPromise(doPost(fetchFn, url, toQueryString(payload), timeoutMs), (e) =>
    transportError('連線失敗 (request failed)', e),
  ).andThen((r) =>
    r.ok
      ? okAsync<string, PayuniError>(r.body)
      : errAsync<string, PayuniError>(
          transportError(`HTTP ${r.status} (request failed)`, { status: r.status, body: r.body }),
        ),
  )
