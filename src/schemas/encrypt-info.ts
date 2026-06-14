import { z } from 'zod'

// camelCase → PascalCase（送往 API 的欄位名）
export const FIELD_MAP = {
  merID: 'MerID',
  merTradeNo: 'MerTradeNo',
  tradeAmt: 'TradeAmt',
  timestamp: 'Timestamp',
  returnURL: 'ReturnURL',
  notifyURL: 'NotifyURL',
  backURL: 'BackURL',
  usrMail: 'UsrMail',
  usrMailFix: 'UsrMailFix',
  useTokenType: 'UseTokenType',
  creditShowType: 'CreditShowType',
  creditToken: 'CreditToken',
  prodDesc: 'ProdDesc',
  creditTokenType: 'CreditTokenType',
  creditTokenExpired: 'CreditTokenExpired',
  expireDate: 'ExpireDate',
  tradeLExpireSec: 'TradeLExpireSec',
  credit: 'Credit',
  iCash: 'ICash',
  atm: 'ATM',
  cvs: 'CVS',
  creditUnionPay: 'CreditUnionPay',
  creditRed: 'CreditRed',
  creditInst: 'CreditInst',
  bankType: 'BankType',
  paySet: 'PaySet',
  cardNo: 'CardNo',
  cardCVC: 'CardCVC',
  cardInst: 'CardInst',
  cardType: 'CardType',
  cardExpired: 'CardExpired',
  creditHash: 'CreditHash',
  api3D: 'API3D',
  payNo: 'PayNo',
  closeType: 'CloseType',
  tradeNo: 'TradeNo',
  bindVal: 'BindVal',
  isPlatForm: 'IsPlatForm',
} as const satisfies Record<string, string>

export type FieldKey = keyof typeof FIELD_MAP

const FIELD_MAP_LOOKUP: Record<string, string> = FIELD_MAP

export const toApiPayload = (info: Record<string, unknown>): Record<string, string> => {
  const out: Record<string, string> = {}
  for (const [k, v] of Object.entries(info)) {
    if (v === undefined || v === null) continue
    out[FIELD_MAP_LOOKUP[k] ?? k] = String(v)
  }
  return out
}

// 所有欄位預設 optional（zod 執行期驗證用）
type OptionalShape = { [K in FieldKey]: z.ZodOptional<z.ZodString> }
const allOptional = Object.fromEntries(
  (Object.keys(FIELD_MAP) as FieldKey[]).map((k) => [k, z.string().optional()] as const),
) as OptionalShape

// 自訂訊息同時涵蓋「缺少」與「空字串」
const requiredString = (msg: string): z.ZodString => z.string({ error: msg }).min(1, { error: msg })

// 共用必填：merID、timestamp
const base = z.object({
  ...allOptional,
  merID: requiredString('商店代號為必填(MerID is not setting)'),
  timestamp: requiredString('時間戳記為必填(Timestamp is not setting)'),
})

const required = (field: string, msg: string): Record<string, z.ZodString> => ({ [field]: requiredString(msg) })

// 交易建立（upp/atm/cvs/linepay/aftee_direct）
const tradeCreate = base.extend({
  ...required('merTradeNo', '商店訂單編號為必填(MerTradeNo is not setting)'),
  ...required('tradeAmt', '訂單金額為必填(TradeAmt is not setting)'),
})

// 信用卡：有 creditHash 免卡資料，否則需 cardNo/cardExpired/cardCVC（空字串視為未提供）
const credit = tradeCreate.superRefine((val, ctx) => {
  if (val.creditHash) return
  const checks: [string, string][] = [
    ['cardNo', '信用卡卡號為必填(CardNo is not setting)'],
    ['cardExpired', '信用卡到期年月為必填(CardExpired is not setting)'],
    ['cardCVC', '信用卡安全碼為必填(CardCVC is not setting)'],
  ]
  for (const [f, m] of checks) {
    if (!val[f as keyof typeof val]) ctx.addIssue({ code: 'custom', path: [f], message: m, input: val })
  }
})

const refund = base.extend({
  ...required('tradeNo', 'uni序號為必填(TradeNo is not setting)'),
  ...required('tradeAmt', '訂單金額為必填(TradeAmt is not setting)'),
})

export const schemas = {
  upp: tradeCreate,
  atm: tradeCreate,
  cvs: tradeCreate,
  linepay: tradeCreate,
  afteeDirect: tradeCreate,
  credit,
  cancelCvs: base.extend({ ...required('payNo', '超商代碼為必填(PayNo is not setting)') }),
  queryTrade: base,
  closeTrade: base.extend({
    ...required('tradeNo', 'uni序號為必填(TradeNo is not setting)'),
    ...required('closeType', '關帳類型為必填(CloseType is not setting)'),
  }),
  cancelTrade: base.extend({ ...required('tradeNo', 'uni序號為必填(TradeNo is not setting)') }),
  confirmAftee: base.extend({ ...required('tradeNo', 'uni序號為必填(TradeNo is not setting)') }),
  refundIcash: refund,
  refundAftee: refund,
  refundLinepay: refund,
  queryCreditBind: base,
  cancelCreditBind: base.extend({
    ...required('useTokenType', '信用卡Token類型為必填(UseTokenType is not setting)'),
    ...required('bindVal', '綁定回傳值 /信用卡Token(BindVal is not setting)'),
  }),
} as const

export type OperationKey = keyof typeof schemas

/**
 * 公開輸入欄位（camelCase，皆選填字串）。
 * 顯式定義而非從 z.input 推導：zod 的 .extend() 在大量同型別選填欄位下會把 z.input
 * 塌縮成索引簽章 `{ [x: string]: string }`，使打錯字無法被偵測。改用顯式介面可恢復
 * excess-property 檢查與正確的自動補全。
 */
export interface PayuniFields {
  merID?: string
  timestamp?: string
  merTradeNo?: string
  tradeAmt?: string
  returnURL?: string
  notifyURL?: string
  backURL?: string
  usrMail?: string
  usrMailFix?: string
  useTokenType?: string
  creditShowType?: string
  creditToken?: string
  prodDesc?: string
  creditTokenType?: string
  creditTokenExpired?: string
  expireDate?: string
  tradeLExpireSec?: string
  credit?: string
  iCash?: string
  atm?: string
  cvs?: string
  creditUnionPay?: string
  creditRed?: string
  creditInst?: string
  bankType?: string
  paySet?: string
  cardNo?: string
  cardCVC?: string
  cardInst?: string
  cardType?: string
  cardExpired?: string
  creditHash?: string
  api3D?: string
  payNo?: string
  closeType?: string
  tradeNo?: string
  bindVal?: string
  isPlatForm?: string
}

// 把交集 flatten 成單一物件型別，以保留 excess-property（打錯字）檢查
type Identity<T> = { [K in keyof T]: T[K] }
// 指定欄位變必填，其餘維持選填
type WithRequired<K extends keyof PayuniFields> = Identity<Omit<PayuniFields, K> & { [P in K]-?: string }>

/** 每操作的公開輸入型別（merID/timestamp 由 client 補，皆選填） */
export interface OperationInputMap {
  upp: WithRequired<'merTradeNo' | 'tradeAmt'>
  atm: WithRequired<'merTradeNo' | 'tradeAmt'>
  cvs: WithRequired<'merTradeNo' | 'tradeAmt'>
  linepay: WithRequired<'merTradeNo' | 'tradeAmt'>
  afteeDirect: WithRequired<'merTradeNo' | 'tradeAmt'>
  credit: WithRequired<'merTradeNo' | 'tradeAmt'>
  cancelCvs: WithRequired<'payNo'>
  queryTrade: PayuniFields
  closeTrade: WithRequired<'tradeNo' | 'closeType'>
  cancelTrade: WithRequired<'tradeNo'>
  confirmAftee: WithRequired<'tradeNo'>
  refundIcash: WithRequired<'tradeNo' | 'tradeAmt'>
  refundAftee: WithRequired<'tradeNo' | 'tradeAmt'>
  refundLinepay: WithRequired<'tradeNo' | 'tradeAmt'>
  queryCreditBind: PayuniFields
  cancelCreditBind: WithRequired<'useTokenType' | 'bindVal'>
}

export type ClientInput<K extends OperationKey> = OperationInputMap[K]

/** @deprecated 請改用 PayuniFields */
export type EncryptInfoInput = PayuniFields
