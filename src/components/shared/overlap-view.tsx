import { useMemo, useState } from 'react'
import { X, AlertTriangle, Check, Info } from 'lucide-react'
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
  const [applied, setApplied] = useState(false)

  const handleAssign = (instrumentId: number, segmentId: string) => {
    if (applied) return
    setResolved(prev => {
      if (prev[instrumentId] === segmentId) {
        const next = { ...prev }
        delete next[instrumentId]
        return next
      }
      return { ...prev, [instrumentId]: segmentId }
    })
  }

  const resolvedCount = Object.keys(resolved).length
  const unresolvedCount = overlaps.length - resolvedCount

  const affectedSegments = useMemo(() => {
    if (resolvedCount === 0) return []
    const losers = new Map<string, number>()
    for (const overlap of overlaps) {
      const winnerId = resolved[overlap.instrumentId]
      if (!winnerId) continue
      for (const sid of overlap.segmentIds) {
        if (sid === winnerId) continue
        losers.set(sid, (losers.get(sid) ?? 0) + 1)
      }
    }
    return [...losers.entries()].map(([segId, count]) => ({
      name: segments[segId]?.name ?? segId,
      count,
    }))
  }, [resolved, resolvedCount, overlaps, segments])

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl w-[880px] max-h-[85vh] flex flex-col mx-6">
        <div className="flex items-center justify-between px-6 py-4 border-b border-surface-200">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-surface-100 flex items-center justify-center">
              <AlertTriangle size={16} className="text-surface-500" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-surface-800">Overlapping Instruments</h3>
              <p className="text-xs text-surface-500">
                {overlaps.length} instrument{overlaps.length !== 1 ? 's' : ''} assigned to multiple segments
                {' '}&middot;{' '}{formatCurrency(totalBalance)} total balance
                {resolvedCount > 0 && (
                  <span className="ml-2 text-green-600">
                    ({resolvedCount} resolved, {unresolvedCount} remaining)
                  </span>
                )}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-surface-100 transition-colors">
            <X size={16} className="text-surface-400" />
          </button>
        </div>

        <div className="px-6 py-3 border-b border-surface-100 bg-surface-50/50">
          <p className="text-xs text-surface-500">
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
                        ? 'bg-green-50/40 border-surface-100'
                        : 'border-surface-100 hover:bg-surface-50/50'
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
                              disabled={applied}
                              className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium transition-all ${
                                isChosen
                                  ? 'bg-primary-600 text-white shadow-sm'
                                  : isResolved
                                    ? 'bg-surface-100 text-surface-400 hover:bg-surface-200 hover:text-surface-600'
                                    : 'bg-surface-200 text-surface-700 hover:bg-surface-300 cursor-pointer'
                              } ${applied ? 'cursor-default' : ''}`}
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

        {applied && affectedSegments.length > 0 && (
          <div className="px-6 py-3 border-t border-blue-100 bg-blue-50/50">
            <div className="flex items-start gap-2">
              <Info size={14} className="text-blue-500 mt-0.5 shrink-0" />
              <div className="text-xs text-blue-700">
                <p className="font-medium mb-1">Exclusion rules would be appended to:</p>
                <ul className="space-y-0.5">
                  {affectedSegments.map(s => (
                    <li key={s.name}>
                      <span className="font-medium">{s.name}</span> — {s.count} instrument{s.count !== 1 ? 's' : ''} removed via new exclusion rule
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        <div className="px-6 py-3 border-t border-surface-200 bg-surface-50 rounded-b-xl flex items-center justify-between">
          <p className="text-xs text-surface-500">
            {applied
              ? 'Assignments applied. Exclusion rules noted above.'
              : resolvedCount > 0
                ? `${resolvedCount} of ${overlaps.length} overlaps resolved.${unresolvedCount === 0 ? ' All overlaps addressed.' : ''}`
                : `${overlaps.length} overlap${overlaps.length !== 1 ? 's' : ''} to resolve.`}
          </p>
          <div className="flex items-center gap-2">
            {!applied && resolvedCount > 0 && (
              <button
                type="button"
                onClick={() => setApplied(true)}
                className="px-4 py-1.5 text-xs font-medium rounded-md bg-primary-600 text-white hover:bg-primary-700 transition-colors"
              >
                Apply
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 text-xs font-medium rounded-md bg-surface-200 text-surface-600 hover:bg-surface-300 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
