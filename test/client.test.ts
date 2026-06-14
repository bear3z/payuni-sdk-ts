import { describe, it, expect } from 'vitest'
import { createPayuniClient } from '../src/client'
import { encrypt, decrypt } from '../src/crypto/aes-gcm'
import { hashInfo } from '../src/crypto/hash'
import { parseQueryString } from '../src/core/query-string'

const KEY = '12345678901234567890123456789012'
const IV = '1234567890123456'

const serverEcho = async (payload: object) => {
  const enc = (await encrypt(KEY, IV, JSON.stringify(payload)))._unsafeUnwrap()
  const hash = (await hashInfo(KEY, enc, IV))._unsafeUnwrap()
  return JSON.stringify({ Status: 'SUCCESS', Message: 'ok', EncryptInfo: enc, HashInfo: hash })
}

describe('createPayuniClient', () => {
  it('upp 回傳自動送出 HTML 表單，action 指向 upp 端點', async () => {
    const client = createPayuniClient({ merKey: KEY, merIV: IV, merID: 'abc', env: 'sandbox' })
    const r = await client.upp({ merTradeNo: 'T1', tradeAmt: '100', timestamp: '1' })
    const html = r._unsafeUnwrap()
    expect(html).toContain("action='https://sandbox-api.payuni.com.tw/api/upp'")
    expect(html).toContain("id='upp'")
    expect(html).toContain("name='EncryptInfo'")
    expect(html).toContain('document.getElementById("upp").submit()')
  })

  it('atm 走 fetch，POST 到正確端點並回傳解析後結果', async () => {
    let url = ''
    let body = ''
    const fakeFetch = (async (u: string, init: RequestInit) => {
      url = u
      body = init.body as string
      return new Response(await serverEcho({ TradeNo: 'U1', BankType: '822' }))
    }) as unknown as typeof fetch
    const client = createPayuniClient({ merKey: KEY, merIV: IV, merID: 'abc', fetch: fakeFetch })
    const r = await client.atm({ merTradeNo: 'T1', tradeAmt: '100', bankType: '822', timestamp: '1' })
    expect(url).toBe('https://api.payuni.com.tw/api/atm')
    // 送出的 body 內 EncryptInfo 解密後含 PascalCase 欄位
    const sent = parseQueryString(body)
    const plain = (await decrypt(KEY, IV, sent.EncryptInfo!))._unsafeUnwrap()
    expect(parseQueryString(plain)).toMatchObject({ MerID: 'abc', MerTradeNo: 'T1', TradeAmt: '100', BankType: '822' })
    expect(r._unsafeUnwrap().data).toEqual({ TradeNo: 'U1', BankType: '822' })
  })

  it('自動帶入 config.merID 與自動 timestamp（未提供時）', async () => {
    const fakeFetch = (async () => new Response(await serverEcho({ ok: '1' }))) as unknown as typeof fetch
    const client = createPayuniClient({ merKey: KEY, merIV: IV, merID: 'M9', fetch: fakeFetch })
    const r = await client.queryTrade({})
    expect(r.isOk()).toBe(true)
  })

  it('驗證失敗短路為 ValidationError（不呼叫 fetch）', async () => {
    let called = false
    const fakeFetch = (async () => {
      called = true
      return new Response('')
    }) as unknown as typeof fetch
    const client = createPayuniClient({ merKey: KEY, merIV: IV, merID: 'abc', fetch: fakeFetch })
    const r = await client.atm({ tradeAmt: '100', timestamp: '1' } as never)
    expect(r._unsafeUnwrapErr().tag).toBe('ValidationError')
    expect(called).toBe(false)
  })

  it('缺 merID（config 與 input 都沒有）→ ValidationError', async () => {
    const client = createPayuniClient({ merKey: KEY, merIV: IV })
    const r = await client.queryTrade({ timestamp: '1' })
    expect(r._unsafeUnwrapErr().tag).toBe('ValidationError')
  })

  it('config 無效 → 每操作回 ConfigError', async () => {
    const client = createPayuniClient({ merKey: '', merIV: IV })
    const r = await client.queryTrade({ merID: 'abc', timestamp: '1' })
    expect(r._unsafeUnwrapErr().tag).toBe('ConfigError')
  })

  it('linepay 帶 version 1.1', async () => {
    let body = ''
    const fakeFetch = (async (_u: string, init: RequestInit) => {
      body = init.body as string
      return new Response(await serverEcho({ ok: '1' }))
    }) as unknown as typeof fetch
    const client = createPayuniClient({ merKey: KEY, merIV: IV, merID: 'abc', fetch: fakeFetch })
    await client.linepay({ merTradeNo: 'T1', tradeAmt: '100', timestamp: '1' })
    expect(parseQueryString(body).Version).toBe('1.1')
  })

  it('client.processResult 處理回傳', async () => {
    const client = createPayuniClient({ merKey: KEY, merIV: IV })
    const raw = await serverEcho({ TradeNo: 'U5' })
    const r = await client.processResult(raw)
    expect(r._unsafeUnwrap().data).toEqual({ TradeNo: 'U5' })
  })

  it('upp 帶 isPlatForm：外層 form 含 IsPlatForm，加密內容不含', async () => {
    const client = createPayuniClient({ merKey: KEY, merIV: IV, merID: 'abc' })
    const r = await client.upp({ merTradeNo: 'T1', tradeAmt: '100', timestamp: '1', isPlatForm: 'Y' })
    const html = r._unsafeUnwrap()
    const m = html.match(/name='IsPlatForm' type='hidden' value='([^']*)'/)
    expect(m?.[1]).toBe('Y')
    const enc = html.match(/name='EncryptInfo' type='hidden' value='([^']*)'/)![1]!
    const plain = (await decrypt(KEY, IV, enc))._unsafeUnwrap()
    expect(plain).not.toContain('IsPlatForm')
  })

  it('upp 對 merID 做 HTML 屬性跳脫（防注入）', async () => {
    const client = createPayuniClient({ merKey: KEY, merIV: IV, merID: "abc'/><script>alert(1)</script>" })
    const html = (await client.upp({ merTradeNo: 'T1', tradeAmt: '100', timestamp: '1' }))._unsafeUnwrap()
    expect(html).not.toContain('<script>alert(1)</script>')
    expect(html).toContain('&#39;')
    expect(html).toContain('&lt;script&gt;')
  })

  it('credit 用 creditHash（無卡號）可成功 POST 到 credit', async () => {
    let url = ''
    const fakeFetch = (async (u: string) => {
      url = u
      return new Response(await serverEcho({ ok: '1' }))
    }) as unknown as typeof fetch
    const client = createPayuniClient({ merKey: KEY, merIV: IV, merID: 'abc', fetch: fakeFetch })
    const r = await client.credit({ merTradeNo: 'T1', tradeAmt: '100', creditHash: 'H', timestamp: '1' })
    expect(url).toBe('https://api.payuni.com.tw/api/credit')
    expect(r.isOk()).toBe(true)
  })

  it.each([
    [
      'cvs',
      (c: ReturnType<typeof createPayuniClient>) => c.cvs({ merTradeNo: 'T1', tradeAmt: '1', timestamp: '1' }),
      'cvs',
    ],
    [
      'afteeDirect',
      (c: ReturnType<typeof createPayuniClient>) => c.afteeDirect({ merTradeNo: 'T1', tradeAmt: '1', timestamp: '1' }),
      'aftee_direct',
    ],
    [
      'cancelCvs',
      (c: ReturnType<typeof createPayuniClient>) => c.cancelCvs({ payNo: 'P1', timestamp: '1' }),
      'cancel_cvs',
    ],
    [
      'closeTrade',
      (c: ReturnType<typeof createPayuniClient>) => c.closeTrade({ tradeNo: 'U1', closeType: '1', timestamp: '1' }),
      'trade/close',
    ],
    [
      'cancelTrade',
      (c: ReturnType<typeof createPayuniClient>) => c.cancelTrade({ tradeNo: 'U1', timestamp: '1' }),
      'trade/cancel',
    ],
    [
      'confirmAftee',
      (c: ReturnType<typeof createPayuniClient>) => c.confirmAftee({ tradeNo: 'U1', timestamp: '1' }),
      'trade/common/confirm/aftee',
    ],
    [
      'refundIcash',
      (c: ReturnType<typeof createPayuniClient>) => c.refundIcash({ tradeNo: 'U1', tradeAmt: '1', timestamp: '1' }),
      'trade/common/refund/icash',
    ],
    [
      'refundAftee',
      (c: ReturnType<typeof createPayuniClient>) => c.refundAftee({ tradeNo: 'U1', tradeAmt: '1', timestamp: '1' }),
      'trade/common/refund/aftee',
    ],
    [
      'refundLinepay',
      (c: ReturnType<typeof createPayuniClient>) => c.refundLinepay({ tradeNo: 'U1', tradeAmt: '1', timestamp: '1' }),
      'trade/common/refund/linepay',
    ],
    [
      'queryCreditBind',
      (c: ReturnType<typeof createPayuniClient>) => c.queryCreditBind({ timestamp: '1' }),
      'credit_bind/query',
    ],
    [
      'cancelCreditBind',
      (c: ReturnType<typeof createPayuniClient>) =>
        c.cancelCreditBind({ useTokenType: '1', bindVal: 'B', timestamp: '1' }),
      'credit_bind/cancel',
    ],
  ])('%s POST 到正確端點', async (_name, call, endpoint) => {
    let url = ''
    const fakeFetch = (async (u: string) => {
      url = u
      return new Response(await serverEcho({ ok: '1' }))
    }) as unknown as typeof fetch
    const client = createPayuniClient({ merKey: KEY, merIV: IV, merID: 'abc', fetch: fakeFetch })
    const r = await call(client)
    expect(url).toBe(`https://api.payuni.com.tw/api/${endpoint}`)
    expect(r.isOk()).toBe(true)
  })
})
