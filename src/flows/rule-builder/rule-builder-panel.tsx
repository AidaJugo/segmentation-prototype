import { useMemo, useState, useCallback } from 'react'
import { Layers, Plus, AlertTriangle, Check, Pencil, Trash2 } from 'lucide-react'
import type { Condition, ConditionGroup, Dimension, Segment, SegmentRule, BucketDefinition } from '../../types'
import { ConditionRow } from './condition-row'
import { ExcludingSection } from './excluding-section'
import { summarizeCondition } from './summarize-condition'
import { detectConflicts } from '../../utils/filter-engine'

function generateId(): string {
  return Math.random().toString(36).substring(2, 9)
}

const newCondition = (dimensions: Dimension[]): Condition => {
  const dim = dimensions[0]
  const defaultOp = dim?.dimensionType === 'list' ? 'IN' : 'BETWEEN'
  return {
    id: generateId(),
    dimensionId: dim?.dimensionId ?? 0,
    dimensionColumn: dim?.dimensionColumn ?? '',
    operator: defaultOp,
    values: [],
    numericRange: undefined,
  }
}

const newGroup = (dimensions: Dimension[]): ConditionGroup => ({
  id: generateId(),
  conditions: [newCondition(dimensions)],
})

interface RuleBuilderPanelProps {
  segment: Segment | null
  rule: SegmentRule | null
  dimensions: Dimension[]
  bucketDefinitions?: Record<number, BucketDefinition[]>
  claimedValues?: Record<number, { value: string; segmentName: string }[]>
  onRuleChange: (rule: SegmentRule) => void
  onSave?: () => void
  onMnemonicChange?: (mnemonic: string) => void
}

export function RuleBuilderPanel({
  segment,
  rule,
  dimensions,
  bucketDefinitions = {},
  claimedValues = {},
  onRuleChange,
  onSave,
  onMnemonicChange,
}: RuleBuilderPanelProps) {
  const groups = rule?.groups ?? []
  const exclusions = rule?.exclusions ?? []
  const [newConditionIds, setNewConditionIds] = useState<Set<string>>(new Set())
  const [saved, setSaved] = useState(false)
  const [editingMnemonic, setEditingMnemonic] = useState(false)
  const [mnemonicDraft, setMnemonicDraft] = useState('')

  const conflicts = useMemo(
    () => rule ? detectConflicts(rule) : [],
    [rule]
  )

  const handleSave = useCallback(() => {
    onSave?.()
    setNewConditionIds(new Set())
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }, [onSave])

  if (!segment) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[200px] text-surface-500 p-8">
        <Layers size={40} className="mb-3 opacity-50" />
        <p className="text-sm text-center">Select a leaf segment to define rules</p>
      </div>
    )
  }

  const hasAnyValues = groups.some(g =>
    g.conditions.some(c => c.values.length > 0 || c.numericRange !== undefined)
  )

  const handleAddConditionToGroup = (groupIndex: number) => {
    const next = newCondition(dimensions)
    setNewConditionIds(prev => new Set(prev).add(next.id))
    const nextGroups = structuredClone(groups)
    nextGroups[groupIndex].conditions.push(next)
    onRuleChange({ groups: nextGroups, exclusions })
  }

  const handleConditionChange = (groupIndex: number, condIndex: number, condition: Condition) => {
    const nextGroups = structuredClone(groups)
    nextGroups[groupIndex].conditions[condIndex] = condition
    onRuleChange({ groups: nextGroups, exclusions })
  }

  const handleRemoveCondition = (groupIndex: number, condIndex: number) => {
    const nextGroups = structuredClone(groups)
    nextGroups[groupIndex].conditions.splice(condIndex, 1)
    if (nextGroups[groupIndex].conditions.length === 0) {
      nextGroups.splice(groupIndex, 1)
    }
    onRuleChange({ groups: nextGroups, exclusions })
  }

  const handleAddOrGroup = () => {
    const group = newGroup(dimensions)
    setNewConditionIds(prev => new Set(prev).add(group.conditions[0].id))
    onRuleChange({ groups: [...groups, group], exclusions })
  }

  const handleRemoveGroup = (groupIndex: number) => {
    const nextGroups = groups.filter((_, i) => i !== groupIndex)
    onRuleChange({ groups: nextGroups, exclusions })
  }

  const handleAddFirstCondition = () => {
    const group = newGroup(dimensions)
    setNewConditionIds(prev => new Set(prev).add(group.conditions[0].id))
    onRuleChange({ groups: [group], exclusions })
  }

  const handleAddExclusion = () => {
    const next = newCondition(dimensions)
    setNewConditionIds(prev => new Set(prev).add(next.id))
    onRuleChange({ groups, exclusions: [...exclusions, next] })
  }

  const handleExclusionChange = (index: number, condition: Condition) => {
    const next = [...exclusions]
    next[index] = condition
    onRuleChange({ groups, exclusions: next })
  }

  const handleRemoveExclusion = (index: number) => {
    const next = exclusions.filter((_, i) => i !== index)
    onRuleChange({ groups, exclusions: next })
  }

  const handleStartEditMnemonic = () => {
    setMnemonicDraft(segment.mnemonic)
    setEditingMnemonic(true)
  }

  const handleSaveMnemonic = () => {
    const trimmed = mnemonicDraft.trim()
    if (trimmed && onMnemonicChange) {
      onMnemonicChange(trimmed)
    }
    setEditingMnemonic(false)
  }

  const handleMnemonicKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSaveMnemonic()
    if (e.key === 'Escape') setEditingMnemonic(false)
  }

  return (
    <div className="flex flex-col h-full">
      <header className="flex-shrink-0 pb-4 border-b border-surface-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-semibold text-surface-700">{segment.name}</h2>
            {editingMnemonic ? (
              <input
                autoFocus
                value={mnemonicDraft}
                onChange={e => setMnemonicDraft(e.target.value.toUpperCase())}
                onBlur={handleSaveMnemonic}
                onKeyDown={handleMnemonicKeyDown}
                maxLength={12}
                className="px-2 py-0.5 text-xs font-medium rounded border border-primary-400 bg-white text-surface-700 uppercase w-24 outline-none focus:ring-1 focus:ring-primary-400"
              />
            ) : (
              <button
                type="button"
                onClick={handleStartEditMnemonic}
                className="group/mne flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded bg-[#29404E] text-white hover:bg-[#3a5568] transition-colors"
                title="Click to edit mnemonic"
              >
                {segment.mnemonic}
                <Pencil size={10} className="opacity-0 group-hover/mne:opacity-100 transition-opacity" />
              </button>
            )}
          </div>
          {hasAnyValues && (
            <button
              type="button"
              onClick={handleSave}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                saved
                  ? 'bg-green-600 text-white'
                  : 'bg-primary-600 text-white hover:bg-primary-700'
              }`}
            >
              {saved ? (
                <>
                  <Check size={14} />
                  Saved
                </>
              ) : (
                'Save Rules'
              )}
            </button>
          )}
        </div>
      </header>

      <div className="flex-1 overflow-y-auto pt-4">
        <div className="mb-3">
          <h3 className="text-sm font-medium text-surface-700">Conditions</h3>
          <p className="text-xs text-surface-400 mt-0.5">
            Define which instruments belong to this segment. Groups are connected by OR; conditions within a group by AND.
          </p>
        </div>

        {conflicts.length > 0 && (
          <div className="flex items-start gap-2 px-3 py-2 mb-3 bg-amber-50 border border-amber-200 rounded-md text-xs text-amber-700">
            <AlertTriangle size={14} className="shrink-0 mt-0.5" />
            <div>
              {conflicts.map((c, i) => (
                <p key={i}>{c}</p>
              ))}
            </div>
          </div>
        )}

        {groups.length === 0 ? (
          <div className="py-4">
            <p className="text-sm text-surface-500 mb-3">
              No conditions yet. Add a condition to define which instruments belong to this segment.
            </p>
            <button
              type="button"
              onClick={handleAddFirstCondition}
              className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-[#21333E] border border-surface-300 hover:bg-surface-50 rounded-md transition-colors"
            >
              <Plus size={16} />
              Add Condition
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {groups.map((group, gi) => (
              <div key={group.id}>
                {gi > 0 && (
                  <div className="flex justify-center my-3">
                    <span className="px-3 py-1 text-xs font-bold rounded-full bg-blue-100 text-blue-700 tracking-wide">
                      OR
                    </span>
                  </div>
                )}
                <div className="border border-surface-200 rounded-lg p-3 bg-surface-50/50">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-surface-500 uppercase tracking-wider">
                      Group {gi + 1}
                    </span>
                    {groups.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveGroup(gi)}
                        className="p-1 text-surface-400 hover:text-red-500 rounded transition-colors"
                        title="Remove group"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>

                  <div className="space-y-3">
                    {group.conditions.map((cond, ci) => (
                      <div key={cond.id} className="flex flex-col gap-2">
                        {ci > 0 && (
                          <div className="flex justify-center">
                            <span className="px-2 py-0.5 text-xs font-medium rounded bg-surface-200 text-surface-600">
                              AND
                            </span>
                          </div>
                        )}
                        <ConditionRow
                          condition={cond}
                          dimensions={dimensions}
                          bucketDefinitions={bucketDefinitions}
                          claimedValues={claimedValues}
                          onChange={c => handleConditionChange(gi, ci, c)}
                          onRemove={() => handleRemoveCondition(gi, ci)}
                          summary={summarizeCondition(cond, dimensions)}
                          startExpanded={newConditionIds.has(cond.id)}
                        />
                      </div>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={() => handleAddConditionToGroup(gi)}
                    className="flex items-center gap-1.5 px-3 py-2 mt-3 w-full text-sm font-medium text-surface-500 border border-dashed border-surface-300 hover:border-surface-400 hover:text-surface-700 hover:bg-surface-50 rounded-md transition-colors"
                  >
                    <Plus size={16} />
                    Add AND Condition
                  </button>
                </div>
              </div>
            ))}

            <button
              type="button"
              onClick={handleAddOrGroup}
              className="flex items-center gap-1.5 px-3 py-2 w-full text-sm font-medium text-blue-600 border border-dashed border-blue-300 hover:border-blue-400 hover:bg-blue-50/50 rounded-md transition-colors"
            >
              <Plus size={16} />
              Add OR Group
            </button>
          </div>
        )}

        <ExcludingSection
          exclusions={exclusions}
          dimensions={dimensions}
          bucketDefinitions={bucketDefinitions}
          newExclusionIds={newConditionIds}
          onAdd={handleAddExclusion}
          onChange={handleExclusionChange}
          onRemove={handleRemoveExclusion}
        />
      </div>
    </div>
  )
}
