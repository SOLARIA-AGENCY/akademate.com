import assert from 'node:assert/strict'
import test from 'node:test'

import type { LearningSqlClient } from '../learning/next-learning-transaction.ts'
import { NextPayPalReturnError, validateNextPayPalReturn } from './paypal-return.ts'

test('validates a PayPal return only against the canonical order/provider pair', async () => {
  const calls: Array<{ query: string; params: unknown[] }> = []
  const tx: LearningSqlClient = {
    async unsafe<T>(query: string, params: unknown[] = []) {
      calls.push({ query, params })
      return [{ source_host: 'north-star.akademate.com', source_slug: 'course-1', order_status: 'awaiting_payment' }] as T[]
    },
  }
  const result = await validateNextPayPalReturn(
    tx,
    '62d22ec7-6f99-41b0-86c9-d14dd28964cf',
    '5O190127TN364715T',
  )
  assert.equal(result.host, 'north-star.akademate.com')
  assert.match(calls[0]?.query ?? '', /akademate_next_get_paypal_return/)
  assert.deepEqual(calls[0]?.params, [
    '62d22ec7-6f99-41b0-86c9-d14dd28964cf', '5O190127TN364715T',
  ])
})

test('rejects malformed or unmatched browser return identifiers', async () => {
  const tx: LearningSqlClient = { async unsafe<T>() { return [] as T[] } }
  await assert.rejects(validateNextPayPalReturn(tx, 'not-a-uuid', '5O190127TN364715T'),
    (error: unknown) => error instanceof NextPayPalReturnError && error.code === 'paypal_return_invalid')
  await assert.rejects(validateNextPayPalReturn(
    tx, '62d22ec7-6f99-41b0-86c9-d14dd28964cf', '5O190127TN364715T'),
  (error: unknown) => error instanceof NextPayPalReturnError && error.code === 'paypal_return_not_found')
})
