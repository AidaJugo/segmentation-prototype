import { Plus, Info } from 'lucide-react'
import type { Condition, Dimension, BucketDefinition } from '../../types'
import { ConditionRow } from './condition-row'
import { summarizeCondition } from './summarize-condition'

interface ExcludingSectionProps {
  exclusions: Condition[]
  dimensions: Dimension[]
  bucketDefinitions?: Record<number, BucketDefinition[]>
  newExclusionIds?: Set<string>
  hasOverlapResolutions?: boolean
  onAdd: () => void
  onChange: (index: number, condition: Condition) => void
  onRemove: (index: number) => void
}

export function ExcludingSection({
  exclusions,
  dimensions,
  bucketDefinitions = {},
  newExclusionIds,
  hasOverlapResolutions,
  onAdd,
  onChange,
  onRemove,
}: ExcludingSectionProps) {
  return (
    <div className="border-t border-dashed border-surface-300 pt-4 mt-4">
      <div className="mb-3">
        <h3 className="text-sm font-medium text-surface-700">Excluding</h3>
        <p className="text-xs text-surface-400 mt-0.5">
          Exclude specific instruments from the matched set above.
        </p>
      </div>

      {hasOverlapResolutions && (
        <div className="flex items-start gap-2 px-3 py-2 mb-3 text-xs bg-blue-50 border border-blue-200 rounded-md text-blue-700">
          <Info size={14} className="shrink-0 mt-0.5" />
          <span>Exclusion rules from overlapping instrument resolution applied here.</span>
        </div>
      )}

      {exclusions.length === 0 ? (
        <button
          type="button"
          onClick={onAdd}
          className="flex items-center gap-1.5 px-3 py-2 w-full text-sm font-medium text-surface-500 border border-dashed border-surface-300 hover:border-orange-300 hover:text-orange-600 hover:bg-orange-50/50 rounded-md transition-colors"
        >
          <Plus size={16} />
          Add Exclusion
        </button>
      ) : (
        <div className="space-y-3">
          {exclusions.map((exc, i) => (
            <ConditionRow
              key={exc.id}
              condition={exc}
              dimensions={dimensions}
              bucketDefinitions={bucketDefinitions}
              onChange={c => onChange(i, c)}
              onRemove={() => onRemove(i)}
              variant="exception"
              summary={summarizeCondition(exc, dimensions)}
              startExpanded={newExclusionIds?.has(exc.id) ?? false}
            />
          ))}
          <button
            type="button"
            onClick={onAdd}
            className="flex items-center gap-1.5 px-3 py-2 w-full text-sm font-medium text-surface-500 border border-dashed border-surface-300 hover:border-orange-300 hover:text-orange-600 hover:bg-orange-50/50 rounded-md transition-colors"
          >
            <Plus size={16} />
            Add Exclusion
          </button>
        </div>
      )}
    </div>
  )
}
