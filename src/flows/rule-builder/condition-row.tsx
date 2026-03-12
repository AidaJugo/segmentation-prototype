import { useState } from 'react'
import { ChevronRight, X, Pencil } from 'lucide-react'
import type { Condition, Dimension, Operator, BucketDefinition } from '../../types'
import { DimensionValuePicker } from '../../components/shared/dimension-value-picker'

interface ConditionRowProps {
  condition: Condition
  dimensions: Dimension[]
  bucketDefinitions?: Record<number, BucketDefinition[]>
  claimedValues?: Record<number, { value: string; segmentName: string }[]>
  onChange: (condition: Condition) => void
  onRemove: () => void
  variant?: 'default' | 'exception'
  summary?: string
  startExpanded?: boolean
}

const defaultOperatorForDimension = (dim: Dimension): Operator =>
  dim.dimensionType === 'range' ? 'BETWEEN' : 'IN'

export function ConditionRow({
  condition,
  dimensions,
  bucketDefinitions = {},
  claimedValues = {},
  onChange,
  onRemove,
  variant = 'default',
  summary,
  startExpanded = false,
}: ConditionRowProps) {
  const hasValues = condition.values.length > 0 || condition.numericRange !== undefined
  const [expanded, setExpanded] = useState(startExpanded || !hasValues)

  const dimension = dimensions.find(d => d.dimensionId === condition.dimensionId)
  const selectedDim = dimension ?? dimensions[0]

  const handleDimensionChange = (dimensionId: number) => {
    const dim = dimensions.find(d => d.dimensionId === dimensionId)
    if (!dim) return
    onChange({
      ...condition,
      dimensionId: dim.dimensionId,
      dimensionColumn: dim.dimensionColumn,
      operator: defaultOperatorForDimension(dim),
      values: [],
      numericRange: undefined,
    })
  }

  const handleOperatorChange = (op: Operator) => {
    onChange({ ...condition, operator: op })
  }

  const handleValuesChange = (values: string[]) => {
    onChange({ ...condition, values })
  }

  const handleRangeChange = (range: { min: number; max: number }) => {
    onChange({ ...condition, numericRange: range })
  }

  if (dimensions.length === 0) return null

  const borderClass =
    variant === 'exception'
      ? 'border-orange-200 bg-orange-50/30'
      : 'border-surface-200 bg-white'

  if (!expanded && summary && hasValues) {
    return (
      <div className={`flex items-center gap-2 px-3 py-2 border rounded-md ${borderClass} group`}>
        <ChevronRight size={14} className="shrink-0 text-surface-400" />
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="flex-1 text-left text-sm text-surface-600 truncate"
        >
          {summary}
        </button>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            type="button"
            onClick={() => setExpanded(true)}
            className="p-1 rounded text-surface-400 hover:text-surface-600 hover:bg-surface-100"
            aria-label="Edit condition"
          >
            <Pencil size={14} />
          </button>
          <button
            type="button"
            onClick={onRemove}
            className="p-1 rounded text-surface-400 hover:text-red-500 hover:bg-red-50"
            aria-label="Remove condition"
          >
            <X size={14} />
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className={`p-3 border rounded-md ${borderClass}`}>
      <div className="flex items-start gap-2">
        <div className="flex-1 min-w-0 space-y-2">
          <select
            value={condition.dimensionId}
            onChange={e => handleDimensionChange(Number(e.target.value))}
            className="w-full text-sm border border-surface-300 rounded px-2 py-1.5 text-surface-700 bg-white"
          >
            {dimensions.map(d => (
              <option key={d.dimensionId} value={d.dimensionId}>
                {d.dimensionName}
              </option>
            ))}
          </select>

          <DimensionValuePicker
            dimension={selectedDim}
            operator={condition.operator}
            selectedValues={condition.values}
            numericRange={condition.numericRange}
            bucketDefinitions={bucketDefinitions[selectedDim.dimensionId]}
            claimedValues={claimedValues[selectedDim.dimensionId]}
            onValuesChange={handleValuesChange}
            onRangeChange={handleRangeChange}
            onOperatorChange={handleOperatorChange}
          />
        </div>

        <button
          type="button"
          onClick={onRemove}
          className="flex-shrink-0 p-1 rounded text-surface-400 hover:text-red-500 hover:bg-red-50 transition-colors"
          aria-label="Remove condition"
        >
          <X size={16} />
        </button>
      </div>

      {hasValues && (
        <div className="flex justify-end mt-2 pt-2 border-t border-surface-100">
          <button
            type="button"
            onClick={() => setExpanded(false)}
            className="px-3 py-1 text-xs font-medium text-white bg-primary-600 hover:bg-primary-700 rounded transition-colors"
          >
            Done
          </button>
        </div>
      )}
    </div>
  )
}
