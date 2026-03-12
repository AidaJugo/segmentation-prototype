import { useState, useMemo } from 'react'
import { ChevronDown, ChevronRight, Search, ArrowUpDown } from 'lucide-react'
import type { Instrument, Dimension, SegmentRule, BucketDefinition } from '../../types'
import { matchesRule } from '../../utils/filter-engine'

interface MatchedInstrumentsProps {
  instruments: Instrument[]
  rule: SegmentRule
  dimensions: Dimension[]
  bucketDefinitions?: Record<number, BucketDefinition[]>
  startExpanded?: boolean
}

function formatBalance(n: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)
}

export function MatchedInstruments({ instruments, rule, dimensions, bucketDefinitions, startExpanded = false }: MatchedInstrumentsProps) {
  const [expanded, setExpanded] = useState(startExpanded)
  const [search, setSearch] = useState('')
  const [sortCol, setSortCol] = useState<string>('balance')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')

  const usedDimColumns = useMemo(() => {
    const cols = new Set<string>()
    for (const g of rule.groups) {
      for (const c of g.conditions) cols.add(c.dimensionColumn)
    }
    for (const e of rule.exclusions) cols.add(e.dimensionColumn)
    return cols
  }, [rule])

  const displayDimensions = useMemo(
    () => dimensions.filter(d => usedDimColumns.has(d.dimensionColumn)),
    [dimensions, usedDimColumns]
  )

  const matched = useMemo(
    () => instruments.filter(inst => matchesRule(inst, rule, bucketDefinitions)),
    [instruments, rule, bucketDefinitions]
  )

  const filtered = useMemo(() => {
    if (!search.trim()) return matched
    const q = search.toLowerCase()
    return matched.filter(inst =>
      displayDimensions.some(d => {
        const v = inst[d.dimensionColumn]
        return v !== null && String(v).toLowerCase().includes(q)
      }) || String(inst.id).includes(q)
    )
  }, [matched, search, displayDimensions])

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      const aVal = a[sortCol]
      const bVal = b[sortCol]
      if (aVal === null || aVal === undefined) return 1
      if (bVal === null || bVal === undefined) return -1
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortDir === 'asc' ? aVal - bVal : bVal - aVal
      }
      const cmp = String(aVal).localeCompare(String(bVal))
      return sortDir === 'asc' ? cmp : -cmp
    })
  }, [filtered, sortCol, sortDir])

  const handleSort = (col: string) => {
    if (sortCol === col) {
      setSortDir(prev => prev === 'asc' ? 'desc' : 'asc')
    } else {
      setSortCol(col)
      setSortDir(col === 'balance' ? 'desc' : 'asc')
    }
  }

  return (
    <div className="mt-4 border border-surface-200 rounded-md overflow-hidden">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-2 px-3 py-2 bg-surface-50 hover:bg-surface-100 transition-colors text-left"
      >
        {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        <span className="text-sm font-medium text-surface-700">Matched Instruments</span>
        <span className={`text-xs ${matched.length === 0 ? 'text-red-500' : 'text-surface-400'}`}>({matched.length})</span>
      </button>

      {expanded && (
        <div>
          <div className="px-3 py-2 border-t border-surface-100">
            <div className="relative">
              <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-surface-400" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search matched instruments..."
                className="w-full text-sm border border-surface-300 rounded pl-8 pr-3 py-1.5 text-surface-700"
              />
            </div>
          </div>

          <div className="overflow-x-auto max-h-[320px] overflow-y-auto">
            <table className="w-full text-xs">
              <thead className="bg-surface-50 sticky top-0">
                <tr>
                  <th className="text-left px-3 py-2 font-medium text-surface-500 whitespace-nowrap">
                    <button type="button" onClick={() => handleSort('id')} className="flex items-center gap-1 hover:text-surface-700">
                      ID
                      {sortCol === 'id' && <ArrowUpDown size={10} />}
                    </button>
                  </th>
                  {displayDimensions.map(dim => (
                    <th key={dim.dimensionId} className="text-left px-3 py-2 font-medium text-surface-500 whitespace-nowrap">
                      <button type="button" onClick={() => handleSort(dim.dimensionColumn)} className="flex items-center gap-1 hover:text-surface-700">
                        {dim.dimensionName}
                        {sortCol === dim.dimensionColumn && <ArrowUpDown size={10} />}
                      </button>
                    </th>
                  ))}
                  <th className="text-right px-3 py-2 font-medium text-surface-500 whitespace-nowrap">
                    <button type="button" onClick={() => handleSort('balance')} className="flex items-center gap-1 justify-end hover:text-surface-700">
                      Balance
                      {sortCol === 'balance' && <ArrowUpDown size={10} />}
                    </button>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-100">
                {sorted.slice(0, 100).map(inst => (
                  <tr key={inst.id} className="hover:bg-surface-50">
                    <td className="px-3 py-1.5 text-surface-600 tabular-nums">{inst.id}</td>
                    {displayDimensions.map(dim => (
                      <td key={dim.dimensionId} className="px-3 py-1.5 text-surface-700 whitespace-nowrap">
                        {inst[dim.dimensionColumn] !== null ? String(inst[dim.dimensionColumn]) : <span className="text-surface-300">null</span>}
                      </td>
                    ))}
                    <td className="px-3 py-1.5 text-right text-surface-700 tabular-nums">{formatBalance(inst.balance)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {sorted.length > 100 && (
              <p className="text-xs text-surface-400 text-center py-2">
                Showing 100 of {sorted.length} instruments. Use search to narrow results.
              </p>
            )}
            {sorted.length === 0 && search && (
              <p className="text-xs text-surface-400 text-center py-4">No instruments match "{search}"</p>
            )}
            {matched.length === 0 && (
              <p className="text-xs text-red-500 text-center py-4">No instruments matched this rule. Check your conditions and exclusions.</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
