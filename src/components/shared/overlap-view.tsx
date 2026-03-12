import { useState } from 'react'
import { X, AlertTriangle, Check } from 'lucide-react'
import type { Instrument, Segment, Dimension } from '../../types'

interface OverlapEntry {
  instrumentId: number
  segmentIds: string[]
}

interface OverlapViewProps {
  overlaps: OverlapEntry[]
  instruments: Instrument[]
  segments: Record<string, Segment>
  dimensions: Dimension[]
  onClose: () => void
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value)
}

export function OverlapView({ overlaps, instruments, segments, dimensions, onClose }: OverlapViewProps) {
  const instrumentMap = new Map(instruments.map(i => [i.id, i]))
  const totalBalance = overlaps.reduce((sum, o) => {
    const inst = instrumentMap.get(o.instrumentId)
    return sum + (inst?.balance ?? 0)
  }, 0)

  const displayDims = dimensions.filter(d => d.segmentable).slice(0, 4)

  const [resolved, setResolved] = useState<Record<number, string>>({})

  const handleAssign = (instrumentId: number, segmentId: string) => {
    setResolved(prev => ({ ...prev, [instrumentId]: segmentId }))
  }

  const resolvedCount = Object.keys(resolved).length
  const unresolvedCount = overlaps.length - resolvedCount

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl w-[880px] max-h-[85vh] flex flex-col mx-6">
        <div className="flex items-center justify-between px-6 py-4 border-b border-red-100 bg-red-50/50 rounded-t-xl">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center">
              <AlertTriangle size={16} className="text-red-600" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-red-900">Overlapping Instruments</h3>
              <p className="text-xs text-red-700/70">
                {overlaps.length} instrument{overlaps.length !== 1 ? 's' : ''} assigned to multiple segments
                {' '}&middot;{' '}{formatCurrency(totalBalance)} total balance
                {resolvedCount > 0 && (
                  <span className="ml-2 text-green-700">
                    ({resolvedCount} resolved, {unresolvedCount} remaining)
                  </span>
                )}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-red-100 transition-colors">
            <X size={16} className="text-red-400" />
          </button>
        </div>

        <div className="px-6 py-3 border-b border-surface-200 bg-surface-50">
          <p className="text-xs text-surface-600">
            Each instrument below matches rules in multiple segments. Click a segment name to assign the instrument to that segment only.
          </p>
        </div>

        <div className="flex-1 overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="bg-surface-50 sticky top-0 z-10">
              <tr>
                <th className="text-left pl-6 pr-3 py-2.5 text-xs font-medium text-surface-500">ID</th>
                {displayDims.map(dim => (
                  <th key={dim.dimensionId} className="text-left px-3 py-2.5 text-xs font-medium text-surface-500 whitespace-nowrap">
                    {dim.dimensionName}
                  </th>
                ))}
                <th className="text-right px-3 py-2.5 text-xs font-medium text-surface-500">Balance</th>
                <th className="text-left pl-3 pr-6 py-2.5 text-xs font-medium text-surface-500">Assign To</th>
              </tr>
            </thead>
            <tbody>
              {overlaps.map(o => {
                const inst = instrumentMap.get(o.instrumentId)
                if (!inst) return null
                const isResolved = resolved[o.instrumentId] !== undefined
                return (
                  <tr
                    key={o.instrumentId}
                    className={`border-t transition-colors ${
                      isResolved
                        ? 'bg-green-50/50 border-green-100'
                        : 'border-red-100 hover:bg-red-50/30'
                    }`}
                  >
                    <td className="pl-6 pr-3 py-2.5 text-surface-600 tabular-nums">{inst.id}</td>
                    {displayDims.map(dim => (
                      <td key={dim.dimensionId} className="px-3 py-2.5 text-surface-700 whitespace-nowrap">
                        {inst[dim.dimensionColumn] !== null && inst[dim.dimensionColumn] !== undefined
                          ? String(inst[dim.dimensionColumn])
                          : <span className="text-surface-300">--</span>}
                      </td>
                    ))}
                    <td className="px-3 py-2.5 text-right text-surface-700 font-mono tabular-nums">
                      {formatCurrency(inst.balance)}
                    </td>
                    <td className="pl-3 pr-6 py-2.5">
                      <div className="flex flex-wrap gap-1.5">
                        {o.segmentIds.map(sid => {
                          const seg = segments[sid]
                          const isChosen = resolved[o.instrumentId] === sid
                          return (
                            <button
                              key={sid}
                              type="button"
                              onClick={() => handleAssign(o.instrumentId, sid)}
                              className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium transition-all ${
                                isChosen
                                  ? 'bg-green-600 text-white shadow-sm'
                                  : isResolved
                                    ? 'bg-surface-100 text-surface-400 hover:bg-surface-200'
                                    : 'bg-red-100 text-red-800 border border-red-200 hover:bg-red-200 cursor-pointer'
                              }`}
                              title={`Assign to ${seg?.name ?? sid}`}
                            >
                              {isChosen && <Check size={10} />}
                              {seg?.name ?? sid}
                            </button>
                          )
                        })}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {resolvedCount > 0 && (
          <div className="px-6 py-3 border-t border-surface-200 bg-surface-50 rounded-b-xl flex items-center justify-between">
            <p className="text-xs text-surface-600">
              {resolvedCount} of {overlaps.length} overlaps resolved.
              {unresolvedCount === 0 && ' All overlaps addressed.'}
            </p>
            <p className="text-xs text-surface-400">
              Assignments are visual only in this prototype.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
