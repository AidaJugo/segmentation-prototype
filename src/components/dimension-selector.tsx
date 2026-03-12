import { useState, useMemo } from 'react'
import { Search, ChevronDown, ChevronRight, AlertCircle, Plus, Trash2, Info } from 'lucide-react'
import type { Dimension, DimensionCategory, BucketDefinition } from '../types'

interface DimensionSelectorProps {
  dimensions: Dimension[]
  selectedIds: Set<number>
  bucketDefinitions: Record<number, BucketDefinition[]>
  onToggle: (dimId: number) => void
  onSetBuckets: (dimId: number, buckets: BucketDefinition[]) => void
  onClose: () => void
  introMessage?: string
}

const categoryLabels: Record<DimensionCategory, string> = {
  characteristic: 'Characteristics',
  measure: 'Measures (Numeric)',
  flag: 'Flags',
  temporal: 'Temporal',
  identifier: 'Identifiers',
}

const categoryDescriptions: Record<DimensionCategory, string> = {
  characteristic: 'Categorical attributes like product codes, ratings, and statuses',
  measure: 'Continuous numeric values that require bucketing before use in rules',
  flag: 'Boolean or binary attributes',
  temporal: 'Date and time-related dimensions',
  identifier: 'Unique identifiers — not suitable for segmentation',
}

function formatCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
  return String(n)
}

function generateBucketId(): string {
  return `bkt-${Math.random().toString(36).substring(2, 9)}`
}

function BucketEditor({
  dimension,
  buckets,
  onSetBuckets,
}: {
  dimension: Dimension
  buckets: BucketDefinition[]
  onSetBuckets: (buckets: BucketDefinition[]) => void
}) {
  const addBucket = () => {
    const lastMax = buckets.length > 0 ? buckets[buckets.length - 1].range.max : (dimension.minValue ?? 0)
    const newMax = dimension.maxValue ?? lastMax + 1000
    const step = (newMax - lastMax) / 2
    onSetBuckets([
      ...buckets,
      {
        id: generateBucketId(),
        name: '',
        dimensionId: dimension.dimensionId,
        range: { min: lastMax, max: Math.round(lastMax + step) },
      },
    ])
  }

  const updateBucket = (idx: number, updates: Partial<BucketDefinition>) => {
    const next = [...buckets]
    next[idx] = { ...next[idx], ...updates }
    onSetBuckets(next)
  }

  const removeBucket = (idx: number) => {
    onSetBuckets(buckets.filter((_, i) => i !== idx))
  }

  const fmt = (n: number | null) => n !== null ? new Intl.NumberFormat('en-US').format(n) : '?'

  return (
    <div className="mt-2 pl-7 space-y-2">
      <div className="flex items-center gap-2 text-xs text-surface-500">
        <Info size={12} />
        <span>Define named ranges to use this dimension in rules. Range: {fmt(dimension.minValue)} to {fmt(dimension.maxValue)}</span>
      </div>

      {buckets.map((bucket, idx) => (
        <div key={bucket.id} className="flex items-center gap-2">
          <input
            type="text"
            value={bucket.name}
            onChange={e => updateBucket(idx, { name: e.target.value })}
            placeholder="Bucket name..."
            className="w-36 text-sm border border-surface-300 rounded px-2 py-1 text-surface-700"
          />
          <input
            type="number"
            value={bucket.range.min}
            onChange={e => updateBucket(idx, { range: { ...bucket.range, min: parseFloat(e.target.value) || 0 } })}
            className="w-24 text-sm border border-surface-300 rounded px-2 py-1 text-surface-700 text-right"
          />
          <span className="text-xs text-surface-400">to</span>
          <input
            type="number"
            value={bucket.range.max}
            onChange={e => updateBucket(idx, { range: { ...bucket.range, max: parseFloat(e.target.value) || 0 } })}
            className="w-24 text-sm border border-surface-300 rounded px-2 py-1 text-surface-700 text-right"
          />
          <button
            type="button"
            onClick={() => removeBucket(idx)}
            className="p-1 text-surface-400 hover:text-red-500"
          >
            <Trash2 size={14} />
          </button>
        </div>
      ))}

      <button
        type="button"
        onClick={addBucket}
        className="flex items-center gap-1 text-xs text-primary-600 hover:text-primary-700 font-medium"
      >
        <Plus size={12} /> Add bucket
      </button>

      {buckets.length > 0 && buckets.length < 2 && (
        <div className="flex items-center gap-1 text-xs text-amber-600">
          <AlertCircle size={12} />
          Define at least 2 buckets to use this dimension in rules
        </div>
      )}
    </div>
  )
}

function CategorySection({
  category,
  dimensions,
  selectedIds,
  bucketDefinitions,
  onToggle,
  onSetBuckets,
  isSearching,
}: {
  category: DimensionCategory
  dimensions: Dimension[]
  selectedIds: Set<number>
  bucketDefinitions: Record<number, BucketDefinition[]>
  onToggle: (dimId: number) => void
  onSetBuckets: (dimId: number, buckets: BucketDefinition[]) => void
  isSearching?: boolean
}) {
  const [expanded, setExpanded] = useState(false)
  const isOpen = expanded || !!isSearching
  const selectedCount = dimensions.filter(d => selectedIds.has(d.dimensionId)).length
  const isDisabledCategory = category === 'identifier'

  return (
    <div className="border border-surface-200 rounded-md overflow-hidden">
      <button
        type="button"
        onClick={() => setExpanded(!isOpen)}
        className="w-full flex items-center gap-2 px-3 py-2 bg-surface-50 hover:bg-surface-100 transition-colors text-left"
      >
        {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        <span className="font-medium text-sm text-surface-700">{categoryLabels[category]}</span>
        <span className="text-xs text-surface-400">({dimensions.length})</span>
        {selectedCount > 0 && (
          <span className="ml-auto text-xs font-medium text-primary-600 bg-primary-50 px-1.5 py-0.5 rounded">
            {selectedCount} selected
          </span>
        )}
      </button>

      {isOpen && (
        <div className="divide-y divide-surface-100">
          <div className="px-3 py-1.5 text-xs text-surface-400 bg-surface-25">
            {categoryDescriptions[category]}
          </div>
          {dimensions.map(dim => {
            const isSelected = selectedIds.has(dim.dimensionId)
            const needsBuckets = dim.dimensionType === 'range' && isSelected
            const buckets = bucketDefinitions[dim.dimensionId] ?? []
            const bucketsReady = buckets.length >= 2 && buckets.every(b => b.name.trim() !== '')

            return (
              <div key={dim.dimensionId}>
                <label
                  className={`flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-surface-50 transition-colors ${
                    isDisabledCategory ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => onToggle(dim.dimensionId)}
                    disabled={!dim.segmentable}
                    className="rounded border-surface-300 text-primary-600"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-surface-700">{dim.dimensionName}</span>
                      <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${
                        dim.dimensionType === 'range'
                          ? 'bg-violet-50 text-violet-600'
                          : 'bg-sky-50 text-sky-600'
                      }`}>
                        {dim.dimensionType}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs text-surface-400 tabular-nums">
                      {dim.dimensionType === 'range' && dim.minValue != null && dim.maxValue != null
                        ? `${dim.minValue.toLocaleString()} – ${dim.maxValue.toLocaleString()}`
                        : dim.dimensionType === 'list' && dim.valueCount > 0
                          ? `${formatCount(dim.valueCount)} values`
                          : 'no data'}
                    </span>
                    {needsBuckets && !bucketsReady && (
                      <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-amber-50 text-amber-600">
                        needs buckets
                      </span>
                    )}
                    {needsBuckets && bucketsReady && (
                      <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-green-50 text-green-600">
                        {buckets.length} buckets
                      </span>
                    )}
                    {!dim.segmentable && (
                      <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-surface-100 text-surface-500">
                        not segmentable
                      </span>
                    )}
                  </div>
                </label>

                {needsBuckets && (
                  <BucketEditor
                    dimension={dim}
                    buckets={buckets}
                    onSetBuckets={b => onSetBuckets(dim.dimensionId, b)}
                  />
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export function DimensionSelector({
  dimensions,
  selectedIds,
  bucketDefinitions,
  onToggle,
  onSetBuckets,
  onClose,
  introMessage,
}: DimensionSelectorProps) {
  const [search, setSearch] = useState('')

  const filtered = useMemo(() => {
    if (!search.trim()) return dimensions
    const q = search.toLowerCase()
    return dimensions.filter(d =>
      d.dimensionName.toLowerCase().includes(q) ||
      d.dimensionColumn.toLowerCase().includes(q)
    )
  }, [dimensions, search])

  const grouped = useMemo(() => {
    const cats: DimensionCategory[] = ['characteristic', 'measure', 'flag', 'temporal', 'identifier']
    return cats
      .map(cat => ({
        category: cat,
        dimensions: filtered.filter(d => d.category === cat),
      }))
      .filter(g => g.dimensions.length > 0)
  }, [filtered])

  const totalSelected = dimensions.filter(d => selectedIds.has(d.dimensionId)).length
  const rangeSelected = dimensions.filter(d => selectedIds.has(d.dimensionId) && d.dimensionType === 'range')
  const rangeWithBuckets = rangeSelected.filter(d => {
    const b = bucketDefinitions[d.dimensionId] ?? []
    return b.length >= 2 && b.every(bk => bk.name.trim() !== '')
  })
  const pendingBuckets = rangeSelected.length - rangeWithBuckets.length

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-3 border-b border-surface-200 bg-white">
        <div>
          <h2 className="text-base font-semibold text-surface-800">Configure Dimensions</h2>
          <p className="text-xs text-surface-500 mt-0.5">
            Select which dimensions to use for segmentation rules.
            {totalSelected > 0 && ` ${totalSelected} selected.`}
            {pendingBuckets > 0 && ` ${pendingBuckets} measure${pendingBuckets > 1 ? 's' : ''} need bucket definitions.`}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-1.5 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded transition-colors"
        >
          Done
        </button>
      </div>

      <div className="px-4 py-2 border-b border-surface-100">
        <div className="relative">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-surface-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search dimensions..."
            className="w-full text-sm border border-surface-300 rounded pl-8 pr-3 py-1.5 text-surface-700"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {introMessage && (
          <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-md text-sm text-blue-800">
            <Info size={16} className="shrink-0 mt-0.5" />
            {introMessage}
          </div>
        )}
        {grouped.map(({ category, dimensions: catDims }) => (
          <CategorySection
            key={category}
            category={category}
            dimensions={catDims}
            selectedIds={selectedIds}
            bucketDefinitions={bucketDefinitions}
            onToggle={onToggle}
            onSetBuckets={onSetBuckets}
            isSearching={search.trim().length > 0}
          />
        ))}

        {filtered.length === 0 && (
          <div className="text-center py-8 text-surface-400 text-sm">
            No dimensions match "{search}"
          </div>
        )}
      </div>
    </div>
  )
}
