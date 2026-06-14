const encoder = new TextEncoder()
const decoder = new TextDecoder()

// 以 new Uint8Array(...) 複製，確保底層為 ArrayBuffer（非 SharedArrayBuffer），符合 Web Crypto 的 BufferSource
export const utf8ToBytes = (s: string): Uint8Array<ArrayBuffer> => new Uint8Array(encoder.encode(s))
export const bytesToUtf8 = (b: Uint8Array): string => decoder.decode(b)

export const bytesToHex = (bytes: Uint8Array): string => {
  let hex = ''
  for (const b of bytes) hex += b.toString(16).padStart(2, '0')
  return hex
}

export const hexToBytes = (hex: string): Uint8Array<ArrayBuffer> => {
  const clean = hex.replace(/\s+/g, '')
  const len = clean.length >> 1
  const out = new Uint8Array(len)
  for (let i = 0; i < len; i++) out[i] = parseInt(clean.slice(i * 2, i * 2 + 2), 16)
  return out
}

export const bytesToBase64 = (bytes: Uint8Array): string => {
  let bin = ''
  const chunk = 0x8000
  for (let i = 0; i < bytes.length; i += chunk) {
    bin += String.fromCharCode(...bytes.subarray(i, i + chunk))
  }
  return btoa(bin)
}

export const base64ToBytes = (b64: string): Uint8Array<ArrayBuffer> => {
  const bin = atob(b64)
  const out = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i)
  return out
}
