const formUrlEncode = (s: string): string => encodeURIComponent(s).replace(/%20/g, '+')
const formUrlDecode = (s: string): string => decodeURIComponent(s.replace(/\+/g, ' '))

export const toQueryString = (obj: Record<string, unknown>): string =>
  Object.entries(obj)
    .filter(([, v]) => v !== undefined && v !== null)
    .map(([k, v]) => `${k}=${formUrlEncode(String(v))}`)
    .join('&')

export const parseQueryString = (qs: string): Record<string, string> => {
  const out: Record<string, string> = {}
  for (const pair of qs.split('&')) {
    if (pair === '') continue
    const idx = pair.indexOf('=')
    const key = idx === -1 ? pair : pair.slice(0, idx)
    const val = idx === -1 ? '' : pair.slice(idx + 1)
    out[formUrlDecode(key)] = formUrlDecode(val)
  }
  return out
}
