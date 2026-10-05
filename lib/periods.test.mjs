// node lib/periods.test.mjs
import assert from 'node:assert/strict'
import { quarterOf, nextQuarter, periodLabel, periodOptions } from './periods.ts'

assert.equal(quarterOf('2026-01-01'), '2026-T1')
assert.equal(quarterOf('2026-03-31'), '2026-T1')
assert.equal(quarterOf('2026-04-01'), '2026-T2')
assert.equal(quarterOf('2026-12-31'), '2026-T4')
assert.equal(nextQuarter('2026-T3'), '2026-T4')
assert.equal(nextQuarter('2026-T4'), '2027-T1')
assert.equal(periodLabel('2026-T4'), 'T4 2026')
assert.equal(periodLabel('2026'), '2026')
assert.deepEqual(periodOptions('2026-11-15'), ['2026-T4', '2027-T1', '2026', '2027'])
console.log('periods OK')
