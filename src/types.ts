export type DimensionCategory = 'characteristic' | 'measure' | 'flag' | 'temporal' | 'identifier'

export interface Dimension {
  dimensionId: number
  dimensionName: string
  dimensionColumn: string
  dimensionType: 'list' | 'range'
  category: DimensionCategory
  valueCount: number
  segmentable: boolean
  sourceTable: string
  values: string[] | null
  minValue: number | null
  maxValue: number | null
}

export interface Instrument {
  id: number
  balance: number
  [key: string]: string | number | null
}

export type Operator = 'IN' | 'NOT_IN' | 'BETWEEN' | 'GT' | 'LT' | 'GTE' | 'LTE'

export interface Condition {
  id: string
  dimensionId: number
  dimensionColumn: string
  operator: Operator
  values: string[]
  numericRange?: { min: number; max: number }
}

export interface ConditionGroup {
  id: string
  conditions: Condition[]
}

export interface SegmentRule {
  groups: ConditionGroup[]
  exclusions: Condition[]
}

export function ruleHasConditions(rule: SegmentRule | null): boolean {
  if (!rule) return false
  return rule.groups.some(g => g.conditions.length > 0)
}

export function allConditionsFromRule(rule: SegmentRule): Condition[] {
  return rule.groups.flatMap(g => g.conditions)
}

export interface Segment {
  id: string
  name: string
  mnemonic: string
  parentId: string | null
  children: string[]
  rule: SegmentRule | null
  savedRule: SegmentRule | null
  isLeaf: boolean
}

export interface SegmentGroup {
  id: string
  name: string
  mnemonic: string
  description: string
  segments: Record<string, Segment>
  rootSegmentIds: string[]
  selectedDimensionIds: number[]
  bucketDefinitions: Record<number, BucketDefinition[]>
}

export interface BucketDefinition {
  id: string
  name: string
  dimensionId: number
  range: { min: number; max: number }
}

export interface TimingEntry {
  segmentId: string
  approach: 'rule-builder'
  startTime: number
  endTime?: number
  actionCount: number
  actions: { type: string; timestamp: number }[]
}

export interface BalanceSummary {
  totalBalance: number
  totalCount: number
  matchedBalance: number
  matchedCount: number
  matchedPercent: number
  assignedBalance: number
  assignedCount: number
  assignedPercent: number
  unassignedBalance: number
  unassignedCount: number
}
