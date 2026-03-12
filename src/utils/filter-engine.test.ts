import { describe, it, expect } from 'vitest'
import { evaluateCondition, matchesRule, filterInstruments, computeBalanceSummary, findOverlappingInstruments, detectConflicts } from './filter-engine'
import type { Condition, Instrument, SegmentRule } from '../types'

const mockInstruments: Instrument[] = [
  { id: 1, productCode: 'FRM-30', branchCode: 'BR-001', amortizationCode: 'Fixed', currentBookValue: 250000, currentCouponRate: 0.005, originalTerm: 360, balance: 240000 },
  { id: 2, productCode: 'FRM-15', branchCode: 'BR-003', amortizationCode: 'Fixed', currentBookValue: 180000, currentCouponRate: 0.004, originalTerm: 180, balance: 170000 },
  { id: 3, productCode: 'AUTO-NEW', branchCode: 'BR-005', amortizationCode: 'Fixed', currentBookValue: 35000, currentCouponRate: 0.007, originalTerm: 60, balance: 30000 },
  { id: 4, productCode: 'CRE-FIXED', branchCode: 'BR-001', amortizationCode: 'Interest-Only', currentBookValue: 1500000, currentCouponRate: 0.006, originalTerm: 120, balance: 1450000 },
  { id: 5, productCode: 'HELOC', branchCode: 'BR-008', amortizationCode: 'Variable', currentBookValue: 75000, currentCouponRate: 0.008, originalTerm: 240, balance: 60000 },
]

function makeRule(conditions: Condition[], exclusions: Condition[] = []): SegmentRule {
  return { groups: [{ id: 'g1', conditions }], exclusions }
}

describe('evaluateCondition', () => {
  it('matches IN operator for list values', () => {
    const condition: Condition = { id: '1', dimensionId: 1, dimensionColumn: 'productCode', operator: 'IN', values: ['FRM-30', 'FRM-15'] }
    expect(evaluateCondition(mockInstruments[0], condition)).toBe(true)
    expect(evaluateCondition(mockInstruments[1], condition)).toBe(true)
    expect(evaluateCondition(mockInstruments[2], condition)).toBe(false)
  })

  it('matches NOT_IN operator', () => {
    const condition: Condition = { id: '1', dimensionId: 1, dimensionColumn: 'productCode', operator: 'NOT_IN', values: ['AUTO-NEW', 'AUTO-USED'] }
    expect(evaluateCondition(mockInstruments[0], condition)).toBe(true)
    expect(evaluateCondition(mockInstruments[2], condition)).toBe(false)
  })

  it('matches BETWEEN operator for numeric values', () => {
    const condition: Condition = { id: '1', dimensionId: 4, dimensionColumn: 'currentBookValue', operator: 'BETWEEN', values: [], numericRange: { min: 100000, max: 300000 } }
    expect(evaluateCondition(mockInstruments[0], condition)).toBe(true)
    expect(evaluateCondition(mockInstruments[1], condition)).toBe(true)
    expect(evaluateCondition(mockInstruments[2], condition)).toBe(false)
    expect(evaluateCondition(mockInstruments[3], condition)).toBe(false)
  })

  it('matches GT operator', () => {
    const condition: Condition = { id: '1', dimensionId: 4, dimensionColumn: 'currentBookValue', operator: 'GT', values: [], numericRange: { min: 1000000, max: 0 } }
    expect(evaluateCondition(mockInstruments[3], condition)).toBe(true)
    expect(evaluateCondition(mockInstruments[0], condition)).toBe(false)
  })

  it('matches LT operator', () => {
    const condition: Condition = { id: '1', dimensionId: 4, dimensionColumn: 'currentBookValue', operator: 'LT', values: [], numericRange: { min: 0, max: 50000 } }
    expect(evaluateCondition(mockInstruments[2], condition)).toBe(true)
    expect(evaluateCondition(mockInstruments[0], condition)).toBe(false)
  })
})

describe('matchesRule', () => {
  it('returns false when no conditions', () => {
    const rule: SegmentRule = { groups: [], exclusions: [] }
    expect(matchesRule(mockInstruments[0], rule)).toBe(false)
  })

  it('matches with AND logic within a group', () => {
    const rule: SegmentRule = makeRule([
      { id: '1', dimensionId: 1, dimensionColumn: 'productCode', operator: 'IN', values: ['FRM-30', 'FRM-15'] },
      { id: '2', dimensionId: 2, dimensionColumn: 'branchCode', operator: 'IN', values: ['BR-001'] },
    ])
    expect(matchesRule(mockInstruments[0], rule)).toBe(true)
    expect(matchesRule(mockInstruments[1], rule)).toBe(false)
  })

  it('excludes instruments matching exclusions', () => {
    const rule: SegmentRule = makeRule(
      [{ id: '1', dimensionId: 1, dimensionColumn: 'productCode', operator: 'IN', values: ['FRM-30', 'FRM-15'] }],
      [{ id: '2', dimensionId: 4, dimensionColumn: 'currentBookValue', operator: 'LT', values: [], numericRange: { min: 0, max: 200000 } }],
    )
    expect(matchesRule(mockInstruments[0], rule)).toBe(true)
    expect(matchesRule(mockInstruments[1], rule)).toBe(false)
  })

  it('matches with OR logic across groups', () => {
    const rule: SegmentRule = {
      groups: [
        { id: 'g1', conditions: [{ id: '1', dimensionId: 1, dimensionColumn: 'productCode', operator: 'IN', values: ['FRM-30'] }] },
        { id: 'g2', conditions: [{ id: '2', dimensionId: 1, dimensionColumn: 'productCode', operator: 'IN', values: ['AUTO-NEW'] }] },
      ],
      exclusions: [],
    }
    expect(matchesRule(mockInstruments[0], rule)).toBe(true)
    expect(matchesRule(mockInstruments[2], rule)).toBe(true)
    expect(matchesRule(mockInstruments[4], rule)).toBe(false)
  })
})

describe('filterInstruments', () => {
  it('returns matching instruments', () => {
    const rule = makeRule([
      { id: '1', dimensionId: 1, dimensionColumn: 'productCode', operator: 'IN', values: ['FRM-30', 'FRM-15'] },
    ])
    const result = filterInstruments(mockInstruments, rule)
    expect(result).toHaveLength(2)
    expect(result.map(i => i.id)).toEqual([1, 2])
  })
})

describe('computeBalanceSummary', () => {
  it('computes correct totals with no rules', () => {
    const summary = computeBalanceSummary(mockInstruments, null, [])
    expect(summary.totalCount).toBe(5)
    expect(summary.matchedCount).toBe(0)
    expect(summary.assignedCount).toBe(0)
    expect(summary.unassignedCount).toBe(5)
  })

  it('computes matched for current rule', () => {
    const rule = makeRule([
      { id: '1', dimensionId: 1, dimensionColumn: 'productCode', operator: 'IN', values: ['FRM-30'] },
    ])
    const summary = computeBalanceSummary(mockInstruments, rule, [{ segmentId: 's1', rule }])
    expect(summary.matchedCount).toBe(1)
    expect(summary.matchedBalance).toBe(240000)
    expect(summary.assignedCount).toBe(1)
  })
})

describe('findOverlappingInstruments', () => {
  it('detects overlap between segments', () => {
    const rule1 = makeRule([{ id: '1', dimensionId: 2, dimensionColumn: 'branchCode', operator: 'IN', values: ['BR-001'] }])
    const rule2 = makeRule([{ id: '2', dimensionId: 1, dimensionColumn: 'productCode', operator: 'IN', values: ['FRM-30', 'CRE-FIXED'] }])
    const overlaps = findOverlappingInstruments(mockInstruments, [
      { segmentId: 's1', rule: rule1 },
      { segmentId: 's2', rule: rule2 },
    ])
    expect(overlaps.length).toBeGreaterThan(0)
    const inst1Overlap = overlaps.find(o => o.instrumentId === 1)
    expect(inst1Overlap?.segmentIds).toEqual(['s1', 's2'])
  })
})

describe('detectConflicts', () => {
  it('warns when condition and exclusion overlap on values', () => {
    const rule: SegmentRule = makeRule(
      [{ id: '1', dimensionId: 1, dimensionColumn: 'productCode', operator: 'IN', values: ['FRM-30', 'FRM-15'] }],
      [{ id: '2', dimensionId: 1, dimensionColumn: 'productCode', operator: 'IN', values: ['FRM-30'] }],
    )
    const warnings = detectConflicts(rule)
    expect(warnings.length).toBe(1)
    expect(warnings[0]).toContain('Exclusion and condition')
  })

  it('returns no warnings when no conflicts', () => {
    const rule: SegmentRule = makeRule(
      [{ id: '1', dimensionId: 1, dimensionColumn: 'productCode', operator: 'IN', values: ['FRM-30'] }],
      [{ id: '2', dimensionId: 4, dimensionColumn: 'currentBookValue', operator: 'GT', values: [], numericRange: { min: 500000, max: 0 } }],
    )
    const warnings = detectConflicts(rule)
    expect(warnings.length).toBe(0)
  })
})
