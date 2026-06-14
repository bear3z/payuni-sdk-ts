import { schemas, type OperationKey } from '../schemas/encrypt-info'
import type { z } from 'zod'

export interface OperationDef {
  mode: string
  endpoint: string
  version: string
  kind: 'html' | 'json'
  schema: z.ZodType
}

export const OPERATIONS: Record<OperationKey, OperationDef> = {
  upp: { mode: 'upp', endpoint: 'upp', version: '1.0', kind: 'html', schema: schemas.upp },
  atm: { mode: 'atm', endpoint: 'atm', version: '1.0', kind: 'json', schema: schemas.atm },
  cvs: { mode: 'cvs', endpoint: 'cvs', version: '1.0', kind: 'json', schema: schemas.cvs },
  linepay: { mode: 'linepay', endpoint: 'linepay', version: '1.1', kind: 'json', schema: schemas.linepay },
  afteeDirect: {
    mode: 'aftee_direct',
    endpoint: 'aftee_direct',
    version: '1.0',
    kind: 'json',
    schema: schemas.afteeDirect,
  },
  credit: { mode: 'credit', endpoint: 'credit', version: '1.0', kind: 'json', schema: schemas.credit },
  cancelCvs: { mode: 'cancel_cvs', endpoint: 'cancel_cvs', version: '1.0', kind: 'json', schema: schemas.cancelCvs },
  queryTrade: {
    mode: 'trade_query',
    endpoint: 'trade/query',
    version: '1.0',
    kind: 'json',
    schema: schemas.queryTrade,
  },
  closeTrade: {
    mode: 'trade_close',
    endpoint: 'trade/close',
    version: '1.0',
    kind: 'json',
    schema: schemas.closeTrade,
  },
  cancelTrade: {
    mode: 'trade_cancel',
    endpoint: 'trade/cancel',
    version: '1.0',
    kind: 'json',
    schema: schemas.cancelTrade,
  },
  confirmAftee: {
    mode: 'trade_confirm_aftee',
    endpoint: 'trade/common/confirm/aftee',
    version: '1.0',
    kind: 'json',
    schema: schemas.confirmAftee,
  },
  refundIcash: {
    mode: 'trade_refund_icash',
    endpoint: 'trade/common/refund/icash',
    version: '1.0',
    kind: 'json',
    schema: schemas.refundIcash,
  },
  refundAftee: {
    mode: 'trade_refund_aftee',
    endpoint: 'trade/common/refund/aftee',
    version: '1.0',
    kind: 'json',
    schema: schemas.refundAftee,
  },
  refundLinepay: {
    mode: 'trade_refund_linepay',
    endpoint: 'trade/common/refund/linepay',
    version: '1.0',
    kind: 'json',
    schema: schemas.refundLinepay,
  },
  queryCreditBind: {
    mode: 'credit_bind_query',
    endpoint: 'credit_bind/query',
    version: '1.0',
    kind: 'json',
    schema: schemas.queryCreditBind,
  },
  cancelCreditBind: {
    mode: 'credit_bind_cancel',
    endpoint: 'credit_bind/cancel',
    version: '1.0',
    kind: 'json',
    schema: schemas.cancelCreditBind,
  },
}
