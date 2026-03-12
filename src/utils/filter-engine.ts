import type { Condition, Instrument, SegmentRule, BalanceSummary, BucketDefinition } from '../types'
import { ruleHasConditions } from '../types'

export function evaluateCondition(
  instrument: Instrument,
  condition: Condition,
  bucketDefinitions?: Record<number, BucketDefinition[]>,
): boolean {
  const value = instrument[condition.dimensionColumn]

  const buckets = bucketDefinitions?.[condition.dimensionId]
  if (buckets && buckets.length >= 2 && typeof value === 'number') {
    const selectedBucketNames = condition.values
    const matchedBuckets = buckets.filter(b => selectedBucketNames.includes(b.name))

    if (matchedBuckets.length > 0) {
      const inAnyBucket = matchedBuckets.some(b => value >= b.range.min && value <= b.range.max)
      return condition.operator === 'NOT_IN' ? !inAnyBucket : inAnyBucket
    }
  }

  switch (condition.operator) {
    case 'IN':
      return condition.values.includes(String(value))
    case 'NOT_IN':
      return !condition.values.includes(String(value))
    case 'BETWEEN':
      if (condition.numericRange && typeof value === 'number') {
        return value >= condition.numericRange.min && value <= condition.numericRange.max
      }
      return false
    case 'GT':
      if (condition.numericRange && typeof value === 'number') {
        return value > condition.numericRange.min
      }
      return false
    case 'GTE':
      if (condition.numericRange && typeof value === 'number') {
        return value >= condition.numericRange.min
      }
      return false
    case 'LT':
      if (condition.numericRange && typeof value === 'number') {
        return value < condition.numericRange.max
      }
      return false
    case 'LTE':
      if (condition.numericRange && typeof value === 'number') {
        return value <= condition.numericRange.max
      }
      return false
    default:
      return false
  }
}

export function matchesRule(
  instrument: Instrument,
  rule: SegmentRule,
  bucketDefinitions?: Record<number, BucketDefinition[]>,
): boolean {
  if (!ruleHasConditions(rule)) return false

  const matchesAnyGroup = rule.groups.some(group => {
    if (group.conditions.length === 0) return false
    return group.conditions.every(c => evaluateCondition(instrument, c, bucketDefinitions))
  })
  if (!matchesAnyGroup) return false

  if (rule.exclusions.length > 0) {
    const matchesAnyExclusion = rule.exclusions.some(e => evaluateCondition(instrument, e, bucketDefinitions))
    if (matchesAnyExclusion) return false
  }

  return true
}

export function filterInstruments(
  instruments: Instrument[],
  rule: SegmentRule,
  bucketDefinitions?: Record<number, BucketDefinition[]>,
): Instrument[] {
  return instruments.filter(inst => matchesRule(inst, rule, bucketDefinitions))
}

export function computeBalanceSummary(
  instruments: Instrument[],
  currentRule: SegmentRule | null,
  allRules: { segmentId: string; rule: SegmentRule }[],
  bucketDefinitions?: Record<number, BucketDefinition[]>,
): BalanceSummary {
  const totalBalance = instruments.reduce((sum, inst) => sum + inst.balance, 0)
  const totalCount = instruments.length

  let matchedBalance = 0
  let matchedCount = 0
  if (ruleHasConditions(currentRule)) {
    const matched = filterInstruments(instruments, currentRule!, bucketDefinitions)
    matchedBalance = matched.reduce((sum, inst) => sum + inst.balance, 0)
    matchedCount = matched.length
  }

  const assignedIds = new Set<number>()
  for (const { rule } of allRules) {
    if (!ruleHasConditions(rule)) continue
    for (const inst of instruments) {
      if (matchesRule(inst, rule, bucketDefinitions)) {
        assignedIds.add(inst.id)
      }
    }
  }

  const assignedInstruments = instruments.filter(inst => assignedIds.has(inst.id))
  const assignedBalance = assignedInstruments.reduce((sum, inst) => sum + inst.balance, 0)
  const assignedCount = assignedInstruments.length

  const unassignedBalance = totalBalance - assignedBalance
  const unassignedCount = totalCount - assignedCount

  return {
    totalBalance,
    totalCount,
    matchedBalance,
    matchedCount,
    matchedPercent: totalBalance > 0 ? (matchedBalance / totalBalance) * 100 : 0,
    assignedBalance,
    assignedCount,
    assignedPercent: totalBalance > 0 ? (assignedBalance / totalBalance) * 100 : 0,
    unassignedBalance,
    unassignedCount,
  }
}

export function detectConflicts(rule: SegmentRule): string[] {
  const warnings: string[] = []
  const allConditions = rule.groups.flatMap(g => g.conditions)

  for (const exc of rule.exclusions) {
    const matchingCond = allConditions.find(c => c.dimensionId === exc.dimensionId)
    if (matchingCond) {
      if (exc.values.length > 0 && matchingCond.values.length > 0) {
        const overlap = exc.values.filter(v => matchingCond.values.includes(v))
        if (overlap.length > 0) {
          warnings.push(`Exclusion and condition both reference the same values, which will exclude matched instruments.`)
          break
        }
      }
    }
  }

  return warnings
}

export function findOverlappingInstruments(
  instruments: Instrument[],
  rules: { segmentId: string; rule: SegmentRule }[],
  bucketDefinitions?: Record<number, BucketDefinition[]>,
): { instrumentId: number; segmentIds: string[] }[] {
  const overlaps: { instrumentId: number; segmentIds: string[] }[] = []

  for (const inst of instruments) {
    const matchingSegments: string[] = []
    for (const { segmentId, rule } of rules) {
      if (ruleHasConditions(rule) && matchesRule(inst, rule, bucketDefinitions)) {
        matchingSegments.push(segmentId)
      }
    }
    if (matchingSegments.length > 1) {
      overlaps.push({ instrumentId: inst.id, segmentIds: matchingSegments })
    }
  }

  return overlaps
}
