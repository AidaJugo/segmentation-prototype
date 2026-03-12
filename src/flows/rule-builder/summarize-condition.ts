import type { Condition, Dimension } from '../../types'

export function summarizeCondition(cond: Condition, dimensions: Dimension[]): string {
  const dim = dimensions.find(d => d.dimensionId === cond.dimensionId)
  const name = dim?.dimensionName ?? 'Unknown'
  const opLabels: Record<string, string> = {
    IN: 'is any of', NOT_IN: 'is not', BETWEEN: 'between',
    GT: '>', GTE: '≥', LT: '<', LTE: '≤',
  }
  const op = opLabels[cond.operator] ?? cond.operator

  if (cond.values.length > 0) {
    const vals = cond.values.length > 3
      ? `${cond.values.slice(0, 3).join(', ')} +${cond.values.length - 3}`
      : cond.values.join(', ')
    return `${name} ${op} ${vals}`
  }
  if (cond.numericRange) {
    const fmt = (n: number) => new Intl.NumberFormat('en-US').format(n)
    if (cond.operator === 'BETWEEN') {
      return `${name} ${op} ${fmt(cond.numericRange.min)} and ${fmt(cond.numericRange.max)}`
    }
    const val = cond.operator === 'GT' || cond.operator === 'GTE'
      ? cond.numericRange.min : cond.numericRange.max
    return `${name} ${op} ${fmt(val)}`
  }
  return `${name} (no values selected)`
}
