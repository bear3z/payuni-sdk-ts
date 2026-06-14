import { describe, it, expect } from 'vitest'
import { postForm } from '../../src/core/transport'

describe('postForm', () => {
  it('以 form-urlencoded POST，帶 User-Agent，回應 text', async () => {
    let captured: { url: string; init: RequestInit } | null = null
    const fakeFetch = (async (url: string, init: RequestInit) => {
      captured = { url, init }
      return new Response('RESP_BODY', { status: 200 })
    }) as unknown as typeof fetch

    const r = await postForm(fakeFetch, 'http://x/api/atm', { MerID: 'abc', EncryptInfo: 'ff' })
    expect(r._unsafeUnwrap()).toBe('RESP_BODY')
    expect(captured!.url).toBe('http://x/api/atm')
    expect(captured!.init.method).toBe('POST')
    expect((captured!.init.headers as Record<string, string>)['Content-Type']).toBe('application/x-www-form-urlencoded')
    expect((captured!.init.headers as Record<string, string>)['User-Agent']).toBe('PRESCOSDKAPI')
    expect(captured!.init.body).toBe('MerID=abc&EncryptInfo=ff')
  })

  it('fetch 丟錯 → TransportError', async () => {
    const fakeFetch = (async () => {
      throw new Error('network down')
    }) as unknown as typeof fetch
    const r = await postForm(fakeFetch, 'http://x', {})
    expect(r._unsafeUnwrapErr().tag).toBe('TransportError')
  })

  it('HTTP 4xx/5xx → TransportError，cause 帶 status', async () => {
    const fakeFetch = (async () => new Response('Server Error', { status: 500 })) as unknown as typeof fetch
    const r = await postForm(fakeFetch, 'http://x', {})
    const err = r._unsafeUnwrapErr()
    expect(err.tag).toBe('TransportError')
    if (err.tag === 'TransportError') {
      expect(err.message).toContain('500')
      expect((err.cause as { status: number }).status).toBe(500)
    }
  })

  it('逾時 → AbortController 觸發、回 TransportError', async () => {
    // fetch 尊重 signal：abort 時 reject
    const fakeFetch = ((_url: string, init: RequestInit) =>
      new Promise((_resolve, reject) => {
        init.signal?.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')))
      })) as unknown as typeof fetch
    const r = await postForm(fakeFetch, 'http://x', {}, 10)
    expect(r._unsafeUnwrapErr().tag).toBe('TransportError')
  })

  it('帶 signal 到 fetch', async () => {
    let hasSignal = false
    const fakeFetch = (async (_url: string, init: RequestInit) => {
      hasSignal = init.signal instanceof AbortSignal
      return new Response('ok')
    }) as unknown as typeof fetch
    await postForm(fakeFetch, 'http://x', {})
    expect(hasSignal).toBe(true)
  })
})
