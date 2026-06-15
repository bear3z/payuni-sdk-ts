# payuni-sdk-ts

[![npm version](https://img.shields.io/npm/v/payuni-sdk-ts.svg)](https://www.npmjs.com/package/payuni-sdk-ts)
[![npm downloads](https://img.shields.io/npm/dm/payuni-sdk-ts.svg)](https://www.npmjs.com/package/payuni-sdk-ts)
[![license](https://img.shields.io/npm/l/payuni-sdk-ts.svg)](./LICENSE)

PayUni 統一金流 SDK 的 TypeScript 函數式（FP）版本，改寫自官方 [.NET SDK](https://github.com/payuni/NET_SDK)。

- 以 [neverthrow](https://github.com/supermacro/neverthrow) 的 `Result` / `ResultAsync` 表達成功與失敗，錯誤為判別聯合（discriminated union），不丟例外。
- 型別化的「每操作函數」：`upp`、`atm`、`credit`、`queryTrade`、`closeTrade`…，各自有精確的輸入型別與 [zod](https://zod.dev) 驗證。
- 跨 runtime：以 Web Crypto（`crypto.subtle`）與全域 `fetch` 實作，可跑在 Node 18+、Deno、Bun、edge。
- 與 PayUni 伺服器協定相容：AES-256-GCM 加解密、SHA256 大寫雜湊、form-urlencoded 參數。

## 目錄

- [環境需求](#環境需求)
- [安裝](#安裝)
- [快速開始](#快速開始)
- [操作對照表](#操作對照表)
- [回傳處理（ReturnURL / NotifyURL）](#回傳處理returnurl--notifyurl)
- [錯誤處理](#錯誤處理)
- [純函數 API](#純函數-api)
- [與 .NET 版的差異](#與-net-版的差異)
- [LICENSE](#license)

## 環境需求

- Node.js 20 以上（內建 `fetch` 與全域 Web Crypto），或任何支援 Web 標準（`crypto.subtle`、`fetch`）的 runtime（Deno、Bun、edge）。
- Node 18 的 `globalThis.crypto` 需 `--experimental-global-webcrypto` 旗標，故最低支援版本為 20。

## 安裝

```bash
pnpm add payuni-sdk-ts
# 或 npm install payuni-sdk-ts / yarn add payuni-sdk-ts
```

## 快速開始

```ts
import { createPayuniClient } from 'payuni-sdk-ts'

const client = createPayuniClient({
  merKey: '12345678901234567890123456789012', // Hash Key（32 bytes）
  merIV: '1234567890123456', // Hash IV（16 bytes）
  env: 'sandbox', // 'production'（預設）| 'sandbox'
  merID: 'ABC', // 選填：預設商店代號，每筆可覆寫
})

// 整合式支付頁（upp）→ 回傳自動送出的 HTML 表單字串
const result = await client.upp({
  merTradeNo: 'test20220829111528',
  tradeAmt: '100',
  returnURL: 'https://your.site/api/return',
  notifyURL: 'https://your.site/api/notify',
})

result.match(
  (html) => {
    // 把 html 回給瀏覽器，使用者會被自動導向 PayUni 支付頁
    res.send(html)
  },
  (err) => {
    console.error(err.tag, err.message)
  },
)
```

> `merKey` / `merIV` 請登入 PAYUNi 平台檢視商店串接資訊取得。
> `timestamp` 未提供時會自動以當前 Unix 秒數帶入；也可手動傳入覆寫。
> 各參數詳細內容請參考[統一金流 API 串接文件](https://www.payuni.com.tw/docs/web/#/7/34)對應功能的 EncryptInfo。

## 操作對照表

| 方法 | 對應 .NET mode | 端點 | 必填欄位（除 `merID` / `timestamp`） |
|------|------|------|------|
| `upp` | upp | `upp`（HTML 表單） | `merTradeNo`, `tradeAmt` |
| `atm` | atm | `atm` | `merTradeNo`, `tradeAmt` |
| `cvs` | cvs | `cvs` | `merTradeNo`, `tradeAmt` |
| `linepay` | linepay | `linepay` | `merTradeNo`, `tradeAmt`（version 1.1） |
| `afteeDirect` | aftee_direct | `aftee_direct` | `merTradeNo`, `tradeAmt` |
| `credit` | credit | `credit` | `merTradeNo`, `tradeAmt`，且 `creditHash` 或（`cardNo` + `cardExpired` + `cardCVC`） |
| `cancelCvs` | cancel_cvs | `cancel_cvs` | `payNo` |
| `queryTrade` | trade_query | `trade/query` | — |
| `closeTrade` | trade_close | `trade/close` | `tradeNo`, `closeType` |
| `cancelTrade` | trade_cancel | `trade/cancel` | `tradeNo` |
| `confirmAftee` | trade_confirm_aftee | `trade/common/confirm/aftee` | `tradeNo` |
| `refundIcash` | trade_refund_icash | `trade/common/refund/icash` | `tradeNo`, `tradeAmt` |
| `refundAftee` | trade_refund_aftee | `trade/common/refund/aftee` | `tradeNo`, `tradeAmt` |
| `refundLinepay` | trade_refund_linepay | `trade/common/refund/linepay` | `tradeNo`, `tradeAmt` |
| `queryCreditBind` | credit_bind_query | `credit_bind/query` | — |
| `cancelCreditBind` | credit_bind_cancel | `credit_bind/cancel` | `useTokenType`, `bindVal` |

幕後類（非 `upp`）回傳 `TradeResponse`：

```ts
interface TradeResponse {
  status: string // 外層 API 狀態碼
  message: string // 外層訊息
  raw: string // 解密後原始字串
  data: Record<string, unknown> // 解析後資料（先試 JSON，退回 query-string，再退回 { raw }）
}
```

## 回傳處理（ReturnURL / NotifyURL）

PayUni 在交易完成後會把結果回傳到你的 `returnURL` / `notifyURL`。收到後用 `processResult` 驗章解密：

```ts
// Express 範例
app.post('/api/notify', async (req, res) => {
  const result = await client.processResult(req.body) // 可傳物件或 JSON 字串
  result.match(
    (data) => {
      // data.data 為解密後的交易資訊
      res.send('1|OK')
    },
    (err) => {
      // 驗章失敗（HashMismatchError）、缺欄位（ResponseError）等
      res.status(400).send(err.message)
    },
  )
})
```

## 錯誤處理

所有操作回傳 `ResultAsync<T, PayuniError>`。`PayuniError` 為判別聯合，用 `tag` 區分：

```ts
type PayuniError =
  | { tag: 'ConfigError'; message: string } // 缺 merKey / merIV
  | { tag: 'ValidationError'; message: string; issues: ZodIssue[] } // 必填欄位驗證失敗
  | { tag: 'CryptoError'; message: string; cause?: unknown } // 加解密失敗
  | { tag: 'TransportError'; message: string; cause?: unknown } // 網路 / fetch 失敗
  | { tag: 'HashMismatchError'; message: string } // 回傳驗章失敗
  | { tag: 'ResponseError'; message: string; status?: string } // 缺 EncryptInfo / HashInfo、API00003 等
```

可用 `.match()`、`.map()`、`.andThen()`、`.mapErr()` 等 neverthrow 方法組合：

```ts
const r = await client.queryTrade({ merTradeNo: 'T1' })
if (r.isErr()) {
  switch (r.error.tag) {
    case 'ValidationError':
      // ...
      break
    case 'TransportError':
      // 可重試
      break
  }
}
```

## 純函數 API

進階用途可直接使用底層純函數（皆與 client 解耦）：

```ts
import { encrypt, decrypt, hashInfo, buildRequest, processResult, toQueryString, OPERATIONS } from 'payuni-sdk-ts'

const enc = await encrypt(merKey, merIV, 'MerID=abc&TradeAmt=100') // ResultAsync<string, PayuniError>
const hash = await hashInfo(merKey, enc._unsafeUnwrap(), merIV)
```

## 與 .NET 版的差異

| .NET 版 | payuni-sdk-ts |
|------|------|
| `class payuniAPI`，可變狀態 | `createPayuniClient(config)` 純函數工廠 |
| `UniversalTrade(info, mode)` 字串 mode 派發 | 型別化每操作方法（`upp`、`atm`…） |
| 回傳 JSON 字串 | 回傳 `Result<TradeResponse>`，已解析 |
| 丟例外 / `Result.Message` | 判別聯合 `PayuniError`，不丟例外 |
| BouncyCastle + Newtonsoft.Json | Web Crypto + 原生 JSON，僅依賴 neverthrow + zod |
| .NET Framework / .NET 8/9 | Node 18+ / 任意 Web 標準 runtime |

行為上保留：AES-256-GCM（`hex(base64(cipher):::base64(tag))` 格式）、`SHA256(merKey + encryptInfo + merIV)` 大寫雜湊、`linepay` 自動帶 version 1.1、`IsPlatForm` 移出加密內容改放外層（代理商模式）、`upp` 自動送出表單、User-Agent `PRESCOSDKAPI`、完整端點對應表。

更多範例見 [`examples/`](./examples)。

## 開發

```bash
pnpm install      # 安裝依賴並自動設定 git hooks（simple-git-hooks）
pnpm test         # vitest 測試
pnpm typecheck    # tsc 型別檢查
pnpm lint         # oxlint 靜態檢查
pnpm format       # oxfmt 格式化（format:check 僅檢查）
pnpm build        # tsdown 產出 dist（ESM + CJS + d.ts）
```

- **Lint / Format**：[oxlint](https://oxc.rs) + [oxfmt](https://oxc.rs)（設定見 `.oxlintrc.json`、`.oxfmtrc.json`）。
- **Git hooks**：[simple-git-hooks](https://github.com/toplenboren/simple-git-hooks) 的 `pre-commit` 會執行
  `pnpm i --frozen-lockfile --ignore-scripts --offline && pnpm run build && npx nano-staged`，
  其中 [nano-staged](https://github.com/usmanyunusov/nano-staged) 對暫存的 `.ts/.js` 檔跑 `oxlint --fix` 與 `oxfmt`。

## LICENSE

```text
Copyright 2022 PRESCO. All rights reserved.
Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at
    http://www.apache.org/licenses/LICENSE-2.0
Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
```
