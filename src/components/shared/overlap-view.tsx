import { X, AlertTriangle } from 'lucide-react'
import type { Instrument, Segment } from '../../types'

interface OverlapEntry {
  instrumentId: number
  segmentIds: string[]
}

interface OverlapViewProps {
  overlaps: OverlapEntry[]
  instruments: Instrument[]
  segments: Record<string, Segment>
  onClose: () => void
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value)
}

export function OverlapView({ overlaps, instruments, segments, onClose }: OverlapViewProps) {
  const instrumentMap = new Map(instruments.map(i => [i.id, i]))
  const totalBalance = overlaps.reduce((sum, o) => {
    const inst = instrumentMap.get(o.instrumentId)
    return sum + (inst?.balance ?? 0)
  }, 0)

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-[800px] max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between px-4 py-3 border-b border-surface-200">
          <div className="flex items-center gap-2">
            <AlertTriangle size={16} className="text-amber-500" />
            <div>
              <h3 className="text-sm font-semibold text-surface-800">Overlapping Instruments</h3>
              <p className="text-xs text-surface-500">
                {overlaps.length} instrument{overlaps.length !== 1 ? 's' : ''} assigned to multiple segments, {formatCurrency(totalBalance)} total balance
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded hover:bg-surface-100">
            <X size={16} className="text-surface-500" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="bg-surface-50 sticky top-0">
              <tr>
                <th className="text-left px-3 py-2 text-xs font-medium text-surface-500">ID</th>
                <th className="text-left px-3 py-2 text-xs font-medium text-surface-500">Product</th>
                <th className="text-right px-3 py-2 text-xs font-medium text-surface-500">Balance</th>
                <th className="text-left px-3 py-2 text-xs font-medium text-surface-500">Assigned Segments</th>
              </tr>
            </thead>
            <tbody>
              {overlaps.map(o => {
                const inst = instrumentMap.get(o.instrumentId)
                if (!inst) return null
                return (
                  <tr key={o.instrumentId} className="border-t border-surface-100 hover:bg-surface-50">
                    <td className="px-3 py-1.5 text-surface-600">{inst.id}</td>
                    <td className="px-3 py-1.5 text-surface-700">{inst.productCode}</td>
                    <td className="px-3 py-1.5 text-right text-surface-700 font-mono">{formatCurrency(inst.balance)}</td>
                    <td className="px-3 py-2">
                      <div className="flex flex-wrap gap-1">
                        {o.segmentIds.map(sid => {
                          const seg = segments[sid]
                          return (
                            <span
                              key={sid}
                              className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-amber-100 text-amber-800 border border-amber-200"
                            >
                              {seg?.name ?? sid}
                            </span>
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
      </div>
    </div>
  )
}
