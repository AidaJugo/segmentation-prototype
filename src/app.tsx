import { useState, useMemo, useCallback } from 'react'
import { Routes, Route } from 'react-router-dom'
import { FolderOpen, Settings, AlertCircle, TableProperties, SlidersHorizontal, CircleOff } from 'lucide-react'
import { SidebarNav } from './components/layout/sidebar-nav'
import { PageHeader } from './components/layout/page-header'
import { SegmentTree } from './components/tree/segment-tree'
import { BalancePreview } from './components/shared/balance-preview'
import { MatchedInstruments } from './components/shared/matched-instruments'
import { UnassignedView } from './components/shared/unassigned-view'
import { OverlapView } from './components/shared/overlap-view'
import { DimensionSelector } from './components/dimension-selector'
import { RuleBuilderPanel } from './flows/rule-builder/rule-builder-panel'
import { useSegmentStore, useTimingStore } from './store'
import { computeBalanceSummary, findOverlappingInstruments, matchesRule } from './utils/filter-engine'
import dimensionsData from './data/dimensions.json'
import instrumentsData from './data/instruments.json'
import type { Dimension, Instrument, SegmentRule } from './types'
import { ruleHasConditions } from './types'

const allDimensions = dimensionsData as Dimension[]
const instruments = instrumentsData as Instrument[]

function ParentNodeMessage({ segmentName }: { segmentName: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[200px] text-surface-500 p-8">
      <FolderOpen size={40} className="mb-3 opacity-50" />
      <p className="text-sm text-center font-medium text-surface-600 mb-1">{segmentName}</p>
      <p className="text-sm text-center">This is a group node. Select a leaf segment below to define mapping.</p>
    </div>
  )
}

function ApproachLayout() {
  const store = useSegmentStore()
  const timing = useTimingStore()
  const [showOverlaps, setShowOverlaps] = useState(false)
  const [showDimConfig, setShowDimConfig] = useState(false)
  const [showFirstTimeDimSelector, setShowFirstTimeDimSelector] = useState(false)
  const [activeTab, setActiveTab] = useState<'instruments' | 'unassigned' | 'rules'>('rules')

  const activeGroup = store.selectedGroup
  const groupHasDimensions = activeGroup && activeGroup.selectedDimensionIds.length > 0

  const dimensions = useMemo(() => {
    if (!activeGroup) return []
    const ids = new Set(activeGroup.selectedDimensionIds)
    return allDimensions.filter(d => ids.has(d.dimensionId))
  }, [activeGroup])

  const bucketDefinitions = activeGroup?.bucketDefinitions ?? {}

  const allSavedRules = useMemo(() => {
    return Object.values(store.allSegments)
      .filter(s => ruleHasConditions(s.savedRule))
      .map(s => ({ segmentId: s.id, rule: s.savedRule as SegmentRule }))
  }, [store.allSegments])

  const savedRule = store.selectedSegment?.savedRule ?? null
  const currentRule = store.selectedSegment?.rule ?? null

  const hasUnsavedChanges = useMemo(() => {
    if (!currentRule && !savedRule) return false
    if (!currentRule || !savedRule) return true
    return JSON.stringify(currentRule) !== JSON.stringify(savedRule)
  }, [currentRule, savedRule])

  const groupSummary = useMemo(
    () => computeBalanceSummary(instruments, null, allSavedRules, bucketDefinitions),
    [allSavedRules, bucketDefinitions]
  )

  const groupHasSavedRules = allSavedRules.length > 0

  const overlaps = useMemo(
    () => findOverlappingInstruments(instruments, allSavedRules, bucketDefinitions),
    [allSavedRules, bucketDefinitions]
  )

  const unassignedInstruments = useMemo(() => {
    const assignedIds = new Set<number>()
    for (const { rule } of allSavedRules) {
      for (const inst of instruments) {
        if (matchesRule(inst, rule, bucketDefinitions)) assignedIds.add(inst.id)
      }
    }
    return instruments.filter(inst => !assignedIds.has(inst.id))
  }, [allSavedRules, bucketDefinitions])

  const handleRuleChange = useCallback((rule: SegmentRule | null) => {
    if (store.selectedSegmentId) {
      store.updateSegmentRule(store.selectedSegmentId, rule)
      timing.recordAction(store.selectedSegmentId, 'rule-change')
    }
  }, [store, timing])

  const handleSaveRule = useCallback(() => {
    if (store.selectedSegmentId) {
      store.saveSegmentRule(store.selectedSegmentId)
      setActiveTab('instruments')
    }
  }, [store])

  const handleMnemonicChange = useCallback((mnemonic: string) => {
    if (store.selectedSegmentId) {
      store.updateSegmentMnemonic(store.selectedSegmentId, mnemonic)
    }
  }, [store])

  const handleSelectSegment = useCallback((id: string) => {
    store.setSelectedSegmentId(id)
    const seg = store.allSegments[id]
    if (seg?.isLeaf) {
      timing.startTiming(id, 'rule-builder')
      const hasSaved = ruleHasConditions(seg.savedRule)
      setActiveTab(hasSaved ? 'instruments' : 'rules')
      const group = store.groups.find(g => g.segments[id])
      if (group && group.selectedDimensionIds.length === 0) {
        setShowFirstTimeDimSelector(true)
      }
    }
  }, [store, timing])

  const handleToggleDimension = useCallback((dimId: number) => {
    if (!activeGroup) return
    store.toggleGroupDimension(activeGroup.id, dimId)
  }, [activeGroup, store])

  const handleSetBuckets = useCallback((dimId: number, buckets: import('./types').BucketDefinition[]) => {
    if (!activeGroup) return
    store.updateGroupBuckets(activeGroup.id, dimId, buckets)
  }, [activeGroup, store])

  const handleDimConfigDone = useCallback(() => {
    setShowDimConfig(false)
    setShowFirstTimeDimSelector(false)
  }, [])

  const isParentSelected = store.selectedSegment && !store.selectedSegment.isLeaf
  const segmentForPanel = store.selectedSegment?.isLeaf ? store.selectedSegment : null

  if (showDimConfig && activeGroup) {
    const selectedIds = new Set(activeGroup.selectedDimensionIds)
    return (
      <div className="flex flex-col flex-1 min-h-0">
        <PageHeader title="Loan IQ - Segmentation" />
        <DimensionSelector
          dimensions={allDimensions}
          selectedIds={selectedIds}
          bucketDefinitions={activeGroup.bucketDefinitions}
          onToggle={handleToggleDimension}
          onSetBuckets={handleSetBuckets}
          onClose={handleDimConfigDone}
        />
      </div>
    )
  }

  if (showFirstTimeDimSelector && activeGroup) {
    const selectedIds = new Set(activeGroup.selectedDimensionIds)
    return (
      <div className="flex flex-col flex-1 min-h-0">
        <PageHeader title="Loan IQ - Segmentation" />
        <div className="flex flex-1 min-h-0">
          <SegmentTree
            groups={store.groups}
            selectedSegmentId={store.selectedSegmentId}
            onSelectSegment={handleSelectSegment}
            onAddGroup={store.addGroup}
            onRemoveGroup={store.removeGroup}
            onAddSegment={store.addSegment}
            onRenameSegment={store.renameSegment}
            onDeleteSegment={store.removeSegment}
            onUpdateGroupMnemonic={store.updateGroupMnemonic}
          />
          <div className="flex-1 min-h-0">
            <DimensionSelector
              dimensions={allDimensions}
              selectedIds={selectedIds}
              bucketDefinitions={activeGroup.bucketDefinitions}
              onToggle={handleToggleDimension}
              onSetBuckets={handleSetBuckets}
              onClose={handleDimConfigDone}
              introMessage="Before defining rules, select which dimensions you want to use for segmentation in this group."
            />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <PageHeader title="Loan IQ - Segmentation">
        {groupHasDimensions && (
          <button
            type="button"
            onClick={() => setShowDimConfig(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-surface-600 hover:text-surface-800 bg-surface-100 hover:bg-surface-200 rounded transition-colors"
          >
            <Settings size={14} />
            Dimensions ({dimensions.length})
          </button>
        )}
      </PageHeader>

      <div className="flex flex-1 min-h-0">
        <SegmentTree
          groups={store.groups}
          selectedSegmentId={store.selectedSegmentId}
          onSelectSegment={handleSelectSegment}
          onAddGroup={store.addGroup}
          onRemoveGroup={store.removeGroup}
          onAddSegment={store.addSegment}
          onRenameSegment={store.renameSegment}
          onDeleteSegment={store.removeSegment}
          onUpdateGroupMnemonic={store.updateGroupMnemonic}
        />

        <div className="flex flex-col flex-1 min-h-0">
          {isParentSelected ? (
            <div className="flex-1 overflow-y-auto p-4">
              <ParentNodeMessage segmentName={store.selectedSegment!.name} />
            </div>
          ) : segmentForPanel ? (
            <>
              {ruleHasConditions(segmentForPanel.savedRule) && (
                <div className="flex items-center border-b border-surface-200 px-4 pt-3 gap-1" role="tablist">
                  <button
                    role="tab"
                    aria-selected={activeTab === 'instruments'}
                    onClick={() => setActiveTab('instruments')}
                    className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-t-md border border-b-0 transition-colors ${
                      activeTab === 'instruments'
                        ? 'bg-white text-primary-700 border-surface-200'
                        : 'bg-surface-50 text-surface-500 border-transparent hover:text-surface-700'
                    }`}
                  >
                    <TableProperties size={14} />
                    Instruments
                  </button>
                  <button
                    role="tab"
                    aria-selected={activeTab === 'unassigned'}
                    onClick={() => setActiveTab('unassigned')}
                    className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-t-md border border-b-0 transition-colors ${
                      activeTab === 'unassigned'
                        ? 'bg-white text-primary-700 border-surface-200'
                        : 'bg-surface-50 text-surface-500 border-transparent hover:text-surface-700'
                    }`}
                  >
                    <CircleOff size={14} />
                    Unassigned
                    {unassignedInstruments.length > 0 && (
                      <span className="text-xs text-surface-400">({unassignedInstruments.length})</span>
                    )}
                  </button>
                  <button
                    role="tab"
                    aria-selected={activeTab === 'rules'}
                    onClick={() => setActiveTab('rules')}
                    className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-t-md border border-b-0 transition-colors ${
                      activeTab === 'rules'
                        ? 'bg-white text-primary-700 border-surface-200'
                        : 'bg-surface-50 text-surface-500 border-transparent hover:text-surface-700'
                    }`}
                  >
                    <SlidersHorizontal size={14} />
                    Rules
                    {hasUnsavedChanges && (
                      <span className="w-2 h-2 rounded-full bg-amber-500" title="Unsaved changes" />
                    )}
                  </button>
                </div>
              )}

              <div className="flex-1 overflow-y-auto">
                {activeTab === 'instruments' && ruleHasConditions(segmentForPanel.savedRule) ? (
                  <div className="p-4">
                    {hasUnsavedChanges && (
                      <div className="flex items-center gap-1.5 px-3 py-1.5 mb-3 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-md">
                        <AlertCircle size={12} className="shrink-0" />
                        Rule has unsaved changes. Save to update results.
                      </div>
                    )}
                    <MatchedInstruments
                      instruments={instruments}
                      rule={segmentForPanel.savedRule!}
                      dimensions={dimensions}
                      bucketDefinitions={bucketDefinitions}
                      startExpanded
                    />
                  </div>
                ) : activeTab === 'unassigned' && ruleHasConditions(segmentForPanel.savedRule) ? (
                  <UnassignedView
                    instruments={unassignedInstruments}
                    dimensions={dimensions}
                    inline
                  />
                ) : (
                  <div className="p-4">
                    <RuleBuilderPanel
                      segment={segmentForPanel}
                      dimensions={dimensions}
                      bucketDefinitions={bucketDefinitions}
                      rule={segmentForPanel.rule ?? null}
                      onRuleChange={handleRuleChange}
                      onSave={handleSaveRule}
                      onMnemonicChange={handleMnemonicChange}
                    />
                  </div>
                )}
              </div>

            </>
          ) : (
            <div className="flex-1 overflow-y-auto p-4">
              <RuleBuilderPanel
                segment={null}
                dimensions={dimensions}
                bucketDefinitions={bucketDefinitions}
                rule={null}
                onRuleChange={handleRuleChange}
                onSave={handleSaveRule}
                onMnemonicChange={handleMnemonicChange}
              />
            </div>
          )}

          {groupHasSavedRules && (
            <BalancePreview
              summary={groupSummary}
              overlapCount={overlaps.length}
              onShowUnassigned={() => {
                if (segmentForPanel) setActiveTab('unassigned')
              }}
              onShowOverlaps={() => setShowOverlaps(true)}
            />
          )}
        </div>
      </div>

      {showOverlaps && (
        <OverlapView
          overlaps={overlaps}
          instruments={instruments}
          segments={store.allSegments}
          dimensions={dimensions}
          onClose={() => setShowOverlaps(false)}
        />
      )}
    </div>
  )
}

export function App() {
  return (
    <div className="flex h-screen bg-white">
      <SidebarNav />
      <main className="flex flex-col flex-1 min-h-0">
        <Routes>
          <Route path="/" element={<ApproachLayout />} />
        </Routes>
      </main>
    </div>
  )
}
