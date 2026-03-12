import { useState, useMemo } from 'react'
import { X, BarChart3, Table, Lightbulb } from 'lucide-react'
import type { Instrument, Dimension } from '../../types'

interface UnassignedViewProps {
  instruments: Instrument[]
  dimensions: Dimension[]
  onClose: () => void
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value)
}

function formatPercent(n: number): string {
  return `${n.toFixed(1)}%`
}

interface ValueBreakdown {
  value: string
  count: number
  balance: number
  percent: number
}

function computeBreakdown(instruments: Instrument[], dimension: Dimension): ValueBreakdown[] {
  const total = instruments.reduce((sum, i) => sum + i.balance, 0)
  const groups = new Map<string, { count: number; balance: number }>()

  for (const inst of instruments) {
    const raw = inst[dimension.dimensionColumn]
    const val = raw !== null && raw !== undefined ? String(raw) : '(empty)'
    const entry = groups.get(val) || { count: 0, balance: 0 }
    entry.count++
    entry.balance += inst.balance
    groups.set(val, entry)
  }

  const result: ValueBreakdown[] = []
  for (const [value, data] of groups) {
    result.push({
      value,
      count: data.count,
      balance: data.balance,
      percent: total > 0 ? (data.balance / total) * 100 : 0,
    })
  }

  return result.sort((a, b) => b.balance - a.balance)
}

function BarChartView({ breakdown }: { breakdown: ValueBreakdown[] }) {
  const maxBalance = Math.max(...breakdown.map(b => b.balance), 1)
  const top = breakdown.slice(0, 15)

  return (
    <div className="space-y-1.5">
      {top.map(item => (
        <div key={item.value} className="flex items-center gap-2">
          <div className="w-32 text-xs text-surface-600 truncate text-right" title={item.value}>
            {item.value}
          </div>
          <div className="flex-1 flex items-center gap-2">
            <div className="flex-1 h-5 bg-surface-100 rounded overflow-hidden">
              <div
                className="h-full bg-primary-400 rounded transition-all"
                style={{ width: `${(item.balance / maxBalance) * 100}%` }}
              />
            </div>
            <div className="text-xs text-surface-500 w-16 text-right tabular-nums">{item.count}</div>
            <div className="text-xs text-surface-500 w-16 text-right tabular-nums">{formatPercent(item.percent)}</div>
          </div>
        </div>
      ))}
      {breakdown.length > 15 && (
        <p className="text-xs text-surface-400 text-center pt-1">
          + {breakdown.length - 15} more values
        </p>
      )}
    </div>
  )
}

function SuggestionCard({ breakdown, dimensionName }: { breakdown: ValueBreakdown[]; dimensionName: string }) {
  const topCohorts = breakdown.filter(b => b.percent >= 5).slice(0, 5)
  if (topCohorts.length === 0) return null

  return (
    <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-md">
      <div className="flex items-center gap-1.5 mb-2">
        <Lightbulb size={14} className="text-amber-600" />
        <span className="text-xs font-medium text-amber-800">Segment Suggestions</span>
      </div>
      <p className="text-xs text-amber-700 mb-2">
        These unmapped cohorts by {dimensionName} each represent 5%+ of unassigned balance:
      </p>
      <div className="space-y-1">
        {topCohorts.map(c => (
          <div key={c.value} className="flex items-center justify-between text-xs">
            <span className="text-amber-900 font-medium">{c.value}</span>
            <span className="text-amber-700">
              {c.count} instruments, {formatCurrency(c.balance)} ({formatPercent(c.percent)})
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

export function UnassignedView({ instruments, dimensions, onClose }: UnassignedViewProps) {
  const totalBalance = instruments.reduce((sum, inst) => sum + inst.balance, 0)
  const [activeView, setActiveView] = useState<'chart' | 'table'>('chart')
  const [activeDimIndex, setActiveDimIndex] = useState(0)

  const listDimensions = useMemo(
    () => dimensions.filter(d => d.dimensionType === 'list' && d.segmentable),
    [dimensions]
  )

  const activeDim = listDimensions[activeDimIndex] ?? null

  const breakdown = useMemo(() => {
    if (!activeDim) return []
    return computeBreakdown(instruments, activeDim)
  }, [instruments, activeDim])

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-[800px] max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between px-4 py-3 border-b border-surface-200">
          <div>
            <h3 className="text-sm font-semibold text-surface-800">Unmapped Instruments Breakdown</h3>
            <p className="text-xs text-surface-500">
              {instruments.length} instruments, {formatCurrency(totalBalance)} total balance
            </p>
          </div>
          <button onClick={onClose} className="p-1 rounded hover:bg-surface-100">
            <X size={16} className="text-surface-500" />
          </button>
        </div>

        {listDimensions.length > 0 && (
          <div className="flex items-center gap-1 px-4 pt-3 border-b border-surface-200 overflow-x-auto">
            {listDimensions.slice(0, 10).map((dim, i) => (
              <button
                key={dim.dimensionId}
                onClick={() => setActiveDimIndex(i)}
                className={`px-3 py-1.5 text-xs font-medium rounded-t-md border border-b-0 whitespace-nowrap transition-colors ${
                  activeDimIndex === i
                    ? 'bg-white text-primary-700 border-surface-200'
                    : 'bg-surface-50 text-surface-500 border-transparent hover:text-surface-700'
                }`}
              >
                {dim.dimensionName}
              </button>
            ))}
            {listDimensions.length > 10 && (
              <span className="text-xs text-surface-400 px-2">+{listDimensions.length - 10}</span>
            )}
          </div>
        )}

        <div className="flex items-center gap-2 px-4 py-2 border-b border-surface-100">
          <button
            onClick={() => setActiveView('chart')}
            className={`flex items-center gap-1 px-2 py-1 text-xs rounded transition-colors ${
              activeView === 'chart' ? 'bg-primary-50 text-primary-700' : 'text-surface-500 hover:text-surface-700'
            }`}
          >
            <BarChart3 size={12} />
            Chart
          </button>
          <button
            onClick={() => setActiveView('table')}
            className={`flex items-center gap-1 px-2 py-1 text-xs rounded transition-colors ${
              activeView === 'table' ? 'bg-primary-50 text-primary-700' : 'text-surface-500 hover:text-surface-700'
            }`}
          >
            <Table size={12} />
            Table
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {activeDim && activeView === 'chart' && (
            <>
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-xs font-medium text-surface-600">
                  Distribution by {activeDim.dimensionName}
                </h4>
                <div className="flex items-center gap-4 text-xs text-surface-400">
                  <span>Count</span>
                  <span>% Balance</span>
                </div>
              </div>
              <BarChartView breakdown={breakdown} />
              <SuggestionCard breakdown={breakdown} dimensionName={activeDim.dimensionName} />
            </>
          )}

          {activeView === 'table' && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-surface-50 sticky top-0">
                  <tr>
                    <th className="text-left px-3 py-2 text-xs font-medium text-surface-500">ID</th>
                    <th className="text-left px-3 py-2 text-xs font-medium text-surface-500">Product</th>
                    <th className="text-left px-3 py-2 text-xs font-medium text-surface-500">Branch</th>
                    <th className="text-left px-3 py-2 text-xs font-medium text-surface-500">Amortization</th>
                    <th className="text-right px-3 py-2 text-xs font-medium text-surface-500">Balance</th>
                  </tr>
                </thead>
                <tbody>
                  {instruments.slice(0, 200).map(inst => (
                    <tr key={inst.id} className="border-t border-surface-100 hover:bg-surface-50">
                      <td className="px-3 py-1.5 text-surface-600">{inst.id}</td>
                      <td className="px-3 py-1.5 text-surface-700">{inst.productCode as string}</td>
                      <td className="px-3 py-1.5 text-surface-600">{inst.branchCode as string}</td>
                      <td className="px-3 py-1.5 text-surface-600">{inst.amortizationCode as string}</td>
                      <td className="px-3 py-1.5 text-right text-surface-700 font-mono">{formatCurrency(inst.balance)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {instruments.length > 200 && (
                <p className="text-xs text-surface-400 text-center py-2">
                  Showing 200 of {instruments.length} instruments
                </p>
              )}
            </div>
          )}

          {!activeDim && activeView === 'chart' && (
            <p className="text-sm text-surface-500 text-center py-8">
              No list dimensions available for breakdown analysis. Select dimensions in the configuration first.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
