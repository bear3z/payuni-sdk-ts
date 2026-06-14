import { describe, it, expect } from 'vitest'
import { toQueryString, parseQueryString } from '../../src/core/query-string'

describe('toQueryString', () => {
  it('組成 key=value 並以 & 連接', () => {
    expect(toQueryString({ MerID: 'abc', TradeAmt: '100' })).toBe('MerID=abc&TradeAmt=100')
  })
  it('空白編碼為 +（form-urlencoded）', () => {
    expect(toQueryString({ ProdDesc: 'a b c' })).toBe('ProdDesc=a+b+c')
  })
  it('URL 值內的保留字元被編碼，不破壞結構', () => {
    expect(toQueryString({ ReturnURL: 'http://x.com/a?b=1&c=2' })).toBe(
      'ReturnURL=http%3A%2F%2Fx.com%2Fa%3Fb%3D1%26c%3D2',
    )
  })
  it('略過 undefined / null，但保留空字串', () => {
    expect(toQueryString({ A: 'x', B: undefined, C: null, D: '' })).toBe('A=x&D=')
  })
  it('維持插入順序', () => {
    expect(toQueryString({ B: '1', A: '2' })).toBe('B=1&A=2')
  })
})

describe('parseQueryString', () => {
  it('解析回物件，+ 轉空白、%xx 解碼', () => {
    expect(parseQueryString('A=a+b&ReturnURL=http%3A%2F%2Fx.com')).toEqual({ A: 'a b', ReturnURL: 'http://x.com' })
  })
  it('忽略空段', () => {
    expect(parseQueryString('A=1&&B=2')).toEqual({ A: '1', B: '2' })
  })
})
