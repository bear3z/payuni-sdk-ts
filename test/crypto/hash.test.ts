import { describe, it, expect } from 'vitest'
import { createHash } from 'node:crypto'
import { hashInfo } from '../../src/crypto/hash'

const KEY = '12345678901234567890123456789012'
const IV = '1234567890123456'

describe('hashInfo', () => {
  it('= SHA256(key + enc + iv) 大寫 hex，與 Node 標準相符', async () => {
    const enc = 'deadbeef'
    const expected = createHash('sha256')
      .update(KEY + enc + IV, 'utf8')
      .digest('hex')
      .toUpperCase()
    const r = await hashInfo(KEY, enc, IV)
    expect(r._unsafeUnwrap()).toBe(expected)
  })
  it('空 enc 也可雜湊', async () => {
    const expected = createHash('sha256')
      .update(KEY + '' + IV, 'utf8')
      .digest('hex')
      .toUpperCase()
    expect((await hashInfo(KEY, '', IV))._unsafeUnwrap()).toBe(expected)
  })
})
