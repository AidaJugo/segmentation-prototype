import { useRef, useEffect, useState } from 'react'
import { TrendingUp, AlertCircle, CheckCircle2 } from 'lucide-react'
import type { BalanceSummary } from '../../types'

interface BalancePreviewProps {
  summary: BalanceSummary
  segmentName?: string
  overlapCount?: number
  onShowUnassigned?: () => void
  onShowOverlaps?: () => void
}

function formatCurrency(value: number): string {
  if (Math.abs(value) >= 1_000_000) {
    return `$${(value / 1_000_000).toFixed(1)}M`
  }
  if (Math.abs(value) >= 1_000) {
    return `$${(value / 1_000).toFixed(0)}K`
  }
  return `$${value.toFixed(0)}`
}

function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`
}

function AnimatedValue({ children, className }: { children: React.ReactNode; className?: string }) {
  const [flash, setFlash] = useState(false)
  const prevRef = useRef<string>('')
  const rendered = String(children)

  useEffect(() => {
    if (prevRef.current && prevRef.current !== rendered) {
      setFlash(true)
      const timer = setTimeout(() => setFlash(false), 600)
      return () => clearTimeout(timer)
    }
    prevRef.current = rendered
  }, [rendered])

  return (
    <span className={`${className ?? ''} transition-colors duration-300 ${flash ? 'text-primary-600 bg-primary-50 rounded px-0.5' : ''}`}>
      {children}
    </span>
  )
}

export function BalancePreview({ summary, segmentName, overlapCount = 0, onShowUnassigned, onShowOverlaps }: BalancePreviewProps) {
  const hasConditions = segmentName !== undefined
  const zeroMatchWarning = hasConditions && summary.matchedCount === 0

  return (
    <div className="border-t border-surface-200 bg-surface-50 px-4 py-3">
      <div className="flex items-center gap-2 mb-2">
        <TrendingUp size={14} className="text-surface-500" />
        <span className="text-xs font-semibold text-surface-700 uppercase tracking-wide">Portfolio Coverage</span>
      </div>

      <div className="grid grid-cols-4 gap-3">
        <div>
          <div className="text-xs text-surface-500 mb-0.5">Total Portfolio</div>
          <div className="text-sm font-semibold text-surface-800">{formatCurrency(summary.totalBalance)}</div>
          <div className="text-xs text-surface-400">{summary.totalCount.toLocaleString()} instruments</div>
        </div>

        {segmentName && (
          <div>
            <div className="text-xs text-surface-500 mb-0.5">This Segment</div>
            <AnimatedValue className={`text-sm font-semibold ${zeroMatchWarning ? 'text-red-600' : 'text-primary-600'}`}>
              {formatCurrency(summary.matchedBalance)}
              <span className="text-xs font-normal text-surface-400 ml-1">
                ({formatPercent(summary.matchedPercent)})
              </span>
            </AnimatedValue>
            <AnimatedValue className={`text-xs block ${zeroMatchWarning ? 'text-red-500 font-medium' : 'text-surface-400'}`}>
              {summary.matchedCount.toLocaleString()} instruments
            </AnimatedValue>
          </div>
        )}

        <div>
          <div className="text-xs text-surface-500 mb-0.5 flex items-center gap-1">
            <CheckCircle2 size={10} className="text-green-500" />
            Assigned
          </div>
          <AnimatedValue className="text-sm font-semibold text-green-700">
            {formatCurrency(summary.assignedBalance)}
            <span className="text-xs font-normal text-surface-400 ml-1">
              ({formatPercent(summary.assignedPercent)})
            </span>
          </AnimatedValue>
          <div className="text-xs text-surface-400">{summary.assignedCount.toLocaleString()} instruments</div>
        </div>

        <div>
          <div className="text-xs text-surface-500 mb-0.5">Unassigned</div>
          <div>
            <AnimatedValue className="text-sm font-semibold text-orange-600">
              {formatCurrency(summary.unassignedBalance)}
            </AnimatedValue>
          </div>
          <button
            onClick={onShowUnassigned}
            className="text-xs text-primary-600 hover:underline cursor-pointer"
          >
            {summary.unassignedCount.toLocaleString()} instruments
          </button>
        </div>
      </div>

      {zeroMatchWarning && (
        <div className="flex items-center gap-1.5 mt-2 px-2 py-1.5 bg-red-50 border border-red-200 rounded text-xs text-red-700">
          <AlertCircle size={12} />
          No instruments matched. Check your conditions and exclusions for conflicts.
        </div>
      )}

      {overlapCount > 0 && (
        <button
          onClick={onShowOverlaps}
          className="flex items-center gap-1.5 mt-2 px-2 py-1.5 w-full bg-red-50 border border-red-200 rounded text-xs text-red-700 hover:bg-red-100 transition-colors cursor-pointer text-left"
        >
          <AlertCircle size={12} className="shrink-0" />
          <span>{overlapCount} instrument{overlapCount > 1 ? 's' : ''} assigned to multiple segments</span>
          <span className="ml-auto text-red-500 underline">View details</span>
        </button>
      )}
    </div>
  )
}
