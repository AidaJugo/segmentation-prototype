import { useState, useRef, useEffect } from 'react'
import { ChevronDown } from 'lucide-react'
import type { Dimension, Operator, BucketDefinition } from '../../types'

interface ClaimedValue {
  value: string
  segmentName: string
}

interface DimensionValuePickerProps {
  dimension: Dimension
  operator: Operator
  selectedValues: string[]
  numericRange?: { min: number; max: number }
  bucketDefinitions?: BucketDefinition[]
  claimedValues?: ClaimedValue[]
  onValuesChange: (values: string[]) => void
  onRangeChange: (range: { min: number; max: number }) => void
  onOperatorChange: (op: Operator) => void
}

const listOperators: { value: Operator; label: string }[] = [
  { value: 'IN', label: 'is any of' },
  { value: 'NOT_IN', label: 'is not' },
]

const rangeOperators: { value: Operator; label: string }[] = [
  { value: 'BETWEEN', label: 'between' },
  { value: 'GT', label: 'greater than' },
  { value: 'GTE', label: 'at least' },
  { value: 'LT', label: 'less than' },
  { value: 'LTE', label: 'at most' },
]

function formatRangeValue(value: number | null): string {
  if (value === null) return '—'
  return new Intl.NumberFormat('en-US').format(value)
}

function ValueDropdown({
  values,
  labels,
  selectedValues,
  claimedValues,
  onValuesChange,
}: {
  values: string[]
  labels?: string[]
  selectedValues: string[]
  claimedValues?: ClaimedValue[]
  onValuesChange: (values: string[]) => void
}) {
  const claimedMap = new Map(claimedValues?.map(c => [c.value, c.segmentName]) ?? [])
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [open])

  const filteredValues = values.filter((v, i) => {
    const q = search.toLowerCase()
    if (v.toLowerCase().includes(q)) return true
    if (labels && labels[i]?.toLowerCase().includes(q)) return true
    return false
  })

  const label = selectedValues.length === 0
    ? 'Select values...'
    : selectedValues.length <= 3
      ? selectedValues.join(', ')
      : `${selectedValues.slice(0, 2).join(', ')} +${selectedValues.length - 2} more`

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between gap-2 text-sm border border-surface-300 rounded px-2 py-1.5 text-surface-700 bg-white hover:bg-surface-50 text-left"
      >
        <span className={`truncate ${selectedValues.length === 0 ? 'text-surface-400' : ''}`}>
          {label}
        </span>
        <ChevronDown size={14} className={`shrink-0 text-surface-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute z-30 left-0 right-0 mt-1 bg-white border border-surface-200 rounded-md shadow-lg">
          {values.length > 6 && (
            <div className="p-1.5 border-b border-surface-100">
              <input
                autoFocus
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search..."
                className="w-full text-sm border border-surface-300 rounded px-2 py-1 text-surface-700"
              />
            </div>
          )}
          <div className="max-h-[180px] overflow-y-auto py-1">
            {filteredValues.map(value => {
              const idx = values.indexOf(value)
              const displayLabel = labels && idx >= 0 ? labels[idx] : value
              const claimedBy = claimedMap.get(value)
              return (
                <label
                  key={value}
                  className={`flex items-center gap-2 px-2.5 py-1.5 text-sm ${
                    claimedBy
                      ? 'text-surface-400 cursor-not-allowed'
                      : 'text-surface-700 hover:bg-surface-50 cursor-pointer'
                  }`}
                  title={claimedBy ? `Used by ${claimedBy}` : undefined}
                >
                  <input
                    type="checkbox"
                    checked={selectedValues.includes(value)}
                    disabled={!!claimedBy}
                    onChange={e => {
                      if (e.target.checked) {
                        onValuesChange([...selectedValues, value])
                      } else {
                        onValuesChange(selectedValues.filter(v => v !== value))
                      }
                    }}
                    className="rounded border-surface-300"
                  />
                  <span className="flex-1 truncate">{displayLabel}</span>
                  {claimedBy && (
                    <span className="text-[10px] text-surface-400 shrink-0">{claimedBy}</span>
                  )}
                </label>
              )
            })}
          </div>
          {selectedValues.length > 0 && (
            <div className="flex items-center justify-between px-2.5 py-1.5 border-t border-surface-100 text-xs">
              <span className="text-surface-500">{selectedValues.length} selected</span>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="text-primary-600 font-medium hover:text-primary-700"
              >
                Done
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function computeStep(min: number | null, max: number | null): string {
  const range = Math.abs((max ?? 0) - (min ?? 0))
  if (range === 0) return 'any'
  if (range < 0.1) return '0.0001'
  if (range < 1) return '0.001'
  if (range < 10) return '0.01'
  if (range < 100) return '0.1'
  if (range < 10000) return '1'
  return '100'
}

export function DimensionValuePicker({
  dimension,
  operator,
  selectedValues,
  numericRange,
  bucketDefinitions,
  claimedValues,
  onValuesChange,
  onRangeChange,
  onOperatorChange,
}: DimensionValuePickerProps) {
  const hasBuckets = bucketDefinitions && bucketDefinitions.length >= 2 &&
    bucketDefinitions.every(b => b.name.trim() !== '')

  if (dimension.dimensionType === 'range' && hasBuckets) {
    const bucketNames = bucketDefinitions!.map(b => b.name)
    const fmt = (n: number) => new Intl.NumberFormat('en-US').format(n)
    const bucketLabels = bucketDefinitions!.map(b =>
      `${b.name} (${fmt(b.range.min)} – ${fmt(b.range.max)})`
    )

    return (
      <div className="flex flex-col gap-2">
        <select
          value={operator}
          onChange={e => onOperatorChange(e.target.value as Operator)}
          className="text-sm border border-surface-300 rounded px-2 py-1.5 text-surface-700 bg-white"
        >
          {listOperators.map(op => (
            <option key={op.value} value={op.value}>{op.label}</option>
          ))}
        </select>

        <ValueDropdown
          values={bucketNames}
          labels={bucketLabels}
          selectedValues={selectedValues}
          claimedValues={claimedValues}
          onValuesChange={onValuesChange}
        />
        <div className="text-xs text-surface-400">
          Selecting from defined buckets. Change buckets in Dimensions settings.
        </div>
      </div>
    )
  }

  const operators = dimension.dimensionType === 'list' ? listOperators : rangeOperators

  if (dimension.dimensionType === 'list' && dimension.values) {
    return (
      <div className="flex flex-col gap-2">
        <select
          value={operator}
          onChange={e => onOperatorChange(e.target.value as Operator)}
          className="text-sm border border-surface-300 rounded px-2 py-1.5 text-surface-700 bg-white"
        >
          {operators.map(op => (
            <option key={op.value} value={op.value}>{op.label}</option>
          ))}
        </select>

        <ValueDropdown
          values={dimension.values}
          selectedValues={selectedValues}
          claimedValues={claimedValues}
          onValuesChange={onValuesChange}
        />
      </div>
    )
  }

  const step = computeStep(dimension.minValue, dimension.maxValue)

  return (
    <div className="flex flex-col gap-2">
      <select
        value={operator}
        onChange={e => onOperatorChange(e.target.value as Operator)}
        className="text-sm border border-surface-300 rounded px-2 py-1.5 text-surface-700 bg-white"
      >
        {operators.map(op => (
          <option key={op.value} value={op.value}>{op.label}</option>
        ))}
      </select>

      <div className="flex items-center gap-2">
        {(operator === 'BETWEEN' || operator === 'GT' || operator === 'GTE') && (
          <div className="flex-1">
            <label className="text-xs text-surface-500 mb-0.5 block">
              {operator === 'BETWEEN' ? 'Min' : 'Value'}
            </label>
            <input
              type="number"
              step={step}
              value={numericRange?.min ?? ''}
              placeholder={`e.g. ${dimension.minValue ?? 0}`}
              onChange={e => onRangeChange({
                min: e.target.value === '' ? 0 : parseFloat(e.target.value),
                max: numericRange?.max ?? 0,
              })}
              className="w-full text-sm border border-surface-300 rounded px-2 py-1.5 text-surface-700"
            />
          </div>
        )}
        {(operator === 'BETWEEN' || operator === 'LT' || operator === 'LTE') && (
          <div className="flex-1">
            <label className="text-xs text-surface-500 mb-0.5 block">
              {operator === 'BETWEEN' ? 'Max' : 'Value'}
            </label>
            <input
              type="number"
              step={step}
              value={numericRange?.max ?? ''}
              placeholder={`e.g. ${dimension.maxValue ?? 0}`}
              onChange={e => onRangeChange({
                min: numericRange?.min ?? 0,
                max: e.target.value === '' ? 0 : parseFloat(e.target.value),
              })}
              className="w-full text-sm border border-surface-300 rounded px-2 py-1.5 text-surface-700"
            />
          </div>
        )}
      </div>

      <div className="text-xs text-surface-400">
        Range: {formatRangeValue(dimension.minValue)} to {formatRangeValue(dimension.maxValue)}
      </div>
    </div>
  )
}
